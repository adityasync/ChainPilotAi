from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from ..models.product_inventory import Product, Inventory
from ..models.user_company import User
from ..models.ml_models import Prediction
from ..schemas.product_inventory import ProductCreate, ProductUpdate, InventoryItemCreate, InventoryItemUpdate
from ..core.exceptions import NotFoundError, ForbiddenError


async def _get_inventory_risk_predictions(db: AsyncSession, product_ids: list[int], company_id: int) -> dict[int, dict]:
    """Batch-fetch latest inventory_risk prediction for a list of product IDs."""
    if not product_ids:
        return {}

    subq = (
        select(
            Prediction.entity_id,
            func.max(Prediction.created_at).label("max_created"),
        )
        .filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "product",
            Prediction.entity_id.in_(product_ids),
            Prediction.prediction_type == "inventory_risk",
        )
        .group_by(Prediction.entity_id)
        .subquery()
    )

    stmt = (
        select(Prediction.entity_id, Prediction.prediction_value)
        .join(
            subq,
            (Prediction.entity_id == subq.c.entity_id)
            & (Prediction.created_at == subq.c.max_created),
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    return {row.entity_id: {"risk_score": float(row.prediction_value)} for row in rows}


def compute_risk_status(current_stock: int, reorder_point: int, max_stock: int) -> str:
    """Compute inventory risk status based on stock levels."""
    if current_stock <= reorder_point * 0.5:
        return "CRITICAL"
    if current_stock <= reorder_point:
        return "RISK"
    if max_stock > 0 and current_stock >= max_stock * 0.9:
        return "OVERSTOCK"
    return "HEALTHY"


def _enrich_with_risk(item, ml_risk: dict | None = None):
    """Add risk_status to an inventory item ORM object, including ML risk if available."""
    risk_status = compute_risk_status(item.current_stock, item.reorder_point, item.max_stock)
    item_dict = {
        "id": item.id,
        "product_id": item.product_id,
        "warehouse": item.warehouse,
        "current_stock": item.current_stock,
        "reorder_point": item.reorder_point,
        "max_stock": item.max_stock,
        "last_updated": item.last_updated,
        "risk_status": risk_status,
    }
    if ml_risk:
        item_dict["ml_risk_score"] = ml_risk.get("risk_score")
    return item_dict


async def create_product(db: AsyncSession, product: ProductCreate, company_id: int):
    """Creates a product with company association"""
    db_product = Product(**product.dict(), company_id=company_id)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def get_products_by_company(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves products filtered by company"""
    result = await db.execute(
        select(Product).options(selectinload(Product.inventory_items)).filter(Product.company_id == company_id).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def count_products_by_company(db: AsyncSession, company_id: int) -> int:
    result = await db.scalar(select(func.count(Product.id)).filter(Product.company_id == company_id))
    return result or 0


async def get_product_by_id(db: AsyncSession, product_id: int, company_id: int):
    """Gets a specific product with company verification"""
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise NotFoundError("Product")
    if product.company_id != company_id:
        raise ForbiddenError("Product does not belong to your company")
    return product


async def update_product(db: AsyncSession, product_id: int, product_update: ProductUpdate, company_id: int):
    """Updates product with company verification"""
    product = await get_product_by_id(db, product_id, company_id)
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: int, company_id: int):
    """Deletes product with company verification"""
    product = await get_product_by_id(db, product_id, company_id)
    await db.delete(product)
    await db.commit()
    return product


async def create_inventory_item(db: AsyncSession, inventory_item: InventoryItemCreate, company_id: int):
    """Creates inventory item with company association"""
    # Verify that the product belongs to the same company
    await get_product_by_id(db, inventory_item.product_id, company_id)

    db_inventory_item = Inventory(**inventory_item.dict())
    db.add(db_inventory_item)
    await db.commit()
    await db.refresh(db_inventory_item)
    return db_inventory_item


async def get_inventory_items_by_company(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves inventory items filtered by company"""
    result = await db.execute(
        select(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .order_by(Inventory.last_updated.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def count_inventory_items_by_company(db: AsyncSession, company_id: int) -> int:
    result = await db.scalar(
        select(func.count(Inventory.id))
        .join(Product, Inventory.product_id == Product.id)
        .filter(Product.company_id == company_id)
    )
    return result or 0


async def get_inventory_item_by_id(db: AsyncSession, item_id: int, company_id: int):
    """Gets specific inventory item with company verification"""
    result = await db.execute(select(Inventory).filter(Inventory.id == item_id))
    inventory_item = result.scalars().first()
    if not inventory_item:
        raise NotFoundError("Inventory item")

    # Get the associated product to verify company ownership
    prod_result = await db.execute(select(Product).filter(Product.id == inventory_item.product_id))
    product = prod_result.scalars().first()
    if not product or product.company_id != company_id:
        raise ForbiddenError("Inventory item does not belong to your company")

    return inventory_item


async def update_inventory_item(db: AsyncSession, item_id: int, inventory_update: InventoryItemUpdate, company_id: int):
    """Updates inventory item with company verification"""
    inventory_item = await get_inventory_item_by_id(db, item_id, company_id)

    # If product_id is being updated, verify it belongs to the same company
    if inventory_update.product_id is not None:
        await get_product_by_id(db, inventory_update.product_id, company_id)

    update_data = inventory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory_item, field, value)
    await db.commit()
    await db.refresh(inventory_item)
    return inventory_item


async def delete_inventory_item(db: AsyncSession, item_id: int, company_id: int):
    """Deletes inventory item with company verification"""
    inventory_item = await get_inventory_item_by_id(db, item_id, company_id)
    await db.delete(inventory_item)
    await db.commit()
    return inventory_item
