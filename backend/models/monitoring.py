"""
Monitoring Models

Models for enhanced logging, alerting, and system monitoring.
Part of Sub-Phase 5B: Advanced Monitoring
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.core.database import Base


class LogLevel(str, enum.Enum):
    """Log severity levels"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertSeverity(str, enum.Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SystemLog(Base):
    """
    System Log Model

    Stores structured application logs with correlation IDs for tracing.
    """
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Log identification
    correlation_id = Column(String(64), index=True)  # For request tracing
    request_id = Column(String(64), index=True)  # For individual requests
    session_id = Column(String(64), index=True, nullable=True)  # For user sessions

    # Log content
    level = Column(SQLEnum(LogLevel), nullable=False, index=True)
    message = Column(Text, nullable=False)
    logger_name = Column(String(100), index=True)  # Logger/module name

    # Context information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=True, index=True)
    component = Column(String(50), index=True)  # "api", "service", "pipeline", etc.
    function_name = Column(String(100))  # Function that logged

    # Request information
    http_method = Column(String(10), nullable=True)
    http_path = Column(String(500), nullable=True)
    http_status = Column(Integer, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(String(500), nullable=True)

    # Exception information
    exception_type = Column(String(100), nullable=True)
    exception_message = Column(Text, nullable=True)
    stack_trace = Column(Text, nullable=True)

    # Performance metrics
    duration_ms = Column(Float, nullable=True)  # Request/operation duration
    memory_usage_mb = Column(Float, nullable=True)  # Memory usage snapshot

    # Additional structured data
    extra_data = Column(JSONB)  # Additional context as JSON

    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    pipeline = relationship("Pipeline", foreign_keys=[pipeline_id])

    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_logs_timestamp_level', 'timestamp', 'level'),
        Index('idx_logs_correlation_timestamp', 'correlation_id', 'timestamp'),
        Index('idx_logs_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_logs_component_timestamp', 'component', 'timestamp'),
    )


class AlertRule(Base):
    """
    Alert Rule Model

    Defines configurable alert rules with thresholds and conditions.
    """
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)

    # Rule identification
    name = Column(String(200), nullable=False, unique=True)
    description = Column(Text)
    rule_type = Column(String(50), nullable=False, index=True)  # "threshold", "anomaly", "error_rate"

    # Rule configuration
    metric_name = Column(String(100), nullable=False)  # Metric to monitor
    condition = Column(String(20), nullable=False)  # "gt", "lt", "eq", "gte", "lte"
    threshold_value = Column(Float, nullable=False)
    time_window_minutes = Column(Integer, default=5)  # Evaluation window

    # Severity and priority
    severity = Column(SQLEnum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    priority = Column(Integer, default=3)  # 1-5, where 1 is highest

    # Alert configuration
    notification_channels = Column(JSONB)  # ["email", "slack", "webhook"]
    notification_config = Column(JSONB)  # Channel-specific configurations
    cooldown_minutes = Column(Integer, default=15)  # Min time between alerts

    # Escalation policy
    escalation_policy_id = Column(Integer, ForeignKey("alert_escalation_policies.id"), nullable=True)
    auto_escalate_after_minutes = Column(Integer, nullable=True)

    # Rule status
    is_active = Column(Boolean, default=True, index=True)
    last_triggered_at = Column(DateTime, nullable=True)
    last_evaluated_at = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)

    # Query configuration
    query_config = Column(JSONB)  # Additional query parameters

    # Ownership
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    escalation_policy = relationship("AlertEscalationPolicy", back_populates="rules")
    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class AlertEscalationPolicy(Base):
    """
    Alert Escalation Policy Model

    Defines how alerts should be escalated over time.
    """
    __tablename__ = "alert_escalation_policies"

    id = Column(Integer, primary_key=True, index=True)

    # Policy identification
    name = Column(String(200), nullable=False, unique=True)
    description = Column(Text)

    # Escalation levels (ordered)
    escalation_levels = Column(JSONB, nullable=False)
    # Example: [
    #   {"level": 1, "delay_minutes": 0, "notify": ["team_lead"]},
    #   {"level": 2, "delay_minutes": 15, "notify": ["manager"]},
    #   {"level": 3, "delay_minutes": 30, "notify": ["director"]}
    # ]

    # Policy status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rules = relationship("AlertRule", back_populates="escalation_policy")


class Alert(Base):
    """
    Alert Model

    Stores triggered alerts with their history and acknowledgment status.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # Alert identification
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=False, index=True)
    alert_key = Column(String(200), index=True)  # Unique key for deduplication

    # Alert details
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False, index=True)

    # Trigger information
    triggered_value = Column(Float)  # Actual value that triggered alert
    threshold_value = Column(Float)  # Threshold that was exceeded
    metric_name = Column(String(100))

    # Context
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=True, index=True)
    component = Column(String(50), index=True)  # System component
    resource_type = Column(String(50))  # "cpu", "memory", "disk", etc.
    resource_id = Column(String(100))  # Specific resource identifier

    # Alert data
    alert_data = Column(JSONB)  # Additional alert context
    evaluation_data = Column(JSONB)  # Metric values during evaluation

    # Acknowledgment
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledgment_note = Column(Text, nullable=True)

    # Resolution
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_note = Column(Text, nullable=True)
    auto_resolved = Column(Boolean, default=False)

    # Escalation
    current_escalation_level = Column(Integer, default=0)
    escalated_at = Column(DateTime, nullable=True)
    escalation_history = Column(JSONB)  # History of escalation actions

    # Notification tracking
    notifications_sent = Column(JSONB)  # Track sent notifications
    last_notification_at = Column(DateTime, nullable=True)

    # Timestamps
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rule = relationship("AlertRule", back_populates="alerts")
    pipeline = relationship("Pipeline", foreign_keys=[pipeline_id])
    acknowledged_by_user = relationship("User", foreign_keys=[acknowledged_by])
    resolved_by_user = relationship("User", foreign_keys=[resolved_by])
    actions = relationship("AlertAction", back_populates="alert", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_alerts_status_severity', 'status', 'severity'),
        Index('idx_alerts_triggered_at', 'triggered_at'),
        Index('idx_alerts_rule_status', 'alert_rule_id', 'status'),
    )


class AlertAction(Base):
    """
    Alert Action Model

    Records actions taken on alerts (acknowledgments, escalations, notifications).
    """
    __tablename__ = "alert_actions"

    id = Column(Integer, primary_key=True, index=True)

    # Action details
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)  # "acknowledge", "escalate", "notify", "resolve"
    action_description = Column(Text)

    # Action context
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    automated = Column(Boolean, default=False)

    # Action data
    action_data = Column(JSONB)  # Additional action details

    # Timestamp
    performed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    alert = relationship("Alert", back_populates="actions")
    user = relationship("User", foreign_keys=[performed_by])


class LogArchive(Base):
    """
    Log Archive Model

    Tracks archived log files for long-term retention.
    """
    __tablename__ = "log_archives"

    id = Column(Integer, primary_key=True, index=True)

    # Archive identification
    archive_name = Column(String(200), nullable=False)
    archive_path = Column(String(500), nullable=False)

    # Archive details
    log_count = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    file_size_bytes = Column(Integer)

    # Compression
    is_compressed = Column(Boolean, default=True)
    compression_type = Column(String(20))  # "gzip", "bzip2", etc.

    # Storage location
    storage_type = Column(String(50), default="local")  # "local", "s3", "gcs"
    storage_metadata = Column(JSONB)  # Storage-specific metadata

    # Retention
    retention_days = Column(Integer, default=365)
    expires_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    archived_at = Column(DateTime, default=datetime.utcnow)
