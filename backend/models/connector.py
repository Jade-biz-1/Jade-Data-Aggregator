from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    connector_type = Column(String, nullable=False, index=True)  # e.g., "rest_api", "database", "file", "saas" - Added index as per documentation
    config = Column(JSON, nullable=False)  # Connector-specific configuration
    is_active = Column(Boolean, default=True, index=True)  # Added index as per documentation

    # Owner relationship - CRITICAL FIX
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="connectors")