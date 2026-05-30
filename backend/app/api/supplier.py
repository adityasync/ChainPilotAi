from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.supplier_shipment import SupplierCreate, SupplierUpdate, SupplierResponse, ShipmentCreate, ShipmentUpdate, ShipmentResponse
from ..services.supplier_service import (
    create_supplier, get_suppliers_by_company, count_suppliers_by_company, get_supplier_by_id, update_supplier, delete_supplier,
    create_shipment, get_shipments_by_company, count_shipments_by_company, get_shipments_by_supplier, count_shipments_by_supplier, get_shipment_by_id,
    get_supplier_detail, get_suppliers_with_delay,
    update_shipment, delete_shipment
)

router = APIRouter()


@router.post("/", response_model=SupplierResponse)
async def create_new_supplier(
    supplier: SupplierCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await create_supplier(db, supplier, company_id)


@router.get("/")
async def get_all_suppliers(
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    items = await get_suppliers_with_delay(db, company_id, skip, page_size)
    total = await count_suppliers_by_company(db, company_id)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.post("/shipments/", response_model=ShipmentResponse)
async def create_new_shipment(
    shipment: ShipmentCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await create_shipment(db, shipment, company_id)


@router.get("/shipments/")
async def get_all_shipments(
    page: int = 1,
    page_size: int = 20,
    supplier_id: int | None = None,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    if supplier_id is not None:
        items = await get_shipments_by_supplier(db, supplier_id, company_id, skip, page_size)
        total = await count_shipments_by_supplier(db, supplier_id, company_id)
    else:
        items = await get_shipments_by_company(db, company_id, skip, page_size)
        total = await count_shipments_by_company(db, company_id)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def get_specific_shipment(
    shipment_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_shipment_by_id(db, shipment_id, company_id)


@router.put("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def update_existing_shipment(
    shipment_id: int,
    shipment_update: ShipmentUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await update_shipment(db, shipment_id, shipment_update, company_id)


@router.delete("/shipments/{shipment_id}")
async def delete_existing_shipment(
    shipment_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    await delete_shipment(db, shipment_id, company_id)
    return {"message": "Shipment deleted successfully"}


@router.get("/{supplier_id}/detail")
async def get_supplier_with_shipments(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_supplier_detail(db, supplier_id, company_id)


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_specific_supplier(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_supplier_by_id(db, supplier_id, company_id)


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_existing_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await update_supplier(db, supplier_id, supplier_update, company_id)


@router.delete("/{supplier_id}")
async def delete_existing_supplier(
    supplier_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    await delete_supplier(db, supplier_id, company_id)
    return {"message": "Supplier deleted successfully"}
