"""NFR-TEST-01: Unit tests for supplier_service."""

import pytest
from datetime import date
from app.services import supplier_service
from app.schemas.supplier_shipment import SupplierCreate, SupplierUpdate, ShipmentCreate, ShipmentUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


class TestSupplierCRUD:
    def test_create_supplier(self, db, company):
        schema = SupplierCreate(supplier_name="NewSupplier", avg_lead_time=5, reliability_score=0.95)
        result = supplier_service.create_supplier(db, schema, company_id=1)
        assert result.id is not None
        assert result.supplier_name == "NewSupplier"

    def test_get_suppliers_by_company(self, db, company, supplier):
        suppliers = supplier_service.get_suppliers_by_company(db, company_id=1)
        assert len(suppliers) >= 1

    def test_get_supplier_by_id(self, db, company, supplier):
        result = supplier_service.get_supplier_by_id(db, supplier.id, company_id=1)
        assert result.id == supplier.id

    def test_get_supplier_wrong_company_raises(self, db, company, supplier):
        with pytest.raises(ForbiddenError):
            supplier_service.get_supplier_by_id(db, supplier.id, company_id=999)

    def test_update_supplier(self, db, company, supplier):
        update = SupplierUpdate(reliability_score=0.85)
        result = supplier_service.update_supplier(db, supplier.id, update, company_id=1)
        assert result.reliability_score == 0.85

    def test_delete_supplier(self, db, company, supplier):
        supplier_service.delete_supplier(db, supplier.id, company_id=1)
        with pytest.raises(NotFoundError):
            supplier_service.get_supplier_by_id(db, supplier.id, company_id=1)


class TestShipmentCRUD:
    def test_create_shipment(self, db, company, supplier):
        schema = ShipmentCreate(
            supplier_id=supplier.id,
            expected_delivery_date=date(2026, 4, 1),
            actual_delivery_date=date(2026, 4, 2),
            shipping_cost=200.0,
        )
        result = supplier_service.create_shipment(db, schema, company_id=1)
        assert result.id is not None
        assert result.shipping_cost == 200.0

    def test_create_shipment_wrong_company_raises(self, db, company, supplier):
        schema = ShipmentCreate(
            supplier_id=supplier.id,
            expected_delivery_date=date(2026, 4, 1),
            shipping_cost=100.0,
        )
        with pytest.raises(ForbiddenError):
            supplier_service.create_shipment(db, schema, company_id=999)

    def test_get_shipments_by_company(self, db, company, supplier, shipment):
        shipments = supplier_service.get_shipments_by_company(db, company_id=1)
        assert len(shipments) >= 1

    def test_get_shipments_by_supplier(self, db, company, supplier, shipment):
        shipments = supplier_service.get_shipments_by_supplier(db, supplier.id, company_id=1)
        assert len(shipments) >= 1

    def test_update_shipment(self, db, company, supplier, shipment):
        update = ShipmentUpdate(shipping_cost=300.0)
        result = supplier_service.update_shipment(db, shipment.id, update, company_id=1)
        assert result.shipping_cost == 300.0

    def test_delete_shipment(self, db, company, supplier, shipment):
        supplier_service.delete_shipment(db, shipment.id, company_id=1)
        with pytest.raises(NotFoundError):
            supplier_service.get_shipment_by_id(db, shipment.id, company_id=1)

    def test_get_supplier_detail(self, db, company, supplier, shipment):
        detail = supplier_service.get_supplier_detail(db, supplier.id, company_id=1)
        assert detail["supplier_name"] == "Acme Supplies"
        assert len(detail["shipments"]) >= 1
