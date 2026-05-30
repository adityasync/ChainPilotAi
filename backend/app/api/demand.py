from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..database import get_db
from ..services.demand_service import (
    get_demand_history,
    get_demand_insights,
    get_demand_summary,
    get_forecast_accuracy,
    get_portfolio_demand_summary,
)

router = APIRouter()


@router.get("/portfolio/summary")
async def get_portfolio_summary(
    period: str = "month",
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_portfolio_demand_summary(db, company_id, period)


@router.get("/{product_id}/history")
async def get_product_demand_history(
    product_id: int,
    period: str = "month",
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_demand_history(db, company_id, product_id, period)


@router.get("/{product_id}/summary")
async def get_product_demand_summary(
    product_id: int,
    period: str = "month",
    forecast_date: date | None = None,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_demand_summary(db, company_id, product_id, period, forecast_date)


@router.get("/{product_id}/accuracy")
async def get_product_forecast_accuracy(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_forecast_accuracy(db, company_id, product_id)


@router.get("/{product_id}/insights")
async def get_product_demand_insights(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_demand_insights(db, company_id, product_id)
