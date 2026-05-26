from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime
from ..models.product_inventory import Product, Inventory
from ..models.user_company import User
from ..schemas.product_inventory import ProductCreate, ProductUpdate, InventoryItemCreate, InventoryItemUpdate
from ..core.company_isolation import apply_company_filter


def create_product(db: Session, product: ProductCreate, company_id: int):
    """Creates a product with company association"""
    db_product = Product(**product.dict(), company_id=company_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_products_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves products filtered by company"""
    return apply_company_filter(db.query(Product), Product, company_id).offset(skip).limit(limit).all()


def get_product_by_id(db: Session, product_id: int, company_id: int):
    """Gets a specific product with company verification"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Product does not belong to your company")
    return product


def update_product(db: Session, product_id: int, product_update: ProductUpdate, company_id: int):
    """Updates product with company verification"""
    product = get_product_by_id(db, product_id, company_id)
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, company_id: int):
    """Deletes product with company verification"""
    product = get_product_by_id(db, product_id, company_id)
    db.delete(product)
    db.commit()
    return product


def create_inventory_item(db: Session, inventory_item: InventoryItemCreate, company_id: int):
    """Creates inventory item with company association"""
    # Verify that the product belongs to the same company
    product = get_product_by_id(db, inventory_item.product_id, company_id)

    db_inventory_item = Inventory(**inventory_item.dict())
    db.add(db_inventory_item)
    db.commit()
    db.refresh(db_inventory_item)
    return db_inventory_item


def get_inventory_items_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves inventory items filtered by company"""
    return apply_company_filter(db.query(Inventory), Inventory, company_id).offset(skip).limit(limit).all()


def get_inventory_item_by_id(db: Session, item_id: int, company_id: int):
    """Gets specific inventory item with company verification"""
    inventory_item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Get the associated product to verify company ownership
    product = db.query(Product).filter(Product.id == inventory_item.product_id).first()
    if not product or product.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Inventory item does not belong to your company")

    return inventory_item


def update_inventory_item(db: Session, item_id: int, inventory_update: InventoryItemUpdate, company_id: int):
    """Updates inventory item with company verification"""
    inventory_item = get_inventory_item_by_id(db, item_id, company_id)

    # If product_id is being updated, verify it belongs to the same company
    if inventory_update.product_id is not None:
        get_product_by_id(db, inventory_update.product_id, company_id)

    update_data = inventory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory_item, field, value)
    db.commit()
    db.refresh(inventory_item)
    return inventory_item


def delete_inventory_item(db: Session, item_id: int, company_id: int):
    """Deletes inventory item with company verification"""
    inventory_item = get_inventory_item_by_id(db, item_id, company_id)
    db.delete(inventory_item)
    db.commit()
    return inventory_item