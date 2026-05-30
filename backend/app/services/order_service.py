from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date
from ..models.order import Order
from ..models.product_inventory import Product
from ..schemas.order import OrderCreate, OrderUpdate
from ..core.exceptions import NotFoundError, ForbiddenError


async def create_order(db: AsyncSession, order: OrderCreate, company_id: int):
    """Creates order with company association"""
    # Verify that the product belongs to the same company
    result = await db.execute(select(Product).filter(Product.id == order.product_id))
    product = result.scalars().first()
    if not product or product.company_id != company_id:
        raise ForbiddenError("Product does not belong to your company")

    db_order = Order(**order.dict())
    db.add(db_order)
    await db.commit()
    await db.refresh(db_order)
    return db_order


async def get_orders_by_company(db: AsyncSession, company_id: int, skip: int = 0, limit: int = 100, product_id: int | None = None):
    """Retrieves orders filtered by company (via Product relationship), ordered by date desc."""
    query = select(Order).options(selectinload(Order.product)).join(Product).filter(Product.company_id == company_id)
    if product_id is not None:
        query = query.filter(Order.product_id == product_id)
    query = query.order_by(Order.order_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def count_orders_by_company(db: AsyncSession, company_id: int) -> int:
    result = await db.scalar(
        select(func.count(Order.id)).join(Product).filter(Product.company_id == company_id)
    )
    return result or 0


async def get_order_by_id(db: AsyncSession, order_id: int, company_id: int):
    """Gets specific order with company verification"""
    result = await db.execute(select(Order).filter(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise NotFoundError("Order")

    # Get the associated product to verify company ownership
    prod_result = await db.execute(select(Product).filter(Product.id == order.product_id))
    product = prod_result.scalars().first()
    if not product or product.company_id != company_id:
        raise ForbiddenError("Order does not belong to your company")

    return order


async def update_order(db: AsyncSession, order_id: int, order_update: OrderUpdate, company_id: int):
    """Updates order with company verification"""
    order = await get_order_by_id(db, order_id, company_id)

    # If product_id is being updated, verify it belongs to the same company
    if order_update.product_id is not None:
        result = await db.execute(select(Product).filter(Product.id == order_update.product_id))
        product = result.scalars().first()
        if not product or product.company_id != company_id:
            raise ForbiddenError("Product does not belong to your company")

    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    await db.commit()
    await db.refresh(order)
    return order


async def delete_order(db: AsyncSession, order_id: int, company_id: int):
    """Deletes order with company verification"""
    order = await get_order_by_id(db, order_id, company_id)
    await db.delete(order)
    await db.commit()
    return order
