"""NFR-TEST-01: Unit tests for order_service."""

import pytest
from datetime import date
from app.services import order_service
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


class TestOrderCRUD:
    def test_create_order(self, db, company, product):
        schema = OrderCreate(product_id=product.id, order_date=date(2026, 3, 1), quantity=10, region="West")
        result = order_service.create_order(db, schema, company_id=1)
        assert result.id is not None
        assert result.quantity == 10
        assert result.region == "West"

    def test_create_order_wrong_company_product_raises(self, db, company, product):
        schema = OrderCreate(product_id=product.id, quantity=5)
        with pytest.raises(ForbiddenError):
            order_service.create_order(db, schema, company_id=999)

    def test_get_orders_by_company(self, db, company, product, order):
        orders = order_service.get_orders_by_company(db, company_id=1)
        assert len(orders) >= 1

    def test_get_order_by_id(self, db, company, product, order):
        result = order_service.get_order_by_id(db, order.id, company_id=1)
        assert result.id == order.id

    def test_get_order_wrong_company_raises(self, db, company, product, order):
        with pytest.raises(ForbiddenError):
            order_service.get_order_by_id(db, order.id, company_id=999)

    def test_get_nonexistent_order_raises(self, db):
        with pytest.raises(NotFoundError):
            order_service.get_order_by_id(db, 9999, company_id=1)

    def test_update_order(self, db, company, product, order):
        update = OrderUpdate(quantity=30)
        result = order_service.update_order(db, order.id, update, company_id=1)
        assert result.quantity == 30

    def test_delete_order(self, db, company, product, order):
        order_service.delete_order(db, order.id, company_id=1)
        with pytest.raises(NotFoundError):
            order_service.get_order_by_id(db, order.id, company_id=1)
