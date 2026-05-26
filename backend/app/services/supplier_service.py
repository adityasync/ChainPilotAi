from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime, date
from ..models.supplier_shipment import Supplier, Shipment
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, ShipmentCreate, ShipmentUpdate
from ..core.company_isolation import apply_company_filter


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


def get_supplier_by_id(db: Session, supplier_id: int, company_id: int):
    """Gets specific supplier with company verification"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if supplier.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Supplier does not belong to your company")
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
    return apply_company_filter(db.query(Shipment), Shipment, company_id).offset(skip).limit(limit).all()


def get_shipment_by_id(db: Session, shipment_id: int, company_id: int):
    """Gets specific shipment with company verification"""
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    # Get the associated supplier to verify company ownership
    supplier = db.query(Supplier).filter(Supplier.id == shipment.supplier_id).first()
    if not supplier or supplier.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Shipment does not belong to your company")

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