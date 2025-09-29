from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TransformationBase(BaseModel):
    name: str
    description: Optional[str] = None
    transformation_type: str
    source_fields: List[str]
    target_fields: List[str]
    transformation_rules: Dict[str, Any]  # Configuration for the transformation
    is_active: bool = True


class TransformationCreate(TransformationBase):
    pass


class TransformationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    transformation_type: Optional[str] = None
    source_fields: Optional[List[str]] = None
    target_fields: Optional[List[str]] = None
    transformation_rules: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class Transformation(TransformationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True