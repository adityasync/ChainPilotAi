from collections import defaultdict
from datetime import date, timedelta
from math import ceil
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func, case

from ..models.ml_models import Insight, Prediction
from ..models.order import Order
from ..models.product_inventory import Product, Inventory
from ..models.supplier_shipment import Supplier


def _get_inventory_status_counts(db: Session, company_id: int) -> dict[str, int]:
    products = db.query(Product).filter(Product.company_id == company_id).all()
    healthy = 0
    stockout = 0
    critical = 0
    overstock = 0

    for product in products:
        current_stock = sum(item.current_stock for item in product.inventory_items)
        reorder_point = sum(item.reorder_point for item in product.inventory_items)
        max_stock = sum(item.max_stock for item in product.inventory_items)

        if max_stock > 0 and current_stock >= max_stock:
            overstock += 1
        elif reorder_point > 0 and current_stock <= reorder_point * 0.5:
            critical += 1
        elif reorder_point > 0 and current_stock <= reorder_point:
            stockout += 1
        else:
            healthy += 1

    return {
        "healthy": healthy,
        "stockout": stockout,
        "critical": critical,
        "overstock": overstock,
    }


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


def _get_demand_trend(db: Session, company_id: int, months: int = 6) -> list[dict[str, Any]]:
    cutoff = date.today().replace(day=1) - timedelta(days=months * 31)
    cutoff = cutoff.replace(day=1)

    orders = (
        db.query(Order.order_date, Order.quantity)
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id, Order.order_date >= cutoff)
        .order_by(Order.order_date.asc())
        .all()
    )

    buckets: dict[date, int] = defaultdict(int)
    for order_date, quantity in orders:
        period_start = order_date.replace(day=1)
        buckets[period_start] += quantity

    trend = []
    for period_start in sorted(buckets.keys()):
        trend.append({
            "label": period_start.strftime("%b %Y"),
            "period_start": period_start.isoformat(),
            "quantity": buckets[period_start],
        })
    return trend


def _get_top_products(db: Session, company_id: int, limit: int = 5) -> list[dict[str, Any]]:
    cutoff = date.today() - timedelta(days=90)

    product_quantities = (
        db.query(Order.product_id, func.sum(Order.quantity).label("total_quantity"))
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id, Order.order_date >= cutoff)
        .group_by(Order.product_id)
        .order_by(func.sum(Order.quantity).desc())
        .limit(limit)
        .all()
    )

    product_ids = [pq[0] for pq in product_quantities]
    if not product_ids:
        return []

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    prod_map = {p.id: p.product_name for p in products}

    inventory_items = db.query(Inventory).filter(Inventory.product_id.in_(product_ids)).all()
    inv_map: dict[int, dict[str, int]] = defaultdict(lambda: {"current_stock": 0, "reorder_point": 0, "max_stock": 0})
    for inv in inventory_items:
        inv_map[inv.product_id]["current_stock"] += inv.current_stock
        inv_map[inv.product_id]["reorder_point"] += inv.reorder_point
        inv_map[inv.product_id]["max_stock"] += inv.max_stock

    result = []
    for product_id, total_quantity in product_quantities:
        inv = inv_map[product_id]
        if inv["reorder_point"] > 0 and inv["current_stock"] <= inv["reorder_point"] * 0.5:
            risk_status = "critical"
        elif inv["reorder_point"] > 0 and inv["current_stock"] <= inv["reorder_point"]:
            risk_status = "stockout"
        elif inv["max_stock"] > 0 and inv["current_stock"] >= inv["max_stock"]:
            risk_status = "overstock"
        else:
            risk_status = "healthy"

        result.append({
            "product_id": product_id,
            "product_name": prod_map.get(product_id, "Unknown"),
            "total_quantity": int(total_quantity),
            "current_stock": inv["current_stock"],
            "risk_status": risk_status,
        })

    return result


def _get_reorder_alerts(db: Session, company_id: int) -> list[dict[str, Any]]:
    products = db.query(Product).filter(Product.company_id == company_id).all()
    alerts = []

    for product in products:
        current_stock = sum(item.current_stock for item in product.inventory_items)
        reorder_point = sum(item.reorder_point for item in product.inventory_items)

        if reorder_point > 0 and current_stock <= reorder_point * 1.2:
            cutoff_30 = date.today() - timedelta(days=30)
            demand = (
                db.query(func.sum(Order.quantity))
                .join(Product, Order.product_id == Product.id)
                .filter(Product.id == product.id, Product.company_id == company_id, Order.order_date >= cutoff_30)
                .scalar()
            ) or 0
            avg_daily = float(demand) / 30.0
            days_of_supply = round(current_stock / avg_daily) if avg_daily > 0 else None

            if reorder_point > 0 and current_stock <= reorder_point * 0.5:
                urgency = "critical"
            elif reorder_point > 0 and current_stock <= reorder_point:
                urgency = "high"
            else:
                urgency = "medium"

            alerts.append({
                "product_id": product.id,
                "product_name": product.product_name,
                "current_stock": int(current_stock),
                "reorder_point": int(reorder_point),
                "days_of_supply": days_of_supply,
                "urgency": urgency,
            })

    return alerts


def _get_supplier_summary(db: Session, company_id: int) -> dict[str, Any]:
    total = db.query(func.count(Supplier.id)).filter(Supplier.company_id == company_id).scalar() or 0

    avg_reliability = (
        db.query(func.avg(Supplier.reliability_score))
        .filter(Supplier.company_id == company_id, Supplier.reliability_score.isnot(None))
        .scalar()
    )

    supplier_delay_predictions = _get_latest_prediction_map(
        db, company_id, "supplier", ("delay_probability", "delay_risk")
    )
    at_risk = sum(1 for p in supplier_delay_predictions.values() if p > 0.60)

    return {
        "total": total,
        "at_risk": at_risk,
        "avg_reliability": round(float(avg_reliability), 2) if avg_reliability else None,
    }


def get_dashboard_summary(db: Session, company_id: int) -> dict[str, Any]:
    total_products = db.query(func.count(Product.id)).filter(Product.company_id == company_id).scalar() or 0

    inventory_counts = _get_inventory_status_counts(db, company_id)
    inventory_health = (
        round((inventory_counts["healthy"] / total_products) * 100)
        if total_products > 0
        else 0
    )

    supplier_summary = _get_supplier_summary(db, company_id)
    demand_trend = _get_demand_trend(db, company_id, months=6)
    top_products = _get_top_products(db, company_id, limit=5)
    reorder_alerts = _get_reorder_alerts(db, company_id)

    top_insights = (
        db.query(Insight)
        .filter(
            Insight.company_id == company_id,
            Insight.status.in_(["new", "acknowledged"]),
        )
        .order_by(Insight.priority_score.desc(), Insight.created_at.desc())
        .limit(8)
        .all()
    )
    top_insights_data = [
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
        for insight in top_insights
    ]

    return {
        "kpis": {
            "total_products": total_products,
            "inventory_health": inventory_health,
            "stockout_risk_count": inventory_counts["stockout"],
            "critical_risk_count": inventory_counts["critical"],
            "overstock_risk_count": inventory_counts["overstock"],
            "suppliers_at_risk": supplier_summary["at_risk"],
            "needs_attention_count": len(top_insights_data),
        },
        "demand_trend": demand_trend,
        "inventory_breakdown": inventory_counts,
        "top_products": top_products,
        "reorder_alerts": reorder_alerts,
        "supplier_summary": supplier_summary,
        "top_insights": top_insights_data,
    }
