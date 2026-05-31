import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
from .database import engine, Base
from .core.config import BACKEND_CORS_ORIGINS, ML_ARTIFACTS_PATH
from .core.exceptions import AppError
from . import models

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Supply Chain Management API",
    description="API for the ML-Powered Supply Chain SaaS Platform",
    version="1.0.0",
)


# --- SRS-compliant error envelope handlers ---

@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    body: dict = {"error": {"code": exc.code, "message": exc.detail}}
    if exc.field:
        body["error"]["field"] = exc.field
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first = errors[0]
        loc = first.get("loc", [])
        field = ".".join(str(l) for l in loc if l != "body") or None
        msg = first.get("msg", "Validation error")
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "VALIDATION_ERROR", "message": msg, "field": field}},
        )
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Validation error"}},
    )


@app.exception_handler(Exception)
async def generic_error_handler(_request: Request, _exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )


# --- CORS ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# --- CI-01: HTTP → HTTPS redirect when behind a reverse proxy ---
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP to HTTPS when X-Forwarded-Proto indicates HTTP."""
    async def dispatch(self, request: Request, call_next):
        if request.headers.get("x-forwarded-proto") == "http":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url), status_code=301)
        return await call_next(request)


if os.getenv("FORCE_HTTPS", "false").lower() in ("true", "1", "yes"):
    app.add_middleware(HTTPSRedirectMiddleware)


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Supply Chain Management API"}


# Create database tables as a dev fallback (async).
@app.on_event("startup")
async def startup_event():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ensured.")
    except Exception as e:
        logger.error("Database connection failed: %s", e)
        logger.error("Check DATABASE_URL in your environment variables.")

    # CON-07: Auto-train ML models if missing or library versions changed
    try:
        from .ml.startup import ensure_ml_ready
        ensure_ml_ready()
    except Exception as e:
        logger.error("ML auto-training failed: %s — predictions may return 503.", e)

    # Validate ML artifacts path (post-training)
    if not os.path.isdir(ML_ARTIFACTS_PATH):
        logger.warning(
            "CON-07: ML_ARTIFACTS_PATH '%s' does not exist. "
            "ML predictions will return 503 until models are trained.",
            ML_ARTIFACTS_PATH,
        )
    else:
        pkl_files = [f for f in os.listdir(ML_ARTIFACTS_PATH) if f.endswith(".pkl")]
        if not pkl_files:
            logger.warning(
                "CON-07: ML_ARTIFACTS_PATH '%s' exists but contains no .pkl model files.",
                ML_ARTIFACTS_PATH,
            )
        else:
            logger.info("CON-07: ML artifacts found at '%s': %s", ML_ARTIFACTS_PATH, pkl_files)


# Include API routes
from .api import auth
app.include_router(auth.router, prefix="/auth", tags=["authentication"])


def include_routers():
    from .api import inventory, supplier, orders, ml_integration, data_ingestion, demand, dashboard, ai
    app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
    app.include_router(supplier.router, prefix="/suppliers", tags=["suppliers"])
    app.include_router(orders.router, prefix="/orders", tags=["orders"])
    app.include_router(ml_integration.router, prefix="/ml", tags=["ml"])
    app.include_router(demand.router, prefix="/demand", tags=["demand"])
    app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
    app.include_router(ai.router, prefix="/ai", tags=["ai"])
    app.include_router(data_ingestion.router, prefix="/api", tags=["data"])


include_routers()
