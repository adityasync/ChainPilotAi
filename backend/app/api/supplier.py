from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, SupplierResponse, ShipmentCreate, ShipmentUpdate, ShipmentResponse
from ..services.supplier_service import (
    create_supplier, get_suppliers_by_company, count_suppliers_by_company, get_supplier_by_id, update_supplier, delete_supplier,
    create_shipment, get_shipments_by_company, count_shipments_by_company, get_shipments_by_supplier, count_shipments_by_supplier, get_shipment_by_id,
    get_supplier_detail,
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


@router.get("/")
def get_all_suppliers(
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    items = get_suppliers_by_company(db, company_id, skip, page_size)
    total = count_suppliers_by_company(db, company_id)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.post("/shipments/", response_model=ShipmentResponse)
def create_new_shipment(
    shipment: ShipmentCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_shipment(db, shipment, company_id)


@router.get("/shipments/")
def get_all_shipments(
    page: int = 1,
    page_size: int = 20,
    supplier_id: int | None = None,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    if supplier_id is not None:
        items = get_shipments_by_supplier(db, supplier_id, company_id, skip, page_size)
        total = count_shipments_by_supplier(db, supplier_id, company_id)
    else:
        items = get_shipments_by_company(db, company_id, skip, page_size)
        total = count_shipments_by_company(db, company_id)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


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


@router.get("/{supplier_id}/detail")
def get_supplier_with_shipments(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_supplier_detail(db, supplier_id, company_id)


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
