from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class PipelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_config: dict
    destination_config: dict
    transformation_config: Optional[dict] = None
    schedule: Optional[str] = None
    is_active: bool = True
    pipeline_type: Optional[str] = None
    visual_definition: Optional[Any] = None
    node_definitions: Optional[Any] = None
    edge_definitions: Optional[Any] = None


class PipelineCreate(PipelineBase):
    owner_id: Optional[int] = None


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_config: Optional[dict] = None
    destination_config: Optional[dict] = None
    transformation_config: Optional[dict] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None
    pipeline_type: Optional[str] = None
    visual_definition: Optional[Any] = None
    node_definitions: Optional[Any] = None
    edge_definitions: Optional[Any] = None


class Pipeline(PipelineBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True