from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class Transformation(Base):
    __tablename__ = "transformations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    transformation_type = Column(String, nullable=False, index=True)  # e.g., "data_normalization", "currency_conversion", etc. - Added index as per documentation
    transformation_code = Column(Text, nullable=True)  # Added as per documentation
    source_fields = Column(JSON)  # List of field names
    target_fields = Column(JSON)  # List of field names
    transformation_rules = Column(JSON)  # Configuration for the transformation (was 'config' in docs)
    is_active = Column(Boolean, default=True)

    # Owner relationship - CRITICAL FIX
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="transformations")