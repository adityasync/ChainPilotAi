from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..models.product_inventory import Product, Inventory
from ..models.user_company import User
from ..models.ml_models import Prediction
from ..schemas.product_inventory import ProductCreate, ProductUpdate, InventoryItemCreate, InventoryItemUpdate
from ..core.exceptions import NotFoundError, ForbiddenError


def _get_inventory_risk_predictions(db: Session, product_ids: list[int], company_id: int) -> dict[int, dict]:
    """Batch-fetch latest inventory_risk prediction for a list of product IDs."""
    if not product_ids:
        return {}

    from sqlalchemy import func, select

    subq = (
        db.query(
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

    rows = (
        db.query(Prediction.entity_id, Prediction.prediction_value)
        .join(
            subq,
            (Prediction.entity_id == subq.c.entity_id)
            & (Prediction.created_at == subq.c.max_created),
        )
        .all()
    )

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


def create_product(db: Session, product: ProductCreate, company_id: int):
    db_product = Product(**product.dict(), company_id=company_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_products_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    return db.query(Product).filter(Product.company_id == company_id).offset(skip).limit(limit).all()


def count_products_by_company(db: Session, company_id: int) -> int:
    from sqlalchemy import func
    return db.query(func.count(Product.id)).filter(Product.company_id == company_id).scalar() or 0


def get_product_by_id(db: Session, product_id: int, company_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise NotFoundError("Product")
    if product.company_id != company_id:
        raise ForbiddenError("Product does not belong to your company")
    return product


def update_product(db: Session, product_id: int, product_update: ProductUpdate, company_id: int):
    product = get_product_by_id(db, product_id, company_id)
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, company_id: int):
    product = get_product_by_id(db, product_id, company_id)
    db.delete(product)
    db.commit()
    return product


def create_inventory_item(db: Session, inventory_item: InventoryItemCreate, company_id: int):
    get_product_by_id(db, inventory_item.product_id, company_id)
    db_inventory_item = Inventory(**inventory_item.dict())
    db.add(db_inventory_item)
    db.commit()
    db.refresh(db_inventory_item)
    return db_inventory_item


def get_inventory_items_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    from ..models.product_inventory import Inventory
    return (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .order_by(Inventory.last_updated.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_inventory_items_by_company(db: Session, company_id: int) -> int:
    from sqlalchemy import func
    from ..models.product_inventory import Inventory
    return (
        db.query(func.count(Inventory.id))
        .join(Product, Inventory.product_id == Product.id)
        .filter(Product.company_id == company_id)
        .scalar()
    ) or 0


def get_inventory_item_by_id(db: Session, item_id: int, company_id: int):
    from ..models.product_inventory import Inventory
    inventory_item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not inventory_item:
        raise NotFoundError("Inventory item")
    product = db.query(Product).filter(Product.id == inventory_item.product_id).first()
    if not product or product.company_id != company_id:
        raise ForbiddenError("Inventory item does not belong to your company")
    return inventory_item


def update_inventory_item(db: Session, item_id: int, inventory_update: InventoryItemUpdate, company_id: int):
    inventory_item = get_inventory_item_by_id(db, item_id, company_id)
    if inventory_update.product_id is not None:
        get_product_by_id(db, inventory_update.product_id, company_id)
    update_data = inventory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inventory_item, field, value)
    db.commit()
    db.refresh(inventory_item)
    return inventory_item


def delete_inventory_item(db: Session, item_id: int, company_id: int):
    inventory_item = get_inventory_item_by_id(db, item_id, company_id)
    db.delete(inventory_item)
    db.commit()
    return inventory_item
