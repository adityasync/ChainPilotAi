from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import List

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..core.exceptions import ValidationError
from ..models.order import Order
from ..models.product_inventory import Product
from ..schemas.order import OrderCreate, OrderUpdate, OrderResponse
from ..services.order_service import (
    create_order, get_orders_by_company, count_orders_by_company, get_order_by_id, update_order, delete_order
)

router = APIRouter()


@router.post("/", response_model=OrderResponse)
async def create_new_order(
    order: OrderCreate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await create_order(db, order, company_id)


@router.post("/bulk")
async def create_orders_bulk(
    orders: List[OrderCreate],
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_current_user_company_id(db, current_user)

    # Verify all products belong to this company
    product_ids = list({o.product_id for o in orders})
    result = await db.execute(
        select(Product.id).filter(Product.id.in_(product_ids), Product.company_id == company_id)
    )
    valid_ids = {row[0] for row in result.all()}
    invalid = [o.product_id for o in orders if o.product_id not in valid_ids]
    if invalid:
        raise ValidationError(f"Products not found: {invalid[:5]}", field="product_id")

    db_orders = [Order(**o.model_dump()) for o in orders]
    db.add_all(db_orders)
    await db.commit()
    return {"created": len(db_orders)}


@router.get("/")
async def get_all_orders(
    page: int = 1,
    page_size: int = 20,
    product_id: int | None = None,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    skip = (page - 1) * page_size
    items = await get_orders_by_company(db, company_id, skip, page_size, product_id=product_id)
    total = await count_orders_by_company(db, company_id)
    data = [
        {
            "id": o.id,
            "product_id": o.product_id,
            "product_name": o.product.product_name if o.product else None,
            "order_date": o.order_date.isoformat() if o.order_date else None,
            "quantity": o.quantity,
            "region": o.region,
        }
        for o in items
    ]
    return {"data": data, "total": total, "page": page, "page_size": page_size}


@router.get("/{order_id}", response_model=OrderResponse)
async def get_specific_order(
    order_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await get_order_by_id(db, order_id, company_id)


@router.put("/{order_id}", response_model=OrderResponse)
async def update_existing_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    return await update_order(db, order_id, order_update, company_id)


@router.delete("/{order_id}")
async def delete_existing_order(
    order_id: int,
    current_user: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = await get_current_user_company_id(db, current_user)
    await delete_order(db, order_id, company_id)
    return {"message": "Order deleted successfully"}
