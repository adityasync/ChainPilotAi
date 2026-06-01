from collections import defaultdict
from datetime import date, timedelta
from math import ceil
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.exceptions import NotFoundError
from ..models.ml_models import Prediction
from ..models.order import Order
from ..models.product_inventory import Product, Inventory


def _get_forecast_demand():
    from ..ml.models.statistical_forecaster import forecast_demand
    return forecast_demand


def _get_MLDemandForecaster():
    from ..ml.models.ml_demand_forecaster import MLDemandForecaster
    return MLDemandForecaster


def _get_is_sufficient_data():
    from ..ml.models.ml_demand_forecaster import _is_sufficient_data
    return _is_sufficient_data


async def _get_product(db: AsyncSession, product_id: int, company_id: int) -> Product:
    result = await db.execute(
        select(Product).options(selectinload(Product.inventory_items)).filter(Product.id == product_id, Product.company_id == company_id)
    )
    product = result.scalars().first()
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


async def _fetch_orders_raw(
    db: AsyncSession, company_id: int, product_id: int
) -> list[tuple[date, int]]:
    """Fetch raw (order_date, quantity) tuples for a product."""
    result = await db.execute(
        select(Order.order_date, Order.quantity)
        .join(Product, Order.product_id == Product.id)
        .filter(Order.product_id == product_id, Product.company_id == company_id)
        .order_by(Order.order_date.asc())
    )
    return [(row[0], row[1]) for row in result.all()]


async def get_demand_history(
    db: AsyncSession,
    company_id: int,
    product_id: int,
    period: str = "month",
) -> dict[str, Any]:
    product = await _get_product(db, product_id, company_id)
    raw_orders = await _fetch_orders_raw(db, company_id, product_id)

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


async def _persist_forecast(
    db: AsyncSession,
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
    await db.commit()
    await db.refresh(prediction)
    return prediction


async def get_or_create_demand_forecast(
    db: AsyncSession,
    company_id: int,
    product_id: int,
    forecast_date: date,
) -> dict[str, Any]:
    """Generate a demand forecast. Tries ML first, falls back to statistical."""
    await _get_product(db, product_id, company_id)

    # Check for a recent persisted forecast (within last 24 hours)
    result = await db.execute(
        select(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "product",
            Prediction.entity_id == product_id,
            Prediction.prediction_type == "demand_forecast",
        )
        .order_by(Prediction.created_at.desc())
    )
    latest_prediction = result.scalars().first()

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

    # Fetch raw order history
    raw_orders = await _fetch_orders_raw(db, company_id, product_id)

    # Try ML forecaster first (needs ≥12 months of data)
    if _get_is_sufficient_data()(raw_orders):
        try:
            ml = _get_MLDemandForecaster()()
            ml_fc = ml.forecast(raw_orders, periods_ahead=6)
            forecast_value = ml_fc["ml_forecast_value"]

            prediction = await _persist_forecast(db, company_id, product_id, forecast_value)
            return {
                "quantity": float(forecast_value),
                "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
                "forecast_date": forecast_date.isoformat(),
                "source": "ml",
                "method": ml_fc["method"],
                "confidence_lower": ml_fc["ml_confidence_lower"],
                "confidence_upper": ml_fc["ml_confidence_upper"],
                "trend_slope": ml_fc["trend_slope"],
                "demand_pattern": ml_fc["demand_pattern"],
                "multi_step_forecast": ml_fc["multi_step_forecast"],
                "anomalies": ml_fc["anomalies"],
                "feature_importance": ml_fc["feature_importance"],
            }
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"ML forecast failed for product {product_id}, falling back to statistical: {e}")

    # Fallback: statistical forecaster
    fc = _get_forecast_demand()(raw_orders, periods_ahead=1)
    forecast_value = fc["forecast_value"]

    prediction = await _persist_forecast(db, company_id, product_id, forecast_value)
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


async def get_demand_summary(
    db: AsyncSession,
    company_id: int,
    product_id: int,
    period: str = "month",
    forecast_date: date | None = None,
) -> dict[str, Any]:
    product = await _get_product(db, product_id, company_id)
    history = await get_demand_history(db, company_id, product_id, period)
    forecast = await get_or_create_demand_forecast(
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


async def get_portfolio_demand_summary(
    db: AsyncSession,
    company_id: int,
    period: str = "month",
) -> dict[str, Any]:
    """Aggregate demand across all products for the company."""
    result = await db.execute(
        select(Order.order_date, Order.quantity, Order.product_id)
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .order_by(Order.order_date.asc())
    )
    orders = result.all()

    # Aggregate by period
    total_buckets: dict[date, int] = defaultdict(int)
    product_totals: dict[int, int] = defaultdict(int)

    for order_date, quantity, product_id in orders:
        period_start, _ = _aggregate_period(order_date, period)
        total_buckets[period_start] += quantity
        product_totals[product_id] += quantity

    # Build total demand series
    total_series = []
    for period_start in sorted(total_buckets.keys()):
        _, label = _aggregate_period(period_start, period)
        total_series.append({
            "label": label,
            "period_start": period_start.isoformat(),
            "quantity": total_buckets[period_start],
        })

    # Compute change percent
    current_qty = total_series[-1]["quantity"] if total_series else 0
    prev_qty = total_series[-2]["quantity"] if len(total_series) > 1 else 0
    change_percent = round(((current_qty - prev_qty) / prev_qty) * 100, 1) if prev_qty > 0 else 0.0

    # Top products by volume
    top_product_ids = sorted(product_totals, key=product_totals.get, reverse=True)[:8]
    top_products_data = []
    if top_product_ids:
        prod_result = await db.execute(
            select(Product.id, Product.product_name)
            .filter(Product.id.in_(top_product_ids), Product.company_id == company_id)
        )
        prod_map = {pid: pname for pid, pname in prod_result.all()}

        inv_result = await db.execute(
            select(
                Inventory.product_id,
                func.sum(Inventory.current_stock).label("current_stock"),
            )
            .filter(Inventory.product_id.in_(top_product_ids))
            .group_by(Inventory.product_id)
        )
        inv_map = {pid: int(stock) for pid, stock in inv_result.all()}

        for pid in top_product_ids:
            top_products_data.append({
                "product_id": pid,
                "product_name": prod_map.get(pid, "Unknown"),
                "total_quantity": product_totals[pid],
                "current_stock": inv_map.get(pid, 0),
            })

    products_tracked = await db.scalar(
        select(func.count(func.distinct(Order.product_id)))
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
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


async def get_portfolio_insights(
    db: AsyncSession,
    company_id: int,
) -> dict[str, Any]:
    """Compute expensive ML-based portfolio insights (accuracy + demand patterns).

    This is separated from get_portfolio_demand_summary because it involves
    on-the-fly ML training that can take 10-30+ seconds on constrained hardware.
    """
    # Get all product IDs with orders (ordered by total volume descending
    # so the top-20 slice is deterministic and always picks the highest-volume products)
    result = await db.execute(
        select(Order.product_id, func.sum(Order.quantity).label("total_qty"))
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .group_by(Order.product_id)
        .order_by(func.sum(Order.quantity).desc())
    )
    all_product_ids = [row[0] for row in result.all()]

    # Compute portfolio-level forecast accuracy (best-effort)
    try:
        portfolio_accuracy = await _compute_portfolio_accuracy(db, company_id, all_product_ids)
    except Exception:
        portfolio_accuracy = {"mape": None, "bias": None, "products_with_data": 0}

    # Classify demand patterns across products (best-effort)
    try:
        demand_patterns = await get_demand_patterns_summary(db, company_id)
    except Exception:
        demand_patterns = {}

    return {
        "forecast_accuracy": portfolio_accuracy,
        "demand_patterns": demand_patterns,
    }


async def _compute_portfolio_accuracy(
    db: AsyncSession,
    company_id: int,
    product_ids: list[int],
) -> dict[str, Any]:
    """Compute aggregate forecast accuracy across products using backtest."""
    if not product_ids:
        return {"mape": None, "bias": None, "products_with_data": 0}

    total_mape = 0.0
    total_bias = 0.0
    products_with_data = 0

    for pid in product_ids[:20]:  # cap at 20 products for performance
        raw_orders = await _fetch_orders_raw(db, company_id, pid)
        if len(raw_orders) < 6:
            continue

        # Backtest: forecast each month using only prior data
        from ..ml.models.statistical_forecaster import _aggregate_orders_by_month
        _, quantities = _aggregate_orders_by_month(raw_orders)

        if len(quantities) < 6:
            continue

        errors = []
        # Walk-forward: use months 1..N-1 to predict month N
        for i in range(4, len(quantities)):
            prior_orders = raw_orders[:_count_orders_up_to_month(raw_orders, i)]
            if not prior_orders:
                continue
            fc = _get_forecast_demand()(prior_orders, periods_ahead=1)
            actual = quantities[i]
            if actual > 0:
                pct_err = abs(fc["forecast_value"] - actual) / actual * 100
                errors.append(pct_err)

        if errors:
            total_mape += sum(errors) / len(errors)
            products_with_data += 1

    if products_with_data == 0:
        return {"mape": None, "bias": None, "products_with_data": 0}

    avg_mape = round(total_mape / products_with_data, 1)
    return {
        "mape": avg_mape,
        "bias": None,
        "products_with_data": products_with_data,
    }


def _count_orders_up_to_month(orders: list[tuple[date, int]], month_index: int) -> int:
    """Count how many orders fall in the first N months."""
    from ..ml.models.statistical_forecaster import _aggregate_orders_by_month
    labels, _ = _aggregate_orders_by_month(orders)
    if month_index >= len(labels):
        return len(orders)

    # Find the cutoff date for month_index
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


async def get_forecast_accuracy(
    db: AsyncSession,
    company_id: int,
    product_id: int,
) -> dict[str, Any]:
    """Compute forecast accuracy using walk-forward backtest on real order history."""
    product = await _get_product(db, product_id, company_id)
    raw_orders = await _fetch_orders_raw(db, company_id, product_id)

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

    # Walk-forward backtest
    from ..ml.models.statistical_forecaster import _aggregate_orders_by_month
    _, quantities = _aggregate_orders_by_month(raw_orders)

    # Pre-compute month labels once
    months_seen: dict[date, int] = defaultdict(int)
    for order_date, qty in raw_orders:
        ms = order_date.replace(day=1)
        months_seen[ms] += qty
    sorted_months = sorted(months_seen.keys())

    accuracy_data = []
    total_pct_error = 0.0
    total_bias = 0.0
    total_sq_error = 0.0
    matched = 0

    # Need at least 4 months of history before we can forecast
    for i in range(4, len(quantities)):
        # Use orders up to month i to forecast month i
        cutoff_count = _count_orders_up_to_month(raw_orders, i)
        prior_orders = raw_orders[:cutoff_count]
        if not prior_orders:
            continue

        fc = _get_forecast_demand()(prior_orders, periods_ahead=1)
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

    result = {
        "product_id": product_id,
        "product_name": product.product_name,
        "mape": mape,
        "bias": bias,
        "rmse": rmse,
        "accuracy_data": accuracy_data[-12:],
        "total_predictions": matched,
        "matched_predictions": matched,
    }

    # Add ML accuracy comparison if sufficient data
    if _get_is_sufficient_data()(raw_orders):
        try:
            ml = _get_MLDemandForecaster()()
            ml_mape, ml_bias, ml_rmse, ml_accuracy_data = _ml_walk_forward_accuracy(raw_orders)
            result["ml_mape"] = ml_mape
            result["ml_bias"] = ml_bias
            result["ml_rmse"] = ml_rmse
            result["ml_accuracy_data"] = ml_accuracy_data[-12:]
        except Exception:
            pass  # ML comparison is optional

    return result


def _ml_walk_forward_accuracy(
    orders: list[tuple[date, int]],
) -> tuple[float | None, float | None, float | None, list[dict]]:
    """Run walk-forward backtest using ML forecaster."""
    import math
    from ..ml.models.statistical_forecaster import _aggregate_orders_by_month

    _, quantities = _aggregate_orders_by_month(orders)

    # Pre-compute month labels once (not inside the loop)
    months_seen: dict[date, int] = defaultdict(int)
    for order_date, qty in orders:
        ms = order_date.replace(day=1)
        months_seen[ms] += qty
    sorted_months = sorted(months_seen.keys())

    accuracy_data = []
    total_pct_error = 0.0
    total_bias = 0.0
    total_sq_error = 0.0
    matched = 0

    for i in range(12, len(quantities)):
        cutoff_count = _count_orders_up_to_month(orders, i)
        prior_orders = orders[:cutoff_count]
        if len(prior_orders) < 12:
            continue

        try:
            # Train a new forecaster per step (walk-forward requires retraining)
            ml = _get_MLDemandForecaster()()
            ml_fc = ml.forecast(prior_orders, periods_ahead=1)
            predicted = ml_fc["forecast_value"]
        except Exception:
            continue

        actual = quantities[i]
        if actual > 0:
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

    mape = round(total_pct_error / matched, 1) if matched > 0 else None
    bias = round(total_bias / matched, 1) if matched > 0 else None
    rmse = round(math.sqrt(total_sq_error / matched), 1) if matched > 0 else None

    return mape, bias, rmse, accuracy_data


async def get_demand_insights(
    db: AsyncSession,
    company_id: int,
    product_id: int,
) -> dict[str, Any]:
    """Get ML-powered demand insights for a product.

    Returns demand pattern classification, anomaly detection,
    multi-step forecast, and feature importance.
    """
    product = await _get_product(db, product_id, company_id)
    raw_orders = await _fetch_orders_raw(db, company_id, product_id)

    if not _get_is_sufficient_data()(raw_orders):
        return {
            "product_id": product_id,
            "product_name": product.product_name,
            "ml_available": False,
            "message": "Need at least 12 months of order history for ML insights.",
            "demand_pattern": None,
            "anomalies": [],
            "multi_step_forecast": [],
            "feature_importance": {},
        }

    try:
        ml = _get_MLDemandForecaster()()
        fc = ml.forecast(raw_orders, periods_ahead=6)

        return {
            "product_id": product_id,
            "product_name": product.product_name,
            "ml_available": True,
            "demand_pattern": fc["demand_pattern"],
            "anomalies": fc["anomalies"],
            "multi_step_forecast": fc["multi_step_forecast"],
            "feature_importance": fc["feature_importance"],
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"ML insights failed for product {product_id}: {e}")
        return {
            "product_id": product_id,
            "product_name": product.product_name,
            "ml_available": False,
            "message": f"ML analysis failed: {str(e)}",
            "demand_pattern": None,
            "anomalies": [],
            "multi_step_forecast": [],
            "feature_importance": {},
        }


async def get_demand_patterns_summary(
    db: AsyncSession,
    company_id: int,
) -> dict[str, int]:
    """Classify demand patterns across all products for the company."""
    # Get all product IDs with orders (deterministic order by volume)
    result = await db.execute(
        select(Order.product_id, func.sum(Order.quantity).label("total_qty"))
        .join(Product, Order.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .group_by(Order.product_id)
        .order_by(func.sum(Order.quantity).desc())
    )
    product_ids = [row[0] for row in result.all()]

    patterns: dict[str, int] = defaultdict(int)
    for pid in product_ids[:20]:  # cap at 20 for performance
        raw_orders = await _fetch_orders_raw(db, company_id, pid)
        if not _get_is_sufficient_data()(raw_orders):
            patterns["insufficient_data"] += 1
            continue
        try:
            ml = _get_MLDemandForecaster()()
            pattern_info = ml.classify_demand_pattern(raw_orders)
            patterns[pattern_info["pattern"]] += 1
        except Exception:
            patterns["unknown"] += 1

    return dict(patterns)
