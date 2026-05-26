from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime, date
from ..models.order import Order
from ..models.product_inventory import Product
from ..schemas.order import OrderCreate, OrderUpdate
from ..core.company_isolation import apply_company_filter


def create_order(db: Session, order: OrderCreate, company_id: int):
    """Creates order with company association"""
    # Verify that the product belongs to the same company
    product = db.query(Product).filter(Product.id == order.product_id).first()
    if not product or product.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Product does not belong to your company")

    db_order = Order(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_orders_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    """Retrieves orders filtered by company (via Product relationship)"""
    return db.query(Order).join(Product).filter(Product.company_id == company_id).offset(skip).limit(limit).all()


def get_order_by_id(db: Session, order_id: int, company_id: int):
    """Gets specific order with company verification"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Get the associated product to verify company ownership
    product = db.query(Product).filter(Product.id == order.product_id).first()
    if not product or product.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Order does not belong to your company")

    return order


def update_order(db: Session, order_id: int, order_update: OrderUpdate, company_id: int):
    """Updates order with company verification"""
    order = get_order_by_id(db, order_id, company_id)

    # If product_id is being updated, verify it belongs to the same company
    if order_update.product_id is not None:
        product = db.query(Product).filter(Product.id == order_update.product_id).first()
        if not product or product.company_id != company_id:
            raise HTTPException(status_code=403, detail="Access denied: Product does not belong to your company")

    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


def delete_order(db: Session, order_id: int, company_id: int):
    """Deletes order with company verification"""
    order = get_order_by_id(db, order_id, company_id)
    db.delete(order)
    db.commit()
    return order