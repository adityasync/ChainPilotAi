from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class OrderBase(BaseModel):
    product_id: int
    order_date: date = Field(default_factory=date.today)
    quantity: int = Field(gt=0)
    region: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    product_id: Optional[int] = None
    order_date: Optional[date] = None
    quantity: Optional[int] = Field(None, gt=0)
    region: Optional[str] = None


class OrderResponse(OrderBase):
    id: int

    class Config:
        from_attributes = True
