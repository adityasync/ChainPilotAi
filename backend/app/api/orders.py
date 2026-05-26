from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..api.auth import get_current_user
from ..core.company_isolation import get_current_user_company_id
from ..schemas.order import OrderCreate, OrderUpdate, OrderResponse
from ..services.order_service import (
    create_order, get_orders_by_company, get_order_by_id, update_order, delete_order
)

router = APIRouter()


@router.post("/", response_model=OrderResponse)
def create_new_order(
    order: OrderCreate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return create_order(db, order, company_id)


@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_orders_by_company(db, company_id, skip, limit)


@router.get("/{order_id}", response_model=OrderResponse)
def get_specific_order(
    order_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return get_order_by_id(db, order_id, company_id)


@router.put("/{order_id}", response_model=OrderResponse)
def update_existing_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    return update_order(db, order_id, order_update, company_id)


@router.delete("/{order_id}")
def delete_existing_order(
    order_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = get_current_user_company_id(db, current_user)
    delete_order(db, order_id, company_id)
    return {"message": "Order deleted successfully"}