from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.product_inventory import ProductCreate, ProductUpdate, ProductResponse, InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from ..services.inventory_service import (
    create_product, get_products_by_company, count_products_by_company, get_product_by_id, update_product, delete_product,
    create_inventory_item, get_inventory_items_by_company, count_inventory_items_by_company, get_inventory_item_by_id,
    update_inventory_item, delete_inventory_item, _enrich_with_risk, _get_inventory_risk_predictions
)

router = APIRouter()


@router.post("/products/", response_model=ProductResponse)
async def create_new_product(
    product: ProductCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await create_product(db, product, company_id)


@router.get("/products/")
async def get_all_products(
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    items = await get_products_by_company(db, company_id, skip, page_size)
    total = await count_products_by_company(db, company_id)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_specific_product(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_product_by_id(db, product_id, company_id)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_existing_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await update_product(db, product_id, product_update, company_id)


@router.delete("/products/{product_id}")
async def delete_existing_product(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    await delete_product(db, product_id, company_id)
    return {"message": "Product deleted successfully"}


@router.post("/items/", response_model=InventoryItemResponse)
async def create_new_inventory_item(
    inventory_item: InventoryItemCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    item = await create_inventory_item(db, inventory_item, company_id)
    return _enrich_with_risk(item)


@router.get("/items/")
async def get_all_inventory_items(
    page: int = 1,
    page_size: int = 20,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    items = await get_inventory_items_by_company(db, company_id, skip, page_size)
    total = await count_inventory_items_by_company(db, company_id)

    # Batch-fetch ML risk predictions for all products in this page
    product_ids = [i.product_id for i in items]
    ml_risks = await _get_inventory_risk_predictions(db, product_ids, company_id)

    return {
        "data": [_enrich_with_risk(i, ml_risks.get(i.product_id)) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
async def get_specific_inventory_item(
    item_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    item = await get_inventory_item_by_id(db, item_id, company_id)
    return _enrich_with_risk(item)


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
async def update_existing_inventory_item(
    item_id: int,
    inventory_update: InventoryItemUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    item = await update_inventory_item(db, item_id, inventory_update, company_id)
    return _enrich_with_risk(item)


@router.delete("/items/{item_id}")
async def delete_existing_inventory_item(
    item_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    await delete_inventory_item(db, item_id, company_id)
    return {"message": "Inventory item deleted successfully"}
