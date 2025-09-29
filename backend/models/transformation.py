from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from backend.core.database import Base


class Transformation(Base):
    __tablename__ = "transformations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    transformation_type = Column(String, nullable=False)  # e.g., "data_normalization", "currency_conversion", etc.
    source_fields = Column(JSON)  # List of field names
    target_fields = Column(JSON)  # List of field names
    transformation_rules = Column(JSON)  # Configuration for the transformation
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())