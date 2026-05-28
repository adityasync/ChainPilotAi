from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from ..models.supplier_shipment import Supplier, Shipment
from ..models.ml_models import Prediction
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, ShipmentCreate, ShipmentUpdate
from ..core.company_isolation import apply_company_filter
from ..core.exceptions import NotFoundError, ForbiddenError


def create_supplier(db: Session, supplier: SupplierCreate, company_id: int):
    """Creates supplier with company association"""
    db_supplier = Supplier(**supplier.dict(), company_id=company_id)
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_suppliers_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves suppliers filtered by company"""
    return apply_company_filter(db.query(Supplier), Supplier, company_id).offset(skip).limit(limit).all()


def count_suppliers_by_company(db: Session, company_id: int) -> int:
    return apply_company_filter(db.query(Supplier), Supplier, company_id).count()


def get_supplier_by_id(db: Session, supplier_id: int, company_id: int):
    """Gets specific supplier with company verification"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise NotFoundError("Supplier")
    if supplier.company_id != company_id:
        raise ForbiddenError("Supplier does not belong to your company")
    return supplier


def update_supplier(db: Session, supplier_id: int, supplier_update: SupplierUpdate, company_id: int):
    """Updates supplier with company verification"""
    supplier = get_supplier_by_id(db, supplier_id, company_id)
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


def delete_supplier(db: Session, supplier_id: int, company_id: int):
    """Deletes supplier with company verification"""
    supplier = get_supplier_by_id(db, supplier_id, company_id)
    db.delete(supplier)
    db.commit()
    return supplier


def create_shipment(db: Session, shipment: ShipmentCreate, company_id: int):
    """Creates shipment with company association"""
    # Verify that the supplier belongs to the same company
    supplier = get_supplier_by_id(db, shipment.supplier_id, company_id)

    db_shipment = Shipment(**shipment.dict())
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment


def get_shipments_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves shipments filtered by company"""
    return (
        db.query(Shipment)
        .join(Supplier, Shipment.supplier_id == Supplier.id)
        .filter(Supplier.company_id == company_id)
        .order_by(Shipment.expected_delivery_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_shipments_by_company(db: Session, company_id: int) -> int:
    return (
        db.query(Shipment)
        .join(Supplier, Shipment.supplier_id == Supplier.id)
        .filter(Supplier.company_id == company_id)
        .count()
    )


def get_shipments_by_supplier(
    db: Session,
    supplier_id: int,
    company_id: int,
    skip: int = 0,
    limit: int = 20,
):
    """Retrieves shipments for a specific supplier with company verification"""
    get_supplier_by_id(db, supplier_id, company_id)
    return (
        db.query(Shipment)
        .filter(Shipment.supplier_id == supplier_id)
        .order_by(Shipment.expected_delivery_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_shipments_by_supplier(db: Session, supplier_id: int, company_id: int) -> int:
    get_supplier_by_id(db, supplier_id, company_id)
    return db.query(Shipment).filter(Shipment.supplier_id == supplier_id).count()


def get_shipment_by_id(db: Session, shipment_id: int, company_id: int):
    """Gets specific shipment with company verification"""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise NotFoundError("Shipment")

    # Get the associated supplier to verify company ownership
    supplier = db.query(Supplier).filter(Supplier.id == shipment.supplier_id).first()
    if not supplier or supplier.company_id != company_id:
        raise ForbiddenError("Shipment does not belong to your company")

    return shipment


def update_shipment(db: Session, shipment_id: int, shipment_update: ShipmentUpdate, company_id: int):
    """Updates shipment with company verification"""
    shipment = get_shipment_by_id(db, shipment_id, company_id)

    # If supplier_id is being updated, verify it belongs to the same company
    if shipment_update.supplier_id is not None:
        get_supplier_by_id(db, shipment_update.supplier_id, company_id)

    update_data = shipment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shipment, field, value)
    db.commit()
    db.refresh(shipment)
    return shipment


def delete_shipment(db: Session, shipment_id: int, company_id: int):
    """Deletes shipment with company verification"""
    shipment = get_shipment_by_id(db, shipment_id, company_id)
    db.delete(shipment)
    db.commit()
    return shipment


def get_supplier_detail(db: Session, supplier_id: int, company_id: int):
    supplier = get_supplier_by_id(db, supplier_id, company_id)
    shipments = get_shipments_by_supplier(db, supplier_id, company_id, 0, 10)
    latest_delay_prediction = (
        db.query(Prediction)
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id == supplier_id,
            Prediction.prediction_type.in_(["delay_probability", "delay_risk"]),
        )
        .order_by(Prediction.created_at.desc())
        .first()
    )

    return {
        "id": supplier.id,
        "company_id": supplier.company_id,
        "supplier_name": supplier.supplier_name,
        "avg_lead_time": supplier.avg_lead_time,
        "reliability_score": supplier.reliability_score,
        "delay_probability": (
            float(latest_delay_prediction.prediction_value)
            if latest_delay_prediction
            else None
        ),
        "shipments": [
            {
                "id": shipment.id,
                "supplier_id": shipment.supplier_id,
                "expected_delivery_date": shipment.expected_delivery_date,
                "actual_delivery_date": shipment.actual_delivery_date,
                "shipping_cost": shipment.shipping_cost,
            }
            for shipment in shipments
        ],
    }
