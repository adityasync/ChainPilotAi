"""NFR-TEST-01: Unit tests for demand_service."""

import pytest
from datetime import date
from unittest.mock import patch, MagicMock
from app.services import demand_service
from app.models.order import Order
from app.models.product_inventory import Product, Inventory


class TestAggregatePeriod:
    def test_week_aggregation(self):
        d = date(2026, 1, 15)  # Thursday
        period_start, label = demand_service._aggregate_period(d, "week")
        assert period_start == date(2026, 1, 12)  # Monday

    def test_month_aggregation(self):
        d = date(2026, 3, 15)
        period_start, label = demand_service._aggregate_period(d, "month")
        assert period_start == date(2026, 3, 1)
        assert "Mar" in label

    def test_quarter_aggregation(self):
        d = date(2026, 5, 15)
        period_start, label = demand_service._aggregate_period(d, "quarter")
        assert period_start == date(2026, 4, 1)
        assert "Q2" in label


class TestFallbackForecast:
    def test_empty_series_returns_zero(self):
        assert demand_service._fallback_forecast([]) == 0.0

    def test_averages_last_4_points(self):
        series = [
            {"quantity": 10},
            {"quantity": 20},
            {"quantity": 30},
            {"quantity": 40},
            {"quantity": 50},
        ]
        result = demand_service._fallback_forecast(series)
        # Last 4: 20, 30, 40, 50 → avg = 35
        assert result == 35.0


class TestGetDemandHistory:
    def test_returns_expected_structure(self, db, company, product, order):
        result = demand_service.get_demand_history(db, company_id=1, product_id=product.id, period="month")
        assert result["product_id"] == product.id
        assert result["product_name"] == "Widget A"
        assert "series" in result
        assert isinstance(result["series"], list)

    def test_nonexistent_product_raises(self, db):
        from app.core.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            demand_service.get_demand_history(db, company_id=1, product_id=9999, period="month")


class TestGetDemandSummary:
    def test_returns_expected_keys(self, db, company, product_with_inventory, order):
        result = demand_service.get_demand_summary(db, company_id=1, product_id=product_with_inventory.id)
        assert "forecast" in result
        assert "inventory" in result
        assert "recommendation" in result
        assert "urgency" in result["recommendation"]
