from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from datetime import date


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_name = Column(String, nullable=False)
    avg_lead_time = Column(Integer, nullable=True)  # in days
    reliability_score = Column(Float, nullable=True)  # percentage

    # Relationships
    company = relationship("Company", back_populates="suppliers")
    shipments = relationship("Shipment", back_populates="supplier")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    expected_delivery_date = Column(Date, nullable=False)
    actual_delivery_date = Column(Date, nullable=True)
    shipping_cost = Column(Float, nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="shipments")