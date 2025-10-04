"""
Schema Mapping Database Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class SchemaDefinition(Base):
    """Model for storing schema definitions"""

    __tablename__ = "schema_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    source_type = Column(String, nullable=False)  # database, api, csv, json, etc.
    schema_data = Column(JSON, nullable=False)  # The actual schema structure
    connection_info = Column(JSON)  # Connection details (encrypted/masked)
    description = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    source_mappings = relationship(
        "SchemaMappingDefinition",
        foreign_keys="SchemaMappingDefinition.source_schema_id",
        back_populates="source_schema"
    )
    destination_mappings = relationship(
        "SchemaMappingDefinition",
        foreign_keys="SchemaMappingDefinition.destination_schema_id",
        back_populates="destination_schema"
    )


class SchemaMappingDefinition(Base):
    """Model for storing schema mappings"""

    __tablename__ = "schema_mappings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)

    source_schema_id = Column(Integer, ForeignKey("schema_definitions.id"), nullable=False)
    destination_schema_id = Column(Integer, ForeignKey("schema_definitions.id"), nullable=False)

    field_mappings = Column(JSON, nullable=False)  # Array of field mapping objects
    transformation_rules = Column(JSON)  # Generated transformation rules
    is_active = Column(Boolean, default=True)
    is_validated = Column(Boolean, default=False)
    validation_errors = Column(JSON)  # List of validation errors

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    source_schema = relationship(
        "SchemaDefinition",
        foreign_keys=[source_schema_id],
        back_populates="source_mappings"
    )
    destination_schema = relationship(
        "SchemaDefinition",
        foreign_keys=[destination_schema_id],
        back_populates="destination_mappings"
    )


class MappingTemplate(Base):
    """Model for reusable mapping templates"""

    __tablename__ = "mapping_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text)

    source_type = Column(String, nullable=False)  # Type of source system
    destination_type = Column(String, nullable=False)  # Type of destination system

    template_mappings = Column(JSON, nullable=False)  # Field mapping template
    is_public = Column(Boolean, default=False)  # Whether template is shared

    created_by = Column(Integer)  # User ID who created the template
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
