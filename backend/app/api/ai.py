from fastapi import APIRouter, Depends, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import time
from collections import defaultdict

logger = logging.getLogger(__name__)

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..core.security import verify_access_token
from ..core.exceptions import AppError, UnauthorizedError, NotFoundError, RateLimitError, ServiceUnavailableError
from ..models.ml_models import Insight
from ..services.ai.client import get_ai_client, GLMClientError
from ..services.ai.context_builder import build_dashboard_context, build_insights_context, build_supplier_context
from ..services.ai.nl_query import stream_nl_query
from ..services.ai.insight_engine import generate_ai_insights
from ..services.ai.supplier_narrative import get_or_generate_narrative

router = APIRouter()

_rate_limits: dict[int, list[float]] = defaultdict(list)
RATE_LIMIT = 10


def _check_rate_limit(company_id: int):
    now = time.time()
    window = [t for t in _rate_limits[company_id] if now - t < 60]
    _rate_limits[company_id] = window
    if len(window) >= RATE_LIMIT:
        raise RateLimitError("Maximum 10 requests per minute")
    _rate_limits[company_id].append(now)


@router.get("/query/stream")
async def stream_query(
    question: str = Query(...),
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError("Invalid authorization header")
    token = authorization[7:]
    email = verify_access_token(token, UnauthorizedError("Invalid token"))
    company_id = await get_current_user_company_id(db, email)
    _check_rate_limit(company_id)

    client = get_ai_client()
    if not client:
        raise ServiceUnavailableError("AI service not configured. Set AI_API_KEY in .env")

    context = await build_dashboard_context(db, company_id)

    def event_stream():
        try:
            for chunk in stream_nl_query(client, context, question):
                yield f"data: {chunk}\n\n"
            yield "event: done\ndata: \n\n"
        except GLMClientError as e:
            yield f"data: Error: {e.detail}\n\n"
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
            yield "event: done\ndata: \n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/insights/generate")
async def generate_insights(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    _check_rate_limit(company_id)

    client = get_ai_client()
    if not client:
        raise ServiceUnavailableError("AI service not configured. Set AI_API_KEY in .env")

    try:
        context = await build_insights_context(db, company_id)
    except Exception as e:
        logger.error(f"Failed to build insights context: {e}")
        raise AppError(code="CONTEXT_ERROR", message=f"Failed to build context: {str(e)}", status_code=500)

    has_data = (
        context.get("inventory") or context.get("suppliers") or context.get("predictions")
    )
    if not has_data:
        return {"data": [], "message": "No inventory, supplier, or prediction data found. Add products and suppliers first, then generate insights."}

    try:
        insights = await generate_ai_insights(client, db, company_id, context)
    except GLMClientError as e:
        raise AppError(code="AI_SERVICE_ERROR", message=e.detail, status_code=502)
    except Exception as e:
        logger.error(f"Unexpected error generating insights: {e}")
        raise AppError(code="AI_ERROR", message=f"Failed to generate insights: {str(e)}", status_code=500)
    return {"data": insights}


@router.get("/suppliers/{supplier_id}/narrative")
async def get_supplier_narrative(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    client = get_ai_client()
    if not client:
        raise ServiceUnavailableError("AI service not configured. Set AI_API_KEY in .env")

    context = await build_supplier_context(db, supplier_id, company_id)
    if not context:
        raise NotFoundError("Supplier")

    try:
        narrative_data = await get_or_generate_narrative(client, db, supplier_id, company_id, context)
    except GLMClientError as e:
        raise AppError(code="AI_SERVICE_ERROR", message=e.detail, status_code=502)
    return {"data": narrative_data}
