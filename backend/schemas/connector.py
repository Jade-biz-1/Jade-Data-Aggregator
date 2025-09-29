from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConnectorBase(BaseModel):
    name: str
    connector_type: str  # e.g., "rest_api", "database", "file", "saas"
    config: dict  # Connector-specific configuration
    is_active: bool = True


class ConnectorCreate(ConnectorBase):
    pass


class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    connector_type: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class Connector(ConnectorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True