from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..database import get_db
from ..services.demand_service import (
    get_demand_history,
    get_demand_summary,
    get_portfolio_demand_summary,
    get_forecast_accuracy,
)

router = APIRouter()


@router.get("/{product_id}/history")
def get_product_demand_history(
    product_id: int,
    period: str = "month",
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = get_current_user_company_id(db, current_user)
    return get_demand_history(db, company_id, product_id, period)


@router.get("/{product_id}/summary")
def get_product_demand_summary(
    product_id: int,
    period: str = "month",
    forecast_date: date | None = None,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = get_current_user_company_id(db, current_user)
    return get_demand_summary(db, company_id, product_id, period, forecast_date)


@router.get("/{product_id}/accuracy")
def get_product_forecast_accuracy(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = get_current_user_company_id(db, current_user)
    return get_forecast_accuracy(db, company_id, product_id)


@router.get("/portfolio/summary")
def get_portfolio_summary(
    period: str = "month",
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company_id = get_current_user_company_id(db, current_user)
    return get_portfolio_demand_summary(db, company_id, period)
