"""
Pipeline Template and Version Models
Supports pipeline templates and versioning
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.database import Base


class PipelineTemplate(Base):
    """Pipeline templates for quick pipeline creation"""
    __tablename__ = "pipeline_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)  # 'etl', 'elt', 'streaming', 'batch', etc.

    # Template definition
    template_definition = Column(JSON, nullable=False)  # Complete pipeline structure
    node_definitions = Column(JSON)  # Default node configurations
    edge_definitions = Column(JSON)  # Default edge configurations

    # Metadata
    is_public = Column(Boolean, default=False)  # Public templates visible to all users
    created_by = Column(Integer)  # User ID who created the template
    use_count = Column(Integer, default=0)  # Number of times template was used

    # Tags for discovery
    tags = Column(JSON)  # Array of tags for categorization

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PipelineVersion(Base):
    """Version history for pipelines"""
    __tablename__ = "pipeline_versions"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)

    # Version information
    version_number = Column(Integer, nullable=False)  # Incremental version number
    version_name = Column(String)  # Optional version name/tag (e.g., "v1.0", "production")
    change_description = Column(Text)  # Description of what changed

    # Snapshot of pipeline at this version
    pipeline_snapshot = Column(JSON, nullable=False)  # Complete pipeline configuration
    visual_definition = Column(JSON)  # Visual pipeline definition
    node_definitions = Column(JSON)  # Node configurations
    edge_definitions = Column(JSON)  # Edge configurations

    # Metadata
    created_by = Column(Integer)  # User ID who created this version
    is_active = Column(Boolean, default=False)  # Is this the active version?

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pipeline = relationship("Pipeline", backref="versions")


class TransformationFunction(Base):
    """Library of reusable transformation functions"""
    __tablename__ = "transformation_functions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    display_name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)  # 'filter', 'map', 'aggregate', 'custom', etc.

    # Function definition
    function_code = Column(Text, nullable=False)  # Python code for the function
    function_type = Column(String, default="python")  # 'python', 'sql', 'javascript'

    # Parameters
    parameters = Column(JSON)  # Parameter definitions for the function
    return_type = Column(String)  # Expected return type

    # Examples and documentation
    example_usage = Column(Text)  # Example of how to use the function
    example_input = Column(JSON)  # Sample input data
    example_output = Column(JSON)  # Expected output

    # Metadata
    is_builtin = Column(Boolean, default=False)  # Built-in vs user-defined
    is_public = Column(Boolean, default=False)  # Public functions visible to all
    created_by = Column(Integer)  # User ID who created the function
    use_count = Column(Integer, default=0)  # Number of times used

    # Tags for discovery
    tags = Column(JSON)  # Array of tags

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
