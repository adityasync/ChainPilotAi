from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class SupplierBase(BaseModel):
    supplier_name: str
    avg_lead_time: Optional[int] = Field(None, gt=0)
    reliability_score: Optional[float] = Field(None, ge=0, le=1)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    avg_lead_time: Optional[int] = Field(None, ge=0)
    reliability_score: Optional[float] = Field(None, ge=0, le=1)


class SupplierResponse(SupplierBase):
    id: int
    company_id: int
    delay_probability: Optional[float] = None

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    supplier_id: int
    expected_delivery_date: date
    actual_delivery_date: Optional[date] = None
    shipping_cost: float = Field(ge=0)


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    supplier_id: Optional[int] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    shipping_cost: Optional[float] = Field(None, ge=0)


class ShipmentResponse(ShipmentBase):
    id: int

    class Config:
        from_attributes = True
