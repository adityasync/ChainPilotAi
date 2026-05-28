from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .database import engine, Base
from .core.config import BACKEND_CORS_ORIGINS
from .core.exceptions import AppError
from . import models

# Create database tables as a dev fallback.
# Production schema management uses Alembic migrations (backend/alembic/).
Base.metadata.create_all(bind=engine)

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


@app.get("/")
def read_root():
    return {"message": "Welcome to the Supply Chain Management API"}


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
