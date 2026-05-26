from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Supply Chain Management API",
    description="API for the ML-Powered Supply Chain SaaS Platform",
    version="1.0.0"
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Supply Chain Management API"}

# Include API routes
from .api import auth
app.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Import and include other routes after app is defined to avoid circular imports
def include_routers():
    from .api import inventory, supplier, orders, ml_integration, data_ingestion
    app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
    app.include_router(supplier.router, prefix="/suppliers", tags=["suppliers"])
    app.include_router(orders.router, prefix="/orders", tags=["orders"])
    app.include_router(ml_integration.router, prefix="/ml", tags=["ml"])
    app.include_router(data_ingestion.router, prefix="/api", tags=["data"])

include_routers()