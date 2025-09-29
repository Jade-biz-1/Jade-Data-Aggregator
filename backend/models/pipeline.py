from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    source_config = Column(JSON, nullable=False)  # Configuration for data source
    destination_config = Column(JSON, nullable=False)  # Configuration for data destination
    transformation_config = Column(JSON)  # Configuration for data transformations
    schedule = Column(String)  # Cron expression for scheduling
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")