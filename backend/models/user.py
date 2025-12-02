from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Text
from sqlalchemy.orm import relationship
from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)

    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, index=True)  # Added index as per documentation
    is_superuser = Column(Boolean, default=False)

    # Role-based access control
    role = Column(String, default="viewer", index=True)  # admin, editor, viewer - Added index as per documentation

    # Email verification
    is_verified = Column(Boolean, default=False)

    # Two-Factor Authentication (2FA) - Phase 9B
    is_2fa_enabled = Column(Boolean, default=False)
    otp_secret = Column(String, nullable=True)
    otp_auth_url = Column(String, nullable=True)

    # Account Lockout - Phase 9B
    failed_login_attempts = Column(Integer, default=0)
    lockout_until = Column(DateTime(timezone=True), nullable=True)


    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    auth_tokens = relationship("AuthToken", back_populates="user")
    file_uploads = relationship("FileUpload", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    dashboard_layouts = relationship("DashboardLayout", back_populates="user")
    widget_preferences = relationship("WidgetPreference", back_populates="user")
    activity_logs = relationship("UserActivityLog", back_populates="user")

    # CRITICAL FIX: Added missing relationships as per documentation
    pipelines = relationship("Pipeline", back_populates="owner")
    connectors = relationship("Connector", back_populates="owner")
    transformations = relationship("Transformation", back_populates="owner")

