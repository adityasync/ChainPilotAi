from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from datetime import datetime


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entity_type = Column(String, nullable=False)  # 'product' or 'supplier'
    entity_id = Column(Integer, nullable=False)  # ID of the referenced entity
    prediction_type = Column(String, nullable=False)  # type of prediction
    prediction_value = Column(Float, nullable=True)  # numeric prediction value
    prediction_text = Column(Text, nullable=True)  # AI-generated narrative text
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="predictions")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # 'low', 'medium', or 'high'
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # New fields for Phase 4 - Enhanced Insight Engine
    category = Column(String, nullable=True)  # 'inventory', 'supplier', 'cost', 'demand'
    confidence_score = Column(Float, nullable=True)  # From 0.0 to 1.0
    explanation = Column(Text, nullable=True)  # Human-readable explanation
    recommended_action = Column(Text, nullable=True)  # Specific action to take
    expected_impact = Column(String, nullable=True)  # Qualitative impact description
    urgency_level = Column(String, nullable=True)  # 'low', 'medium', 'high', 'critical'
    priority_score = Column(Float, nullable=True)  # Calculated priority score
    status = Column(String, default="new")  # 'new', 'acknowledged', 'resolved', 'expired'
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    expired_at = Column(DateTime(timezone=True), nullable=True)
    prediction_details = Column(String, nullable=True)  # JSON string with prediction details

    # Relationships
    company = relationship("Company", back_populates="insights")
