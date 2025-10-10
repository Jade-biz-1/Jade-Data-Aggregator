"""
Activity Log Model
Tracks user actions for audit trail
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.core.database import Base


class UserActivityLog(Base):
    """Model for tracking user activity and audit trail"""
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for failed login attempts
    action = Column(String(100), nullable=False, index=True)  # login, logout, password_change, user_created, etc.
    details = Column(Text, nullable=True)  # JSON or text details about the action
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    user = relationship("User", back_populates="activity_logs")

    # Indexes for efficient querying
    __table_args__ = (
        Index('ix_activity_user_timestamp', 'user_id', 'timestamp'),
        Index('ix_activity_action_timestamp', 'action', 'timestamp'),
    )

    def __repr__(self):
        return f"<UserActivityLog(id={self.id}, user_id={self.user_id}, action={self.action}, timestamp={self.timestamp})>"
