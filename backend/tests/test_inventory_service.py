"""NFR-TEST-01: Unit tests for inventory_service."""

import pytest
from app.services import inventory_service
from app.schemas.product_inventory import ProductCreate, ProductUpdate, InventoryItemCreate, InventoryItemUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


class TestProductCRUD:
    def test_create_product(self, db, company):
        schema = ProductCreate(product_name="TestProd", category="Test", unit_cost=3.0, selling_price=7.0)
        result = inventory_service.create_product(db, schema, company_id=1)
        assert result.id is not None
        assert result.product_name == "TestProd"
        assert result.company_id == 1

    def test_get_products_by_company(self, db, company, product):
        products = inventory_service.get_products_by_company(db, company_id=1)
        assert len(products) >= 1
        assert all(p.company_id == 1 for p in products)

    def test_get_product_by_id(self, db, company, product):
        result = inventory_service.get_product_by_id(db, product.id, company_id=1)
        assert result.id == product.id

    def test_get_product_wrong_company_raises(self, db, company, product):
        with pytest.raises(ForbiddenError):
            inventory_service.get_product_by_id(db, product.id, company_id=999)

    def test_get_nonexistent_product_raises(self, db):
        with pytest.raises(NotFoundError):
            inventory_service.get_product_by_id(db, 9999, company_id=1)

    def test_update_product(self, db, company, product):
        update = ProductUpdate(product_name="Updated Widget")
        result = inventory_service.update_product(db, product.id, update, company_id=1)
        assert result.product_name == "Updated Widget"

    def test_delete_product(self, db, company, product):
        inventory_service.delete_product(db, product.id, company_id=1)
        with pytest.raises(NotFoundError):
            inventory_service.get_product_by_id(db, product.id, company_id=1)


class TestInventoryItemCRUD:
    def test_create_inventory_item(self, db, company, product):
        schema = InventoryItemCreate(product_id=product.id, warehouse="WH-NEW", current_stock=50, reorder_point=20, max_stock=100)
        result = inventory_service.create_inventory_item(db, schema, company_id=1)
        assert result.id is not None
        assert result.warehouse == "WH-NEW"

    def test_create_item_for_wrong_company_product_raises(self, db, company, product):
        schema = InventoryItemCreate(product_id=product.id, warehouse="WH", current_stock=10, reorder_point=5, max_stock=50)
        with pytest.raises(ForbiddenError):
            inventory_service.create_inventory_item(db, schema, company_id=999)

    def test_get_inventory_items_by_company(self, db, company, product_with_inventory):
        items = inventory_service.get_inventory_items_by_company(db, company_id=1)
        assert len(items) >= 1

    def test_update_inventory_item(self, db, company, product_with_inventory):
        item = product_with_inventory.inventory_items[0]
        update = InventoryItemUpdate(current_stock=150)
        result = inventory_service.update_inventory_item(db, item.id, update, company_id=1)
        assert result.current_stock == 150

    def test_delete_inventory_item(self, db, company, product_with_inventory):
        item = product_with_inventory.inventory_items[0]
        inventory_service.delete_inventory_item(db, item.id, company_id=1)
        with pytest.raises(NotFoundError):
            inventory_service.get_inventory_item_by_id(db, item.id, company_id=1)
