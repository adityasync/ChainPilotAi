"""Unit tests for MLDemandForecaster."""

import pytest
from datetime import date
import numpy as np

from app.ml.models.ml_demand_forecaster import MLDemandForecaster, _is_sufficient_data, _build_feature_matrix


def _make_orders(n_months: int, base_qty: int = 100, noise: float = 0.1, trend: float = 0.0) -> list[tuple[date, int]]:
    """Generate synthetic order data for testing."""
    orders = []
    for i in range(n_months):
        year = 2024 + (i // 12)
        month = (i % 12) + 1
        qty = int(base_qty + trend * i + np.random.default_rng(42 + i).normal(0, base_qty * noise))
        qty = max(1, qty)
        # Spread orders across the month
        for d in [1, 10, 20]:
            orders.append((date(year, month, d), qty // 3))
    return orders


def _make_seasonal_orders(n_months: int, base_qty: int = 100) -> list[tuple[date, int]]:
    """Generate orders with seasonal pattern."""
    orders = []
    for i in range(n_months):
        year = 2023 + (i // 12)
        month = (i % 12) + 1
        # Sinusoidal seasonal pattern
        seasonal_factor = 1.0 + 0.3 * np.sin(2 * np.pi * (month - 1) / 12)
        qty = max(1, int(base_qty * seasonal_factor))
        orders.append((date(year, month, 15), qty))
    return orders


class TestIsSufficientData:
    def test_empty_orders(self):
        assert _is_sufficient_data([]) is False

    def test_short_series(self):
        orders = [(date(2025, 1, 1), 10), (date(2025, 2, 1), 20)]
        assert _is_sufficient_data(orders) is False

    def test_sufficient_data(self):
        orders = []
        for m in range(1, 13):
            orders.append((date(2024, m, 15), 100))
        assert _is_sufficient_data(orders) is True


class TestBuildFeatureMatrix:
    def test_feature_columns(self):
        quantities = np.random.default_rng(42).integers(50, 150, size=18).astype(float)
        df = _build_feature_matrix(quantities)
        assert "qty" in df.columns
        assert "lag_1" in df.columns
        assert "lag_12" in df.columns
        assert "roll_mean_3" in df.columns
        assert "trend_slope_6" in df.columns
        assert "month_sin" in df.columns
        assert "cv_6m" in df.columns

    def test_no_nan_in_middle(self):
        quantities = np.ones(18) * 100
        df = _build_feature_matrix(quantities)
        # After first 12 rows, no NaN should exist
        assert not df.iloc[12:].isnull().any().any()


class TestMLDemandForecaster:
    def test_train_with_sufficient_data(self):
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        metrics = forecaster.train(orders)
        assert "mae" in metrics
        assert "rmse" in metrics
        assert forecaster.is_trained is True

    def test_train_insufficient_data_raises(self):
        orders = _make_orders(6, base_qty=100)
        forecaster = MLDemandForecaster()
        with pytest.raises(ValueError, match="at least 12 months"):
            forecaster.train(orders)

    def test_forecast_returns_expected_keys(self):
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        result = forecaster.forecast(orders, periods_ahead=1)

        assert "forecast_value" in result
        assert "confidence_lower" in result
        assert "confidence_upper" in result
        assert "method" in result
        assert result["method"] == "xgboost"
        assert "demand_pattern" in result
        assert "anomalies" in result
        assert "feature_importance" in result
        assert result["forecast_value"] >= 0

    def test_forecast_multi_step(self):
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        result = forecaster.forecast(orders, periods_ahead=3)

        assert len(result["multi_step_forecast"]) == 3
        for step in result["multi_step_forecast"]:
            assert "period" in step
            assert "value" in step
            assert "lower" in step
            assert "upper" in step
            assert step["value"] >= 0
            assert step["lower"] <= step["value"] <= step["upper"]

    def test_classify_stable(self):
        # Very low noise = stable
        orders = _make_orders(18, base_qty=100, noise=0.01, trend=0.0)
        forecaster = MLDemandForecaster()
        pattern = forecaster.classify_demand_pattern(orders)
        assert pattern["pattern"] in ["stable", "erratic"]
        assert "confidence" in pattern
        assert "description" in pattern

    def test_classify_trending_up(self):
        orders = _make_orders(18, base_qty=50, noise=0.02, trend=5.0)
        forecaster = MLDemandForecaster()
        pattern = forecaster.classify_demand_pattern(orders)
        assert pattern["pattern"] in ["trending_up", "stable"]

    def test_classify_seasonal(self):
        orders = _make_seasonal_orders(30, base_qty=100)
        forecaster = MLDemandForecaster()
        pattern = forecaster.classify_demand_pattern(orders)
        assert pattern["pattern"] in ["seasonal", "stable", "trending_up"]

    def test_detect_anomalies_short_series(self):
        orders = _make_orders(5, base_qty=100, noise=0.01)
        forecaster = MLDemandForecaster()
        anomalies = forecaster.detect_anomalies(orders)
        assert anomalies == []

    def test_detect_anomalies_normal_series(self):
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        anomalies = forecaster.detect_anomalies(orders)
        assert isinstance(anomalies, list)
        for a in anomalies:
            assert "month" in a
            assert "actual" in a
            assert "expected" in a
            assert "deviation" in a
            assert "direction" in a
            assert a["direction"] in ["spike", "drop"]

    def test_save_and_load_model(self, tmp_path):
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        forecaster.train(orders)

        filepath = str(tmp_path / "test_model.pkl")
        forecaster.save_model(filepath)

        loaded = MLDemandForecaster.load_model(filepath)
        assert loaded.is_trained is True

        # Both should produce similar forecasts
        original_fc = forecaster.forecast(orders, periods_ahead=1)
        loaded_fc = loaded.forecast(orders, periods_ahead=1)
        assert abs(original_fc["forecast_value"] - loaded_fc["forecast_value"]) < 1.0

    def test_forecast_auto_trains(self):
        """forecast() should auto-train if not already trained."""
        orders = _make_orders(18, base_qty=100, noise=0.05)
        forecaster = MLDemandForecaster()
        assert forecaster.is_trained is False

        result = forecaster.forecast(orders)
        assert forecaster.is_trained is True
        assert result["forecast_value"] >= 0
