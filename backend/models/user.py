from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, index=True)  # Added index as per documentation
    is_superuser = Column(Boolean, default=False)

    # Role-based access control
    role = Column(String, default="viewer", index=True)  # admin, editor, viewer - Added index as per documentation

    # Email verification
    is_email_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    auth_tokens = relationship("AuthToken", back_populates="user")
    file_uploads = relationship("FileUpload", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    dashboard_layouts = relationship("DashboardLayout", back_populates="user")
    widget_preferences = relationship("WidgetPreference", back_populates="user")

    # CRITICAL FIX: Added missing relationships as per documentation
    pipelines = relationship("Pipeline", back_populates="owner")
    connectors = relationship("Connector", back_populates="owner")
    transformations = relationship("Transformation", back_populates="owner")