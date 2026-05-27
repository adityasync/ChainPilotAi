from typing import Any

from sqlalchemy.orm import Session

from ..models.ml_models import Insight, Prediction
from ..models.product_inventory import Product


def _get_latest_prediction_map(
    db: Session,
    company_id: int,
    entity_type: str,
    prediction_types: tuple[str, ...],
) -> dict[int, float]:
    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == entity_type,
            Prediction.prediction_type.in_(prediction_types),
        )
        .order_by(Prediction.entity_id.asc(), Prediction.created_at.desc())
        .all()
    )

    latest_predictions: dict[int, float] = {}
    for prediction in predictions:
        if prediction.entity_id not in latest_predictions:
            latest_predictions[prediction.entity_id] = float(prediction.prediction_value)

    return latest_predictions


def _get_inventory_status_counts(products: list[Product]) -> dict[str, int]:
    healthy = 0
    stockout = 0
    overstock = 0

    for product in products:
        current_stock = sum(item.current_stock for item in product.inventory_items)
        reorder_point = sum(item.reorder_point for item in product.inventory_items)
        max_stock = sum(item.max_stock for item in product.inventory_items)

        if max_stock > 0 and current_stock >= max_stock:
            overstock += 1
        elif reorder_point > 0 and current_stock <= reorder_point:
            stockout += 1
        else:
            healthy += 1

    return {
        "healthy": healthy,
        "stockout": stockout,
        "overstock": overstock,
    }


def get_dashboard_summary(db: Session, company_id: int) -> dict[str, Any]:
    products = (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .all()
    )
    inventory_counts = _get_inventory_status_counts(products)
    total_products = len(products)
    inventory_health = (
        round((inventory_counts["healthy"] / total_products) * 100)
        if total_products > 0
        else 0
    )

    supplier_delay_predictions = _get_latest_prediction_map(
        db,
        company_id,
        "supplier",
        ("delay_probability", "delay_risk"),
    )
    suppliers_at_risk = sum(
        1 for probability in supplier_delay_predictions.values() if probability > 0.60
    )

    top_insights_query = (
        db.query(Insight)
        .filter(
            Insight.company_id == company_id,
            Insight.status.in_(["new", "acknowledged"]),
            Insight.severity.in_(["high", "critical"]),
        )
        .order_by(Insight.priority_score.desc(), Insight.created_at.desc())
        .limit(3)
    )
    top_insights = [
        {
            "id": insight.id,
            "title": insight.title,
            "message": insight.message,
            "severity": insight.severity,
            "recommended_action": insight.recommended_action,
            "category": insight.category,
            "priority_score": insight.priority_score,
            "created_at": insight.created_at,
        }
        for insight in top_insights_query.all()
    ]

    return {
        "kpis": {
            "total_products": total_products,
            "inventory_health": inventory_health,
            "stockout_risk_count": inventory_counts["stockout"],
            "overstock_risk_count": inventory_counts["overstock"],
            "suppliers_at_risk": suppliers_at_risk,
            "needs_attention_count": len(top_insights),
        },
        "top_insights": top_insights,
    }
