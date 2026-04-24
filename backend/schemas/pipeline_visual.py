"""
Schemas for Visual Pipeline Builder
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class NodeType(str, Enum):
    """Node types for visual pipeline"""
    # Source nodes
    DATABASE_SOURCE = "database_source"
    API_SOURCE = "api_source"
    FILE_SOURCE = "file_source"

    # Transformation nodes
    FILTER = "filter"
    MAP = "map"
    AGGREGATE = "aggregate"
    JOIN = "join"
    SORT = "sort"

    # Destination nodes
    DATABASE_DESTINATION = "database_destination"
    FILE_DESTINATION = "file_destination"
    API_DESTINATION = "api_destination"
    WAREHOUSE_DESTINATION = "warehouse_destination"


class NodePosition(BaseModel):
    """Position of a node on the canvas"""
    x: float
    y: float


Position = NodePosition


class PipelineNode(BaseModel):
    """Visual pipeline node definition.

    ``type`` accepts both the React-Flow generic types (``source``,
    ``transformation``, ``destination``) and the specific NodeType enum values
    (``database_source``, ``filter``, …).  The validation service resolves the
    semantic type via ``resolve_node_type()``.
    """
    id: str
    type: str          # intentionally str — see docstring above
    position: NodePosition
    data: Dict[str, Any] = Field(default_factory=dict)
    label: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

    def resolve_node_type(self) -> Optional[NodeType]:
        """Map React-Flow generic type + data subtypes → NodeType enum, or None."""
        raw = self.type.lower().strip()

        # Already a valid NodeType value
        try:
            return NodeType(raw)
        except ValueError:
            pass

        # Generic React-Flow types — look at data subtypes
        if raw == "source":
            subtype = (self.data.get("sourceType") or "").lower()
            mapping = {
                "database": NodeType.DATABASE_SOURCE,
                "db": NodeType.DATABASE_SOURCE,
                "api": NodeType.API_SOURCE,
                "file": NodeType.FILE_SOURCE,
                "csv_file": NodeType.FILE_SOURCE,
                "json_file": NodeType.FILE_SOURCE,
            }
            return mapping.get(subtype, NodeType.DATABASE_SOURCE)

        if raw == "transformation":
            subtype = (self.data.get("transformationType") or "").lower()
            mapping = {
                "filter": NodeType.FILTER,
                "map": NodeType.MAP,
                "aggregate": NodeType.AGGREGATE,
                "join": NodeType.JOIN,
                "sort": NodeType.SORT,
            }
            return mapping.get(subtype, NodeType.MAP)

        if raw == "destination":
            subtype = (self.data.get("destinationType") or "").lower()
            mapping = {
                "file": NodeType.FILE_DESTINATION,
                "csv_file": NodeType.FILE_DESTINATION,
                "database": NodeType.DATABASE_DESTINATION,
                "db": NodeType.DATABASE_DESTINATION,
                "api": NodeType.API_DESTINATION,
                "warehouse": NodeType.WAREHOUSE_DESTINATION,
            }
            return mapping.get(subtype, NodeType.FILE_DESTINATION)

        return None


class PipelineEdge(BaseModel):
    """Connection between pipeline nodes"""
    id: str
    source: str  # Source node ID
    target: str  # Target node ID
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    label: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class VisualPipelineDefinition(BaseModel):
    """Complete visual pipeline definition"""
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]
    viewport: Optional[Dict[str, Any]] = None


class PipelineTemplate(BaseModel):
    """Pipeline template for reusable pipelines"""
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    category: str
    visual_definition: VisualPipelineDefinition
    tags: List[str] = Field(default_factory=list)
    is_public: bool = True


class ValidationIssue(BaseModel):
    """A single validation error or warning with context and a fix suggestion."""
    severity: str  # "error" | "warning" | "suggestion"
    message: str
    suggestion: str = ""
    node_id: Optional[str] = None
    node_label: Optional[str] = None


class PipelineValidationResult(BaseModel):
    """Result of pipeline validation"""
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    issues: List[ValidationIssue] = Field(default_factory=list)


class NodeConfiguration(BaseModel):
    """Configuration for a specific node type"""
    node_id: str
    node_type: NodeType
    parameters: Dict[str, Any]
    validation_rules: Optional[Dict[str, Any]] = None


class PipelineExecutionStep(BaseModel):
    """Single step in pipeline execution"""
    step_number: int
    node_id: str
    node_type: NodeType
    status: str  # 'pending', 'running', 'completed', 'failed'
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    records_processed: int = 0
    error_message: Optional[str] = None
