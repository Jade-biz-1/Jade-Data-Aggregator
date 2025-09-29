from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PipelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_config: dict
    destination_config: dict
    transformation_config: Optional[dict] = None
    schedule: Optional[str] = None  # Cron expression
    is_active: bool = True


class PipelineCreate(PipelineBase):
    pass


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_config: Optional[dict] = None
    destination_config: Optional[dict] = None
    transformation_config: Optional[dict] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None


class Pipeline(PipelineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True