from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class PipelineRunBase(BaseModel):
    """Base schema for pipeline runs."""
    status: str
    records_processed: Optional[int] = 0
    records_failed: Optional[int] = 0
    execution_config: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    triggered_by: Optional[str] = None


class PipelineRunCreate(PipelineRunBase):
    """Schema for creating a pipeline run."""
    pipeline_id: int
    status: str = "queued"


class PipelineRunUpdate(BaseModel):
    """Schema for updating a pipeline run."""
    status: Optional[str] = None
    records_processed: Optional[int] = None
    records_failed: Optional[int] = None
    error_message: Optional[str] = None
    logs: Optional[str] = None
    completed_at: Optional[datetime] = None


class PipelineRun(PipelineRunBase):
    """Schema for pipeline run response."""
    id: int
    pipeline_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PipelineRunExecuteRequest(BaseModel):
    """Schema for pipeline execution request."""
    pipeline_id: int
    execution_config: Optional[Dict[str, Any]] = None
    triggered_by: str = "manual"


class PipelineRunExecuteResponse(BaseModel):
    """Schema for pipeline execution response."""
    run_id: int
    pipeline_id: int
    status: str
    message: str