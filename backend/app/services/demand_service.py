from collections import defaultdict
from datetime import date, timedelta
from math import ceil
from typing import Any

from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundError
from ..ml.models.statistical_forecaster import forecast_demand, _aggregate_orders_by_month
from ..models.ml_models import Prediction
from ..models.order import Order
from ..models.product_inventory import Product


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


def _fetch_orders_raw(db: Session, company_id: int, product_id: int) -> list[tuple[date, int]]:
    orders = (
        db.query(Order.order_date, Order.quantity)
        .join(Product, Order.product_id == Product.id)
        .filter(Order.product_id == product_id, Product.company_id == company_id)
        .order_by(Order.order_date.asc())
        .all()
    )
    return [(row[0], row[1]) for row in orders]


def get_demand_history(
    db: Session,
    company_id: int,
    product_id: int,
    period: str = "month",
) -> dict[str, Any]:
    product = _get_product(db, product_id, company_id)
    raw_orders = _fetch_orders_raw(db, company_id, product_id)

    buckets: dict[date, dict[str, Any]] = defaultdict(
        lambda: {"label": "", "period_start": None, "quantity": 0}
    )

    for order_date, quantity in raw_orders:
        period_start, label = _aggregate_period(order_date, period)
        bucket = buckets[period_start]
        bucket["label"] = label
        bucket["period_start"] = period_start.isoformat()
        bucket["quantity"] += quantity

    series = [buckets[key] for key in sorted(buckets.keys())]
    return {
        "product_id": product.id,
        "product_name": product.product_name,
        "period": period,
        "series": series,
    }


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

    if latest_prediction and latest_prediction.created_at:
        from datetime import datetime, timezone
        age = datetime.now(timezone.utc) - latest_prediction.created_at
        if age < timedelta(hours=24):
            return {
                "quantity": float(latest_prediction.prediction_value),
                "created_at": latest_prediction.created_at.isoformat(),
                "forecast_date": forecast_date.isoformat(),
                "source": "cached",
                "method": "statistical",
            }

    raw_orders = _fetch_orders_raw(db, company_id, product_id)
    fc = forecast_demand(raw_orders, periods_ahead=1)
    forecast_value = fc["forecast_value"]

    prediction = _persist_forecast(db, company_id, product_id, forecast_value)
    return {
        "quantity": float(forecast_value),
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
        "forecast_date": forecast_date.isoformat(),
        "source": "statistical",
        "method": fc["method"],
        "confidence_lower": fc["confidence_lower"],
        "confidence_upper": fc["confidence_upper"],
        "trend_slope": fc["trend_slope"],
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


def get_portfolio_demand_summary(
    db: Session,
    company_id: int,
    period: str = "month",
) -> dict[str, Any]:
    orders = (
        db.query(Order.order_date, Order.quantity, Order.product_id)
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .order_by(Order.order_date.asc())
        .all()
    )

    total_buckets: dict[date, int] = defaultdict(int)
    product_totals: dict[int, int] = defaultdict(int)

    for order_date, quantity, product_id in orders:
        period_start, _ = _aggregate_period(order_date, period)
        total_buckets[period_start] += quantity
        product_totals[product_id] += quantity

    total_series = []
    for period_start in sorted(total_buckets.keys()):
        _, label = _aggregate_period(period_start, period)
        total_series.append({
            "label": label,
            "period_start": period_start.isoformat(),
            "quantity": total_buckets[period_start],
        })

    current_qty = total_series[-1]["quantity"] if total_series else 0
    prev_qty = total_series[-2]["quantity"] if len(total_series) > 1 else 0
    change_percent = round(((current_qty - prev_qty) / prev_qty) * 100, 1) if prev_qty > 0 else 0.0

    top_product_ids = sorted(product_totals, key=product_totals.get, reverse=True)[:8]
    top_products_data = []
    if top_product_ids:
        prod_map = {
            p.id: p.product_name
            for p in db.query(Product).filter(Product.id.in_(top_product_ids), Product.company_id == company_id).all()
        }
        from ..models.product_inventory import Inventory
        inv_rows = (
            db.query(Inventory.product_id, func.sum(Inventory.current_stock).label("current_stock"))
            .filter(Inventory.product_id.in_(top_product_ids))
            .group_by(Inventory.product_id)
            .all()
        )
        inv_map = {pid: int(stock) for pid, stock in inv_rows}

        for pid in top_product_ids:
            top_products_data.append({
                "product_id": pid,
                "product_name": prod_map.get(pid, "Unknown"),
                "total_quantity": product_totals[pid],
                "current_stock": inv_map.get(pid, 0),
            })

    from sqlalchemy import func
    products_tracked = (
        db.query(func.count(func.distinct(Order.product_id)))
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .scalar()
    ) or 0

    return {
        "period": period,
        "total_demand": sum(total_buckets.values()),
        "current_period_quantity": current_qty,
        "previous_period_quantity": prev_qty,
        "change_percent": change_percent,
        "products_tracked": products_tracked,
        "demand_series": total_series,
        "top_products": top_products_data,
    }


def get_forecast_accuracy(
    db: Session,
    company_id: int,
    product_id: int,
) -> dict[str, Any]:
    product = _get_product(db, product_id, company_id)
    raw_orders = _fetch_orders_raw(db, company_id, product_id)

    if len(raw_orders) < 6:
        return {
            "product_id": product_id,
            "product_name": product.product_name,
            "mape": None,
            "bias": None,
            "rmse": None,
            "accuracy_data": [],
            "total_predictions": 0,
            "matched_predictions": 0,
        }

    _, quantities = _aggregate_orders_by_month(raw_orders)

    accuracy_data = []
    total_pct_error = 0.0
    total_bias = 0.0
    total_sq_error = 0.0
    matched = 0

    months_seen: dict[date, int] = defaultdict(int)
    for order_date, qty in raw_orders:
        ms = order_date.replace(day=1)
        months_seen[ms] += qty
    sorted_months = sorted(months_seen.keys())

    for i in range(4, len(quantities)):
        cutoff_count = _count_orders_up_to_month(raw_orders, i)
        prior_orders = raw_orders[:cutoff_count]
        if not prior_orders:
            continue

        fc = forecast_demand(prior_orders, periods_ahead=1)
        actual = quantities[i]

        if actual > 0:
            predicted = fc["forecast_value"]
            error = predicted - actual
            pct_error = abs(error) / actual * 100
            label = sorted_months[i].strftime("%b %Y") if i < len(sorted_months) else f"Month {i}"

            accuracy_data.append({
                "label": label,
                "predicted": round(predicted),
                "actual": int(actual),
                "error": round(error),
                "pct_error": round(pct_error, 1),
            })
            total_pct_error += pct_error
            total_bias += error
            total_sq_error += error ** 2
            matched += 1

    import math
    mape = round(total_pct_error / matched, 1) if matched > 0 else None
    bias = round(total_bias / matched, 1) if matched > 0 else None
    rmse = round(math.sqrt(total_sq_error / matched), 1) if matched > 0 else None

    return {
        "product_id": product_id,
        "product_name": product.product_name,
        "mape": mape,
        "bias": bias,
        "rmse": rmse,
        "accuracy_data": accuracy_data[-12:],
        "total_predictions": matched,
        "matched_predictions": matched,
    }


def _count_orders_up_to_month(orders: list[tuple[date, int]], month_index: int) -> int:
    labels, _ = _aggregate_orders_by_month(orders)
    if month_index >= len(labels):
        return len(orders)

    months_seen: dict[date, int] = defaultdict(int)
    for order_date, qty in orders:
        ms = order_date.replace(day=1)
        months_seen[ms] += qty

    sorted_months = sorted(months_seen.keys())
    if month_index >= len(sorted_months):
        return len(orders)

    cutoff = sorted_months[month_index]
    count = 0
    for order_date, _ in orders:
        if order_date < cutoff:
            count += 1
    return count
