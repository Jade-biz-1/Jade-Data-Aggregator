"""
User Preferences and Dashboard Layout Models

Database models for storing user preferences and custom dashboard layouts.
Part of Sub-Phase 6A: Enhanced UI/UX Support
"""

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.core.database import Base


class UserPreference(Base):
    """User preferences and settings"""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Theme and appearance
    theme = Column(String(20), default="light")  # light, dark, auto
    color_scheme = Column(String(50), default="default")
    font_size = Column(String(20), default="medium")  # small, medium, large

    # UI preferences
    sidebar_collapsed = Column(Boolean, default=False)
    notifications_enabled = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)

    # Accessibility
    high_contrast = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)
    screen_reader_optimized = Column(Boolean, default=False)
    keyboard_shortcuts_enabled = Column(Boolean, default=True)

    # Regional settings
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    date_format = Column(String(20), default="YYYY-MM-DD")
    time_format = Column(String(20), default="24h")  # 12h, 24h

    # Dashboard preferences
    default_dashboard = Column(String(100))
    items_per_page = Column(Integer, default=25)
    show_onboarding = Column(Boolean, default=True)

    # Custom preferences (JSON for extensibility)
    custom_settings = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences")

    __table_args__ = (
        Index('ix_user_preferences_user_id', 'user_id'),
    )


class DashboardLayout(Base):
    """Custom dashboard layouts and configurations"""
    __tablename__ = "dashboard_layouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(200), nullable=False)
    description = Column(Text)

    # Layout configuration (JSON)
    layout_config = Column(JSON, nullable=False)
    # Example structure:
    # {
    #   "grid": {"columns": 12, "rows": "auto"},
    #   "widgets": [
    #     {"id": "widget1", "type": "metrics", "position": {"x": 0, "y": 0, "w": 4, "h": 2}, "config": {...}},
    #     {"id": "widget2", "type": "chart", "position": {"x": 4, "y": 0, "w": 8, "h": 2}, "config": {...}}
    #   ]
    # }

    is_default = Column(Boolean, default=False)
    is_shared = Column(Boolean, default=False)  # Can other users see this layout
    is_template = Column(Boolean, default=False)  # Is this a template others can clone

    # Versioning
    version = Column(Integer, default=1)
    parent_layout_id = Column(Integer, ForeignKey("dashboard_layouts.id", ondelete="SET NULL"))

    # Metadata
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="dashboard_layouts")
    parent_layout = relationship("DashboardLayout", remote_side=[id], backref="child_layouts")

    __table_args__ = (
        Index('ix_dashboard_layouts_user_id', 'user_id'),
        Index('ix_dashboard_layouts_is_default', 'is_default'),
        Index('ix_dashboard_layouts_is_shared', 'is_shared'),
    )


class WidgetPreference(Base):
    """Individual widget preferences and state"""
    __tablename__ = "widget_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    widget_type = Column(String(100), nullable=False)  # e.g., "pipeline_metrics", "alert_summary"
    widget_id = Column(String(100), nullable=False)  # Unique identifier for this widget instance

    # Widget-specific configuration
    config = Column(JSON, default={})
    # Example: {"refresh_interval": 30, "chart_type": "line", "time_range": "7d"}

    # State
    is_visible = Column(Boolean, default=True)
    is_collapsed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="widget_preferences")

    __table_args__ = (
        Index('ix_widget_preferences_user_widget', 'user_id', 'widget_id'),
    )
