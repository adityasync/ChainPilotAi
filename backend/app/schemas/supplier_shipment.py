from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class SupplierBase(BaseModel):
    supplier_name: str
    avg_lead_time: Optional[int] = None
    reliability_score: Optional[float] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    avg_lead_time: Optional[int] = None
    reliability_score: Optional[float] = None


class SupplierResponse(SupplierBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    supplier_id: int
    expected_delivery_date: date
    actual_delivery_date: Optional[date] = None
    shipping_cost: float


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    supplier_id: Optional[int] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    shipping_cost: Optional[float] = None


class ShipmentResponse(ShipmentBase):
    id: int

    class Config:
        from_attributes = True