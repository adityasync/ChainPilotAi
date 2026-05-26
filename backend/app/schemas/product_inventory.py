from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    product_name: str
    category: Optional[str] = None
    unit_cost: float
    selling_price: float


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None


class ProductResponse(ProductBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    product_id: int
    warehouse: str
    current_stock: int
    reorder_point: int
    max_stock: int


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    product_id: Optional[int] = None
    warehouse: Optional[str] = None
    current_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    max_stock: Optional[int] = None


class InventoryItemResponse(InventoryItemBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True