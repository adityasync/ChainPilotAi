from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from datetime import date


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(Date, nullable=False, default=date.today)
    quantity = Column(Integer, nullable=False)
    region = Column(String, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="orders")