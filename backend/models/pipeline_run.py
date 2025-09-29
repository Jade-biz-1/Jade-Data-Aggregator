from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, BigInteger
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class PipelineRun(Base):
    """Model for tracking pipeline execution runs."""

    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)

    # Execution tracking
    status = Column(String, nullable=False, default="queued")  # queued, running, completed, failed, cancelled
    started_at = Column(DateTime(timezone=True), default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Data metrics
    records_processed = Column(BigInteger, default=0)
    records_failed = Column(BigInteger, default=0)

    # Execution details
    execution_config = Column(JSON, nullable=True)  # Runtime configuration
    error_message = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)  # Execution logs

    # Metadata
    triggered_by = Column(String, nullable=True)  # manual, scheduled, webhook
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    pipeline = relationship("Pipeline", back_populates="runs")


# Add this to the Pipeline model relationship
# This will need to be added to backend/models/pipeline.py