"""
System Settings model for storing application configuration.
Used for runtime configuration like production safeguards.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from backend.core.database import Base


class SystemSetting(Base):
    """System-wide configuration settings."""
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    value_type = Column(String, default="string")  # string, boolean, integer, json
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For temporary settings
