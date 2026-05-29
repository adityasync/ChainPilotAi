"""
Statistical demand forecasting engine.

Computes forecasts directly from order history using:
- Exponentially Weighted Moving Average (EWMA) for responsiveness to recent trends
- Trend analysis (linear regression on recent periods)
- Seasonality detection (month-of-year patterns)
- Confidence intervals based on historical forecast error

No pre-training required — works on any product with sufficient order history.
"""

import math
from collections import defaultdict
from datetime import date, timedelta
from typing import Any

import numpy as np


def _aggregate_orders_by_month(orders: list[tuple[date, int]]) -> tuple[list[str], np.ndarray]:
    """Aggregate raw orders into monthly buckets.

    Args:
        orders: list of (order_date, quantity) tuples

    Returns:
        (labels, quantities) — sorted by month
    """
    buckets: dict[date, int] = defaultdict(int)
    for order_date, quantity in orders:
        month_start = order_date.replace(day=1)
        buckets[month_start] += quantity

    sorted_months = sorted(buckets.keys())
    labels = [m.strftime("%b %Y") for m in sorted_months]
    quantities = np.array([buckets[m] for m in sorted_months], dtype=float)
    return labels, quantities


def _ewma(values: np.ndarray, alpha: float = 0.3) -> np.ndarray:
    """Exponentially weighted moving average.

    Args:
        values: time series values
        alpha: smoothing factor (0-1). Higher = more weight on recent.

    Returns:
        EWMA array (same length as input)
    """
    result = np.zeros_like(values)
    result[0] = values[0]
    for i in range(1, len(values)):
        result[i] = alpha * values[i] + (1 - alpha) * result[i - 1]
    return result


def _linear_trend(values: np.ndarray, n_recent: int = 6) -> tuple[float, float]:
    """Fit a linear trend on the most recent N data points.

    Returns:
        (slope, intercept) — slope is per-period change
    """
    n = min(n_recent, len(values))
    if n < 2:
        return 0.0, float(values[-1]) if len(values) > 0 else 0.0

    y = values[-n:]
    x = np.arange(n, dtype=float)

    # Simple least squares
    x_mean = x.mean()
    y_mean = y.mean()
    numerator = ((x - x_mean) * (y - y_mean)).sum()
    denominator = ((x - x_mean) ** 2).sum()

    if denominator == 0:
        return 0.0, float(y_mean)

    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return float(slope), float(intercept)


def _seasonal_indices(values: np.ndarray, period: int = 12) -> np.ndarray | None:
    """Compute seasonal indices if enough data (>= 2 full cycles).

    Args:
        values: monthly time series
        period: seasonal period (12 for monthly)

    Returns:
        Array of seasonal multipliers (length = period), or None if insufficient data
    """
    if len(values) < period * 2:
        return None

    # Compute overall trend via linear regression
    x = np.arange(len(values), dtype=float)
    slope = np.polyfit(x, values, 1)[0]
    trend = np.array([slope * i + values.mean() for i in range(len(values))])

    # Detrend
    detrended = values / np.where(trend > 0, trend, 1.0)

    # Average seasonal pattern
    indices = np.zeros(period)
    counts = np.zeros(period)
    for i, val in enumerate(detrended):
        month_idx = i % period
        indices[month_idx] += val
        counts[month_idx] += 1

    counts = np.where(counts > 0, counts, 1)
    indices = indices / counts

    # Normalize so average = 1.0
    mean_idx = indices.mean()
    if mean_idx > 0:
        indices = indices / mean_idx

    return indices


def _forecast_error_std(values: np.ndarray, predictions: np.ndarray) -> float:
    """Compute standard deviation of forecast errors for confidence intervals."""
    errors = values - predictions
    return float(np.std(errors)) if len(errors) > 1 else 0.0


def forecast_demand(
    orders: list[tuple[date, int]],
    periods_ahead: int = 1,
    alpha: float = 0.3,
) -> dict[str, Any]:
    """Generate a demand forecast from order history.

    Args:
        orders: list of (order_date, quantity) tuples, unsorted
        periods_ahead: how many months ahead to forecast (default 1)
        alpha: EWMA smoothing factor

    Returns:
        {
            "forecast_value": float,
            "confidence_lower": float,
            "confidence_upper": float,
            "method": str,
            "historical_values": list[float],
            "labels": list[str],
            "trend_slope": float,
            "seasonal_indices": list[float] | None,
        }
    """
    labels, quantities = _aggregate_orders_by_month(orders)

    if len(quantities) == 0:
        return {
            "forecast_value": 0.0,
            "confidence_lower": 0.0,
            "confidence_upper": 0.0,
            "method": "no_data",
            "historical_values": [],
            "labels": [],
            "trend_slope": 0.0,
            "seasonal_indices": None,
        }

    if len(quantities) == 1:
        val = float(quantities[0])
        return {
            "forecast_value": val,
            "confidence_lower": max(0, val * 0.5),
            "confidence_upper": val * 1.5,
            "method": "single_point",
            "historical_values": quantities.tolist(),
            "labels": labels,
            "trend_slope": 0.0,
            "seasonal_indices": None,
        }

    # Compute EWMA
    ewma_values = _ewma(quantities, alpha)

    # Compute trend
    slope, intercept = _linear_trend(quantities, n_recent=6)

    # Compute seasonality
    seasonal = _seasonal_indices(quantities)

    # Forecast: EWMA base + trend adjustment + seasonal adjustment
    last_ewma = ewma_values[-1]
    trend_adjustment = slope * periods_ahead

    base_forecast = last_ewma + trend_adjustment

    # Apply seasonal factor if available
    if seasonal is not None:
        # The month index for the forecast period
        n_months = len(quantities)
        forecast_month_idx = (n_months + periods_ahead - 1) % 12
        seasonal_factor = seasonal[forecast_month_idx]
        base_forecast = base_forecast * seasonal_factor

    base_forecast = max(0, base_forecast)

    # Confidence interval based on historical EWMA error
    ewma_errors = quantities[1:] - ewma_values[:-1]  # skip first (no prior)
    error_std = float(np.std(ewma_errors)) if len(ewma_errors) > 1 else base_forecast * 0.2

    # Widen confidence interval for further-ahead forecasts
    confidence_mult = 1.0 + (periods_ahead - 1) * 0.3

    ci_lower = max(0, base_forecast - 1.96 * error_std * confidence_mult)
    ci_upper = base_forecast + 1.96 * error_std * confidence_mult

    return {
        "forecast_value": round(base_forecast, 1),
        "confidence_lower": round(ci_lower, 1),
        "confidence_upper": round(ci_upper, 1),
        "method": "ewma_trend_seasonal" if seasonal is not None else "ewma_trend",
        "historical_values": quantities.tolist(),
        "labels": labels,
        "trend_slope": round(slope, 2),
        "seasonal_indices": seasonal.tolist() if seasonal is not None else None,
    }


def compute_forecast_accuracy(
    predictions: list[tuple[date, float]],
    orders: list[tuple[date, int]],
) -> dict[str, Any]:
    """Compute forecast accuracy by matching predictions to actual orders.

    Args:
        predictions: list of (created_at_date, predicted_value)
        orders: list of (order_date, actual_quantity)

    Returns:
        {
            "mape": float | None,
            "bias": float | None,
            "rmse": float | None,
            "matched_count": int,
            "total_predictions": int,
            "per_prediction": [{period, predicted, actual, error, pct_error}]
        }
    """
    if not predictions:
        return {
            "mape": None, "bias": None, "rmse": None,
            "matched_count": 0, "total_predictions": 0, "per_prediction": [],
        }

    # Aggregate actuals by month
    actuals: dict[date, int] = defaultdict(int)
    for order_date, quantity in orders:
        month_start = order_date.replace(day=1)
        actuals[month_start] += quantity

    # Match each prediction to an actual
    per_prediction = []
    total_pct_error = 0.0
    total_bias = 0.0
    total_sq_error = 0.0
    matched = 0

    for pred_date, pred_value in predictions:
        pred_month = pred_date.replace(day=1)
        # Try same month, then next month
        actual = actuals.get(pred_month)
        if actual is None:
            next_month = (pred_month + timedelta(days=32)).replace(day=1)
            actual = actuals.get(next_month)

        if actual is not None and actual > 0:
            error = pred_value - actual
            pct_error = abs(error) / actual * 100

            per_prediction.append({
                "period": pred_month.isoformat(),
                "label": pred_month.strftime("%b %Y"),
                "predicted": round(pred_value),
                "actual": actual,
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

    return {
        "mape": mape,
        "bias": bias,
        "rmse": rmse,
        "matched_count": matched,
        "total_predictions": len(predictions),
        "per_prediction": per_prediction[-12:],  # last 12
    }
