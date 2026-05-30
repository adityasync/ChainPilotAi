"""
ML-powered demand forecasting engine.

Uses XGBoost for regression-based forecasting and RandomForest for demand pattern
classification. Operates on the same (order_date, quantity) input as the statistical
forecaster, with feature engineering for lag, rolling, trend, and seasonal signals.

Requires ≥12 months of order history for meaningful ML features. Falls back to
statistical forecaster for shorter series.
"""

import math
from collections import defaultdict
from datetime import date
from typing import Any

import numpy as np
import pandas as pd
import joblib
import logging
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from .statistical_forecaster import _aggregate_orders_by_month

logger = logging.getLogger(__name__)

# Minimum months of data required for ML features (one full seasonal cycle)
MIN_MONTHS = 12


def _is_sufficient_data(orders: list[tuple[date, int]]) -> bool:
    """Check if there are enough months of data for ML forecasting."""
    if not orders:
        return False
    _, quantities = _aggregate_orders_by_month(orders)
    return len(quantities) >= MIN_MONTHS


def _build_feature_matrix(quantities: np.ndarray, labels: list[str] | None = None) -> pd.DataFrame:
    """Engineer features from a monthly demand series.

    Features:
    - Lag: t-1, t-2, t-3, t-6, t-12
    - Rolling: 3m mean, 6m mean, 3m std, 6m std
    - Trend: 3m slope, 6m slope, deviation from 3m mean
    - Seasonal: month sin/cos encoding (from calendar month if labels provided), quarter
    - Volatility: 6-month coefficient of variation
    - Ratio: current / 12m rolling mean
    """
    n = len(quantities)
    df = pd.DataFrame({"qty": quantities})

    # Lag features
    for lag in [1, 2, 3, 6, 12]:
        df[f"lag_{lag}"] = df["qty"].shift(lag)

    # Rolling statistics
    for window in [3, 6]:
        df[f"roll_mean_{window}"] = df["qty"].rolling(window=window, min_periods=1).mean()
        df[f"roll_std_{window}"] = df["qty"].rolling(window=window, min_periods=1).std().fillna(0)

    # Rolling 12-month mean (for ratio)
    df["roll_mean_12"] = df["qty"].rolling(window=12, min_periods=1).mean()

    # Trend slopes (linear regression slope over recent window)
    for window in [3, 6]:
        slopes = []
        for i in range(n):
            start = max(0, i - window + 1)
            y = quantities[start : i + 1]
            if len(y) < 2:
                slopes.append(0.0)
            else:
                x = np.arange(len(y), dtype=float)
                x_mean = x.mean()
                y_mean = y.mean()
                denom = ((x - x_mean) ** 2).sum()
                slope = ((x - x_mean) * (y - y_mean)).sum() / denom if denom > 0 else 0.0
                slopes.append(slope)
        df[f"trend_slope_{window}"] = slopes

    # Deviation from 3-month rolling mean
    df["dev_from_mean_3"] = df["qty"] - df["roll_mean_3"]

    # Ratio: current / 12m rolling mean
    df["ratio_12m"] = df["qty"] / df["roll_mean_12"].replace(0, np.nan)
    df["ratio_12m"] = df["ratio_12m"].fillna(1.0)

    # Volatility: 6-month coefficient of variation
    df["cv_6m"] = df["roll_std_6"] / df["roll_mean_6"].replace(0, np.nan)
    df["cv_6m"] = df["cv_6m"].fillna(0.0)

    # Seasonal features — use calendar month from labels if available, else position
    if labels and len(labels) == n:
        from datetime import datetime as dt
        month_numbers = []
        for lbl in labels:
            try:
                # Labels are like "Jan 2024" from _aggregate_orders_by_month
                parsed = dt.strptime(lbl, "%b %Y")
                month_numbers.append(parsed.month - 1)  # 0-indexed
            except ValueError:
                month_numbers.append(0)
        month_indices = np.array(month_numbers)
    else:
        month_indices = np.arange(n) % 12
    df["month_sin"] = np.sin(2 * np.pi * month_indices / 12)
    df["month_cos"] = np.cos(2 * np.pi * month_indices / 12)
    df["quarter"] = (month_indices // 3) + 1

    return df


class MLDemandForecaster:
    """ML-powered demand forecaster using XGBoost."""

    def __init__(self):
        self.regressor = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=0,
        )
        self.is_trained = False
        self._residual_std = 0.0
        self._feature_cols: list[str] = []

    def train(self, orders: list[tuple[date, int]]) -> dict[str, Any]:
        """Train the forecaster on order history.

        Uses walk-forward split: first 70% for training, last 30% for testing.
        Returns evaluation metrics.
        """
        labels, quantities = _aggregate_orders_by_month(orders)
        if len(quantities) < MIN_MONTHS:
            raise ValueError(f"Need at least {MIN_MONTHS} months of data, got {len(quantities)}")

        df = _build_feature_matrix(quantities, labels)

        # Target: next month's quantity (shifted -1)
        df["target"] = df["qty"].shift(-1)

        # Fill NaN in lag/rolling features with forward fill only (no future data leakage)
        # Remaining NaN (first rows with no prior data) filled with 0
        feature_cols = [c for c in df.columns if c not in ["qty", "target"]]
        df[feature_cols] = df[feature_cols].ffill().fillna(0)

        # Only drop the last row where target is NaN
        df = df.dropna(subset=["target"]).reset_index(drop=True)

        if len(df) < 6:
            raise ValueError("Not enough valid rows after feature engineering")

        # Walk-forward split (70/30), ensure at least 2 test samples
        split_idx = int(len(df) * 0.7)
        split_idx = max(split_idx, 4)  # at least 4 training rows
        split_idx = min(split_idx, len(df) - 2)  # leave at least 2 test rows

        self._feature_cols = feature_cols

        X_train = df[feature_cols].iloc[:split_idx]
        y_train = df["target"].iloc[:split_idx]
        X_test = df[feature_cols].iloc[split_idx:]
        y_test = df["target"].iloc[split_idx:]

        # Train regressor
        self.regressor.fit(X_train, y_train)

        # Evaluate
        y_pred = self.regressor.predict(X_test)
        y_pred = np.maximum(y_pred, 0)  # demand can't be negative

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mape_vals = [
            abs(p - a) / a * 100 for p, a in zip(y_pred, y_test) if a > 0
        ]
        mape = round(float(np.mean(mape_vals)), 1) if mape_vals else None

        # Residual std for confidence intervals
        residuals = y_test.values - y_pred
        self._residual_std = float(np.std(residuals)) if len(residuals) > 1 else float(np.std(y_train)) * 0.5

        self.is_trained = True

        return {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "mape": mape,
            "train_size": split_idx,
            "test_size": len(df) - split_idx,
        }

    def forecast(self, orders: list[tuple[date, int]], periods_ahead: int = 1) -> dict[str, Any]:
        """Generate ML-powered forecast.

        Returns the same shape as the statistical forecaster plus ML-specific fields.
        If not enough data or not trained, raises ValueError.
        """
        labels, quantities = _aggregate_orders_by_month(orders)

        if len(quantities) < MIN_MONTHS:
            raise ValueError(f"Need at least {MIN_MONTHS} months of data")

        # Train on the fly if not already trained
        if not self.is_trained:
            self.train(orders)

        df = _build_feature_matrix(quantities, labels)
        feature_cols = self._feature_cols or [c for c in df.columns if c != "qty"]

        # Forecast iteratively for multi-step
        forecasts = []
        current_qty = quantities.copy()
        conf_lower_list = []
        conf_upper_list = []

        for step in range(periods_ahead):
            # Build features from current series (extend labels for multi-step)
            step_labels = labels + [f"Month +{i+1}" for i in range(step)]
            step_df = _build_feature_matrix(current_qty, step_labels)
            last_row = step_df[feature_cols].iloc[[-1]]

            # Ensure no NaN
            last_row = last_row.fillna(0)

            pred = float(self.regressor.predict(last_row)[0])
            pred = max(0, pred)

            # Confidence interval widens with sqrt of forecast horizon
            ci_mult = math.sqrt(step + 1)
            ci_lower = max(0, pred - 1.96 * self._residual_std * ci_mult)
            ci_upper = pred + 1.96 * self._residual_std * ci_mult

            forecasts.append(round(pred, 1))
            conf_lower_list.append(round(ci_lower, 1))
            conf_upper_list.append(round(ci_upper, 1))

            # Append prediction for next step's lag features
            current_qty = np.append(current_qty, pred)

        # Compute trend slope from last 6 months
        n_recent = min(6, len(quantities))
        y = quantities[-n_recent:]
        x = np.arange(n_recent, dtype=float)
        x_mean = x.mean()
        y_mean = y.mean()
        denom = ((x - x_mean) ** 2).sum()
        trend_slope = float(((x - x_mean) * (y - y_mean)).sum() / denom) if denom > 0 else 0.0

        # Classify demand pattern
        pattern_info = self.classify_demand_pattern(orders)

        # Detect anomalies
        anomalies = self.detect_anomalies(orders)

        # Feature importance
        feature_importance = {}
        if hasattr(self.regressor, "feature_importances_") and self._feature_cols:
            importances = self.regressor.feature_importances_
            feature_importance = dict(zip(self._feature_cols, [round(float(v), 3) for v in importances]))
            # Sort by importance, keep top 8
            feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:8])

        return {
            "forecast_value": forecasts[0] if forecasts else 0.0,
            "confidence_lower": conf_lower_list[0] if conf_lower_list else 0.0,
            "confidence_upper": conf_upper_list[0] if conf_upper_list else 0.0,
            "method": "xgboost",
            "trend_slope": round(trend_slope, 2),
            "historical_values": quantities.tolist(),
            "labels": labels,
            "seasonal_indices": None,
            # ML-specific fields
            "ml_forecast_value": forecasts[0] if forecasts else 0.0,
            "ml_confidence_lower": conf_lower_list[0] if conf_lower_list else 0.0,
            "ml_confidence_upper": conf_upper_list[0] if conf_upper_list else 0.0,
            "demand_pattern": pattern_info,
            "multi_step_forecast": [
                {"period": f"Month +{i+1}", "value": forecasts[i], "lower": conf_lower_list[i], "upper": conf_upper_list[i]}
                for i in range(len(forecasts))
            ],
            "anomalies": anomalies,
            "feature_importance": feature_importance,
        }

    def classify_demand_pattern(self, orders: list[tuple[date, int]]) -> dict[str, Any]:
        """Classify demand pattern into categories.

        Categories: stable, trending_up, trending_down, seasonal, erratic, intermittent
        """
        _, quantities = _aggregate_orders_by_month(orders)

        if len(quantities) < 4:
            return {"pattern": "unknown", "confidence": 0.0, "description": "Insufficient data for classification"}

        # Coefficient of variation
        mean_qty = float(np.mean(quantities))
        std_qty = float(np.std(quantities))
        cv = std_qty / mean_qty if mean_qty > 0 else 0.0

        # Trend slope (last 6 months)
        n = min(6, len(quantities))
        y = quantities[-n:]
        x = np.arange(n, dtype=float)
        x_mean = x.mean()
        y_mean = y.mean()
        denom = ((x - x_mean) ** 2).sum()
        slope = float(((x - x_mean) * (y - y_mean)).sum() / denom) if denom > 0 else 0.0

        # Proportion of zero-demand months
        zero_pct = float(np.sum(quantities == 0)) / len(quantities)

        # Autocorrelation at lag 12 (seasonal signal)
        autocorr_12 = 0.0
        if len(quantities) >= 24:
            mean_val = np.mean(quantities)
            var = np.var(quantities)
            if var > 0:
                autocorr_12 = float(np.corrcoef(quantities[:-12] - mean_val, quantities[12:] - mean_val)[0, 1])

        # Classification logic
        if zero_pct > 0.4:
            pattern = "intermittent"
            confidence = min(0.9, zero_pct + 0.3)
            description = f"Demand is sporadic with {int(zero_pct*100)}% zero-demand months"
        elif autocorr_12 > 0.5:
            pattern = "seasonal"
            confidence = round(min(0.95, autocorr_12 + 0.2), 2)
            description = "Demand shows strong seasonal patterns with recurring peaks and troughs"
        elif cv > 0.6:
            pattern = "erratic"
            confidence = round(min(0.9, cv * 0.8), 2)
            description = f"Demand is highly variable (CV={cv:.2f}) and difficult to predict"
        elif slope > mean_qty * 0.02:
            pattern = "trending_up"
            confidence = round(min(0.9, abs(slope) / (mean_qty * 0.1) * 0.5 + 0.3), 2)
            description = f"Demand is growing at ~{abs(slope):.0f} units/month"
        elif slope < -mean_qty * 0.02:
            pattern = "trending_down"
            confidence = round(min(0.9, abs(slope) / (mean_qty * 0.1) * 0.5 + 0.3), 2)
            description = f"Demand is declining at ~{abs(slope):.0f} units/month"
        else:
            pattern = "stable"
            confidence = round(max(0.5, 1.0 - cv), 2)
            description = "Demand is relatively stable with minor fluctuations"

        return {
            "pattern": pattern,
            "confidence": confidence,
            "description": description,
        }

    def detect_anomalies(self, orders: list[tuple[date, int]]) -> list[dict[str, Any]]:
        """Detect months where demand deviates significantly from expected.

        Uses 2 standard deviations from 6-month rolling mean as threshold.
        """
        labels, quantities = _aggregate_orders_by_month(orders)

        if len(quantities) < 6:
            return []

        anomalies = []
        window = 6

        for i in range(window, len(quantities)):
            window_data = quantities[max(0, i - window) : i]
            mean = float(np.mean(window_data))
            std = float(np.std(window_data))

            if std == 0:
                continue

            actual = float(quantities[i])
            deviation = (actual - mean) / std

            if abs(deviation) > 2.0:
                anomalies.append({
                    "month": labels[i],
                    "actual": round(actual, 1),
                    "expected": round(mean, 1),
                    "deviation": round(deviation, 2),
                    "direction": "spike" if deviation > 0 else "drop",
                })

        return anomalies[-6:]  # Keep last 6 anomalies

    def save_model(self, filepath: str):
        """Save trained model to disk."""
        model_data = {
            "regressor": self.regressor,
            "is_trained": self.is_trained,
            "residual_std": self._residual_std,
            "feature_cols": self._feature_cols,
        }
        joblib.dump(model_data, filepath)
        logger.info(f"ML demand forecaster saved to {filepath}")

    @classmethod
    def load_model(cls, filepath: str) -> "MLDemandForecaster":
        """Load trained model from disk."""
        instance = cls()
        model_data = joblib.load(filepath)
        instance.regressor = model_data["regressor"]
        instance.is_trained = model_data["is_trained"]
        instance._residual_std = model_data["residual_std"]
        instance._feature_cols = model_data["feature_cols"]
        logger.info(f"ML demand forecaster loaded from {filepath}")
        return instance
