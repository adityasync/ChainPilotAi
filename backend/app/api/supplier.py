from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, SupplierResponse, ShipmentCreate, ShipmentUpdate, ShipmentResponse
from ..services.supplier_service import (
    create_supplier, get_suppliers_by_company, get_supplier_by_id, update_supplier, delete_supplier,
    create_shipment, get_shipments_by_company, get_shipment_by_id,
    update_shipment, delete_shipment
)

router = APIRouter()


@router.post("/", response_model=SupplierResponse)
def create_new_supplier(
    supplier: SupplierCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_supplier(db, supplier, company_id)


@router.get("/", response_model=List[SupplierResponse])
def get_all_suppliers(
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_suppliers_by_company(db, company_id, skip, limit)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_specific_supplier(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_supplier_by_id(db, supplier_id, company_id)


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_existing_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return update_supplier(db, supplier_id, supplier_update, company_id)


@router.delete("/{supplier_id}")
def delete_existing_supplier(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    delete_supplier(db, supplier_id, company_id)
    return {"message": "Supplier deleted successfully"}


@router.post("/shipments/", response_model=ShipmentResponse)
def create_new_shipment(
    shipment: ShipmentCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_shipment(db, shipment, company_id)


@router.get("/shipments/", response_model=List[ShipmentResponse])
def get_all_shipments(
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_shipments_by_company(db, company_id, skip, limit)


@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
def get_specific_shipment(
    shipment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_shipment_by_id(db, shipment_id, company_id)


@router.put("/shipments/{shipment_id}", response_model=ShipmentResponse)
def update_existing_shipment(
    shipment_id: int,
    shipment_update: ShipmentUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return update_shipment(db, shipment_id, shipment_update, company_id)


@router.delete("/shipments/{shipment_id}")
def delete_existing_shipment(
    shipment_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    delete_shipment(db, shipment_id, company_id)
    return {"message": "Shipment deleted successfully"}