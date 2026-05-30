from collections import defaultdict
from datetime import date, timedelta
from math import ceil
from typing import Any

from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.ml_models import Insight, Prediction
from ..models.order import Order
from ..models.product_inventory import Product, Inventory
from ..models.supplier_shipment import Supplier


async def _get_inventory_status_counts(db: AsyncSession, company_id: int) -> dict[str, int]:
    """Count inventory statuses using SQL aggregation — no Python-side loading."""
    inv_agg = (
        select(
            Inventory.product_id,
            func.sum(Inventory.current_stock).label("current_stock"),
            func.sum(Inventory.reorder_point).label("reorder_point"),
            func.sum(Inventory.max_stock).label("max_stock"),
        )
        .join(Product, Product.id == Inventory.product_id)
        .filter(Product.company_id == company_id)
        .group_by(Inventory.product_id)
        .subquery()
    )

    stmt = select(
        func.count().label("total"),
        func.sum(case(
            (inv_agg.c.max_stock > 0, 1),
            else_=0,
        )).label("has_max"),
        func.sum(case(
            ((inv_agg.c.max_stock > 0) & (inv_agg.c.current_stock >= inv_agg.c.max_stock), 1),
            else_=0,
        )).label("overstock"),
        func.sum(case(
            ((inv_agg.c.reorder_point > 0) & (inv_agg.c.current_stock <= inv_agg.c.reorder_point * 0.5), 1),
            else_=0,
        )).label("critical"),
        func.sum(case(
            ((inv_agg.c.reorder_point > 0) & (inv_agg.c.current_stock <= inv_agg.c.reorder_point), 1),
            else_=0,
        )).label("stockout_or_below"),
    )

    result = await db.execute(stmt)
    row = result.one()

    total = row.total or 0
    overstock = row.overstock or 0
    critical = row.critical or 0
    stockout_or_below = row.stockout_or_below or 0
    stockout = max(stockout_or_below - critical, 0)
    healthy = max(total - overstock - critical - stockout, 0)

    return {
        "healthy": healthy,
        "stockout": stockout,
        "critical": critical,
        "overstock": overstock,
    }


async def _get_latest_prediction_map(
    db: AsyncSession,
    company_id: int,
    entity_type: str,
    prediction_types: tuple[str, ...],
) -> dict[int, float]:
    result = await db.execute(
        select(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == entity_type,
            Prediction.prediction_type.in_(prediction_types),
        )
        .order_by(Prediction.entity_id.asc(), Prediction.created_at.desc())
    )
    predictions = result.scalars().all()

    latest_predictions: dict[int, float] = {}
    for prediction in predictions:
        if prediction.entity_id not in latest_predictions:
            latest_predictions[prediction.entity_id] = float(prediction.prediction_value)

    return latest_predictions


async def _get_demand_trend(db: AsyncSession, company_id: int, months: int = 6) -> list[dict[str, Any]]:
    """Aggregate order quantities by month for the last N months."""
    cutoff = date.today().replace(day=1) - timedelta(days=months * 31)
    cutoff = cutoff.replace(day=1)

    result = await db.execute(
        select(Order.order_date, Order.quantity)
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id, Order.order_date >= cutoff)
        .order_by(Order.order_date.asc())
    )
    orders = result.all()

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


async def _get_top_products(db: AsyncSession, company_id: int, limit: int = 5) -> list[dict[str, Any]]:
    """Top products by order volume in the last 3 months, with inventory info."""
    cutoff = date.today() - timedelta(days=90)

    agg_subq = (
        select(
            Order.product_id,
            func.sum(Order.quantity).label("total_quantity"),
        )
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id, Order.order_date >= cutoff)
        .group_by(Order.product_id)
        .order_by(func.sum(Order.quantity).desc())
        .limit(limit)
        .subquery()
    )

    result = await db.execute(
        select(
            Product.id,
            Product.product_name,
            agg_subq.c.total_quantity,
        )
        .join(agg_subq, Product.id == agg_subq.c.product_id)
    )
    rows = result.all()

    # Fetch inventory for these products
    product_ids = [r[0] for r in rows]
    inv_result = await db.execute(
        select(Inventory)
        .filter(Inventory.product_id.in_(product_ids))
    )
    inv_map: dict[int, dict[str, int]] = defaultdict(lambda: {"current_stock": 0, "reorder_point": 0, "max_stock": 0})
    for inv in inv_result.scalars().all():
        inv_map[inv.product_id]["current_stock"] += inv.current_stock
        inv_map[inv.product_id]["reorder_point"] += inv.reorder_point
        inv_map[inv.product_id]["max_stock"] += inv.max_stock

    products = []
    for product_id, product_name, total_quantity in rows:
        inv = inv_map[product_id]
        # Compute risk status
        if inv["reorder_point"] > 0 and inv["current_stock"] <= inv["reorder_point"] * 0.5:
            risk_status = "critical"
        elif inv["reorder_point"] > 0 and inv["current_stock"] <= inv["reorder_point"]:
            risk_status = "stockout"
        elif inv["max_stock"] > 0 and inv["current_stock"] >= inv["max_stock"]:
            risk_status = "overstock"
        else:
            risk_status = "healthy"

        products.append({
            "product_id": product_id,
            "product_name": product_name,
            "total_quantity": int(total_quantity),
            "current_stock": inv["current_stock"],
            "risk_status": risk_status,
        })

    return products


async def _get_reorder_alerts(db: AsyncSession, company_id: int) -> list[dict[str, Any]]:
    """Products that need reorder — stock at or near reorder point."""
    # Get products with inventory at or below 120% of reorder point
    inv_agg = (
        select(
            Inventory.product_id,
            func.sum(Inventory.current_stock).label("current_stock"),
            func.sum(Inventory.reorder_point).label("reorder_point"),
        )
        .join(Product, Product.id == Inventory.product_id)
        .filter(Product.company_id == company_id)
        .group_by(Inventory.product_id)
        .having(func.sum(Inventory.current_stock) <= func.sum(Inventory.reorder_point) * 1.2)
        .subquery()
    )

    result = await db.execute(
        select(
            Product.id,
            Product.product_name,
            inv_agg.c.current_stock,
            inv_agg.c.reorder_point,
        )
        .join(inv_agg, Product.id == inv_agg.c.product_id)
        .order_by(
            (inv_agg.c.current_stock / func.nullif(inv_agg.c.reorder_point, 0)).asc()
        )
    )
    rows = result.all()

    # Compute avg daily demand for days_of_supply
    cutoff_30 = date.today() - timedelta(days=30)
    demand_result = await db.execute(
        select(
            Order.product_id,
            func.sum(Order.quantity).label("qty_30d"),
        )
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id, Order.order_date >= cutoff_30)
        .group_by(Order.product_id)
    )
    demand_map: dict[int, float] = {}
    for product_id, qty in demand_result.all():
        demand_map[product_id] = float(qty) / 30.0  # avg daily demand

    alerts = []
    for product_id, product_name, current_stock, reorder_point in rows:
        avg_daily = demand_map.get(product_id, 0)
        days_of_supply = round(current_stock / avg_daily) if avg_daily > 0 else None

        if reorder_point > 0 and current_stock <= reorder_point * 0.5:
            urgency = "critical"
        elif reorder_point > 0 and current_stock <= reorder_point:
            urgency = "high"
        else:
            urgency = "medium"

        alerts.append({
            "product_id": product_id,
            "product_name": product_name,
            "current_stock": int(current_stock),
            "reorder_point": int(reorder_point),
            "days_of_supply": days_of_supply,
            "urgency": urgency,
        })

    return alerts


async def _get_supplier_summary(db: AsyncSession, company_id: int) -> dict[str, Any]:
    """Aggregate supplier stats."""
    total = await db.scalar(
        select(func.count(Supplier.id)).filter(Supplier.company_id == company_id)
    ) or 0

    avg_reliability = await db.scalar(
        select(func.avg(Supplier.reliability_score))
        .filter(Supplier.company_id == company_id, Supplier.reliability_score.isnot(None))
    )

    supplier_delay_predictions = await _get_latest_prediction_map(
        db, company_id, "supplier", ("delay_probability", "delay_risk")
    )
    at_risk = sum(1 for p in supplier_delay_predictions.values() if p > 0.60)

    return {
        "total": total,
        "at_risk": at_risk,
        "avg_reliability": round(float(avg_reliability), 2) if avg_reliability else None,
    }


async def get_dashboard_summary(db: AsyncSession, company_id: int) -> dict[str, Any]:
    total_products = await db.scalar(
        select(func.count(Product.id)).filter(Product.company_id == company_id)
    ) or 0

    inventory_counts = await _get_inventory_status_counts(db, company_id)
    inventory_health = (
        round((inventory_counts["healthy"] / total_products) * 100)
        if total_products > 0
        else 0
    )

    # Run all queries in parallel conceptually (awaited sequentially for simplicity)
    supplier_summary = await _get_supplier_summary(db, company_id)
    demand_trend = await _get_demand_trend(db, company_id, months=6)
    top_products = await _get_top_products(db, company_id, limit=5)
    reorder_alerts = await _get_reorder_alerts(db, company_id)

    top_insights_result = await db.execute(
        select(Insight)
        .filter(
            Insight.company_id == company_id,
            Insight.status.in_(["new", "acknowledged"]),
        )
        .order_by(Insight.priority_score.desc(), Insight.created_at.desc())
        .limit(8)
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
        for insight in top_insights_result.scalars().all()
    ]

    return {
        "kpis": {
            "total_products": total_products,
            "inventory_health": inventory_health,
            "stockout_risk_count": inventory_counts["stockout"],
            "critical_risk_count": inventory_counts["critical"],
            "overstock_risk_count": inventory_counts["overstock"],
            "suppliers_at_risk": supplier_summary["at_risk"],
            "needs_attention_count": len(top_insights),
        },
        "demand_trend": demand_trend,
        "inventory_breakdown": inventory_counts,
        "top_products": top_products,
        "reorder_alerts": reorder_alerts,
        "supplier_summary": supplier_summary,
        "top_insights": top_insights,
    }
