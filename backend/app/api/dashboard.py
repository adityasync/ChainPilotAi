from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..database import get_db
from ..services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/summary")
async def read_dashboard_summary(
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_dashboard_summary(db, company_id)
