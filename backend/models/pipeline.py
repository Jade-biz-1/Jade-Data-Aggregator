from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)  # Changed from String to Text to match documentation
    source_config = Column(JSON, nullable=False)  # Configuration for data source
    destination_config = Column(JSON, nullable=False)  # Configuration for data destination
    transformation_config = Column(JSON)  # Configuration for data transformations
    schedule = Column(String)  # Cron expression for scheduling
    is_active = Column(Boolean, default=True, index=True)  # Added index as per documentation

    # Owner relationship - CRITICAL FIX
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Visual pipeline builder fields
    visual_definition = Column(JSON)  # Nodes and edges for visual pipeline
    pipeline_type = Column(String, default="traditional")  # 'traditional' or 'visual'
    node_definitions = Column(JSON)  # Detailed node configurations
    edge_definitions = Column(JSON)  # Connection definitions between nodes
    template_id = Column(Integer)  # Reference to pipeline template if used

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="pipelines")
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")
    file_uploads = relationship("FileUpload", back_populates="pipeline")