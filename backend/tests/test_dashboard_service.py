"""NFR-TEST-01: Unit tests for dashboard_service."""

import pytest
from datetime import datetime
from app.services import dashboard_service
from app.models.product_inventory import Product, Inventory
from app.models.ml_models import Prediction, Insight


class TestInventoryStatusCounts:
    def test_healthy_product(self, db, company):
        """Product with stock between reorder_point and max_stock is healthy."""
        p = Product(id=10, company_id=1, product_name="Healthy", category="C", unit_cost=1, selling_price=2)
        db.add(p)
        db.flush()
        inv = Inventory(product_id=p.id, warehouse="WH1", current_stock=100, reorder_point=20, max_stock=200)
        db.add(inv)
        db.commit()

        counts = dashboard_service._get_inventory_status_counts(db, 1)
        assert counts["healthy"] == 1
        assert counts["stockout"] == 0
        assert counts["critical"] == 0
        assert counts["overstock"] == 0

    def test_stockout_product(self, db, company):
        """Product at or below reorder_point is stockout."""
        p = Product(id=11, company_id=1, product_name="Stockout", category="C", unit_cost=1, selling_price=2)
        db.add(p)
        db.flush()
        inv = Inventory(product_id=p.id, warehouse="WH1", current_stock=20, reorder_point=20, max_stock=200)
        db.add(inv)
        db.commit()

        counts = dashboard_service._get_inventory_status_counts(db, 1)
        assert counts["stockout"] == 1

    def test_critical_product(self, db, company):
        """Product at or below 50% of reorder_point is critical (FR-INV-04)."""
        p = Product(id=12, company_id=1, product_name="Critical", category="C", unit_cost=1, selling_price=2)
        db.add(p)
        db.flush()
        inv = Inventory(product_id=p.id, warehouse="WH1", current_stock=10, reorder_point=20, max_stock=200)
        db.add(inv)
        db.commit()

        counts = dashboard_service._get_inventory_status_counts(db, 1)
        assert counts["critical"] == 1
        assert counts["stockout"] == 0

    def test_overstock_product(self, db, company):
        """Product at or above max_stock is overstock."""
        p = Product(id=13, company_id=1, product_name="Overstock", category="C", unit_cost=1, selling_price=2)
        db.add(p)
        db.flush()
        inv = Inventory(product_id=p.id, warehouse="WH1", current_stock=200, reorder_point=20, max_stock=200)
        db.add(inv)
        db.commit()

        counts = dashboard_service._get_inventory_status_counts(db, 1)
        assert counts["overstock"] == 1


class TestDashboardSummary:
    def test_summary_returns_expected_keys(self, db, company, product_with_inventory):
        result = dashboard_service.get_dashboard_summary(db, company_id=1)
        assert "kpis" in result
        assert "top_insights" in result
        kpis = result["kpis"]
        assert "total_products" in kpis
        assert "inventory_health" in kpis
        assert "stockout_risk_count" in kpis
        assert "critical_risk_count" in kpis
        assert "overstock_risk_count" in kpis
        assert "suppliers_at_risk" in kpis
