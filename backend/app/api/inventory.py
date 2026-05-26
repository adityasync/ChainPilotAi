from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.product_inventory import ProductCreate, ProductUpdate, ProductResponse, InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from ..services.inventory_service import (
    create_product, get_products_by_company, get_product_by_id, update_product, delete_product,
    create_inventory_item, get_inventory_items_by_company, get_inventory_item_by_id,
    update_inventory_item, delete_inventory_item
)

router = APIRouter()


@router.post("/products/", response_model=ProductResponse)
def create_new_product(
    product: ProductCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_product(db, product, company_id)


@router.get("/products/", response_model=List[ProductResponse])
def get_all_products(
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_products_by_company(db, company_id, skip, limit)


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_specific_product(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_product_by_id(db, product_id, company_id)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return update_product(db, product_id, product_update, company_id)


@router.delete("/products/{product_id}")
def delete_existing_product(
    product_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    delete_product(db, product_id, company_id)
    return {"message": "Product deleted successfully"}


@router.post("/items/", response_model=InventoryItemResponse)
def create_new_inventory_item(
    inventory_item: InventoryItemCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_inventory_item(db, inventory_item, company_id)


@router.get("/items/", response_model=List[InventoryItemResponse])
def get_all_inventory_items(
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_inventory_items_by_company(db, company_id, skip, limit)


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_specific_inventory_item(
    item_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_inventory_item_by_id(db, item_id, company_id)


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_existing_inventory_item(
    item_id: int,
    inventory_update: InventoryItemUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return update_inventory_item(db, item_id, inventory_update, company_id)


@router.delete("/items/{item_id}")
def delete_existing_inventory_item(
    item_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    delete_inventory_item(db, item_id, company_id)
    return {"message": "Inventory item deleted successfully"}