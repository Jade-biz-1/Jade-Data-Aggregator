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


class PipelineNode(BaseModel):
    """Visual pipeline node definition"""
    id: str
    type: NodeType
    position: NodePosition
    data: Dict[str, Any] = Field(default_factory=dict)
    label: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


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


class PipelineValidationResult(BaseModel):
    """Result of pipeline validation"""
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


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
