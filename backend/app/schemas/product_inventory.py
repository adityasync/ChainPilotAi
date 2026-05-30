from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    product_name: str
    category: Optional[str] = None
    unit_cost: float = Field(ge=0)
    selling_price: float = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    product_id: int
    warehouse: str
    current_stock: int = Field(ge=0)
    reorder_point: int = Field(ge=0)
    max_stock: int = Field(gt=0)


class InventoryItemCreate(InventoryItemBase):
    @model_validator(mode="after")
    def check_reorder_less_than_max(self):
        if self.reorder_point >= self.max_stock:
            raise ValueError("reorder_point must be less than max_stock")
        return self


class InventoryItemUpdate(BaseModel):
    product_id: Optional[int] = None
    warehouse: Optional[str] = None
    current_stock: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, gt=0)

    @model_validator(mode="after")
    def check_reorder_less_than_max(self):
        if self.reorder_point is not None and self.max_stock is not None:
            if self.reorder_point >= self.max_stock:
                raise ValueError("reorder_point must be less than max_stock")
        return self


class InventoryItemResponse(InventoryItemBase):
    id: int
    last_updated: datetime
    risk_status: Optional[str] = None

    class Config:
        from_attributes = True
