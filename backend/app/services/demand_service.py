from collections import defaultdict
from datetime import date, timedelta
from math import ceil
from typing import Any

from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundError
from ..ml.inference.predictor import MLPredictor
from ..models.ml_models import Prediction
from ..models.order import Order
from ..models.product_inventory import Product

predictor = MLPredictor()


def _get_product(db: Session, product_id: int, company_id: int) -> Product:
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.company_id == company_id)
        .first()
    )
    if not product:
        raise NotFoundError("Product", product_id)
    return product


def _aggregate_period(order_date: date, period: str) -> tuple[date, str]:
    if period == "quarter":
        quarter_month = ((order_date.month - 1) // 3) * 3 + 1
        period_start = date(order_date.year, quarter_month, 1)
        label = f"Q{((order_date.month - 1) // 3) + 1} {order_date.year}"
        return period_start, label

    if period == "month":
        period_start = date(order_date.year, order_date.month, 1)
        label = period_start.strftime("%b %Y")
        return period_start, label

    period_start = order_date - timedelta(days=order_date.weekday())
    label = period_start.strftime("%d %b")
    return period_start, label


def get_demand_history(
    db: Session,
    company_id: int,
    product_id: int,
    period: str = "month",
) -> dict[str, Any]:
    product = _get_product(db, product_id, company_id)
    orders = (
        db.query(Order)
        .join(Product, Order.product_id == Product.id)
        .filter(Order.product_id == product_id, Product.company_id == company_id)
        .order_by(Order.order_date.asc())
        .all()
    )

    buckets: dict[date, dict[str, Any]] = defaultdict(
        lambda: {"label": "", "period_start": None, "quantity": 0}
    )

    for order in orders:
        period_start, label = _aggregate_period(order.order_date, period)
        bucket = buckets[period_start]
        bucket["label"] = label
        bucket["period_start"] = period_start.isoformat()
        bucket["quantity"] += order.quantity

    series = [buckets[key] for key in sorted(buckets.keys())]
    return {
        "product_id": product.id,
        "product_name": product.product_name,
        "period": period,
        "series": series,
    }


def _fallback_forecast(history_series: list[dict[str, Any]]) -> float:
    if not history_series:
        return 0.0

    recent_points = history_series[-4:]
    avg_quantity = sum(point["quantity"] for point in recent_points) / len(recent_points)
    return round(avg_quantity, 2)


def _persist_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_value: float,
) -> Prediction:
    prediction = Prediction(
        company_id=company_id,
        entity_type="product",
        entity_id=product_id,
        prediction_type="demand_forecast",
        prediction_value=float(forecast_value),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_or_create_demand_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_date: date,
) -> dict[str, Any]:
    _get_product(db, product_id, company_id)
    latest_prediction = (
        db.query(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "product",
            Prediction.entity_id == product_id,
            Prediction.prediction_type == "demand_forecast",
        )
        .order_by(Prediction.created_at.desc())
        .first()
    )

    if latest_prediction:
        return {
            "quantity": float(latest_prediction.prediction_value),
            "created_at": latest_prediction.created_at.isoformat()
            if latest_prediction.created_at
            else None,
            "forecast_date": forecast_date.isoformat(),
            "source": "persisted",
        }

    history = get_demand_history(db, company_id, product_id, period="month")

    try:
        forecast_value = float(predictor.predict_demand(str(product_id), forecast_date))
        source = "ml"
    except Exception:
        forecast_value = _fallback_forecast(history["series"])
        source = "baseline"

    prediction = _persist_forecast(db, company_id, product_id, forecast_value)
    return {
        "quantity": float(forecast_value),
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
        "forecast_date": forecast_date.isoformat(),
        "source": source,
    }


def get_demand_summary(
    db: Session,
    company_id: int,
    product_id: int,
    period: str = "month",
    forecast_date: date | None = None,
) -> dict[str, Any]:
    product = _get_product(db, product_id, company_id)
    history = get_demand_history(db, company_id, product_id, period)
    forecast = get_or_create_demand_forecast(
        db,
        company_id,
        product_id,
        forecast_date or date.today(),
    )

    current_stock = sum(item.current_stock for item in product.inventory_items)
    reorder_point = sum(item.reorder_point for item in product.inventory_items)

    current_period_quantity = history["series"][-1]["quantity"] if history["series"] else 0
    previous_period_quantity = history["series"][-2]["quantity"] if len(history["series"]) > 1 else 0

    if previous_period_quantity > 0:
        change_percent = round(
            ((current_period_quantity - previous_period_quantity) / previous_period_quantity) * 100,
            1,
        )
    else:
        change_percent = 0.0

    suggested_reorder_quantity = max(
        0,
        ceil(float(forecast["quantity"]) - current_stock),
    )

    if suggested_reorder_quantity > 0 or current_stock <= reorder_point:
        urgency = "high"
    elif current_stock <= reorder_point * 1.2:
        urgency = "medium"
    else:
        urgency = "low"

    return {
        "product_id": product.id,
        "product_name": product.product_name,
        "period": period,
        "current_period_quantity": current_period_quantity,
        "previous_period_quantity": previous_period_quantity,
        "change_percent": change_percent,
        "forecast": forecast,
        "inventory": {
            "current_stock": current_stock,
            "reorder_point": reorder_point,
        },
        "recommendation": {
            "suggested_reorder_quantity": suggested_reorder_quantity,
            "urgency": urgency,
            "message": (
                f"Reorder {suggested_reorder_quantity} units soon."
                if suggested_reorder_quantity > 0
                else "Current stock is sufficient for the latest forecast."
            ),
        },
    }
