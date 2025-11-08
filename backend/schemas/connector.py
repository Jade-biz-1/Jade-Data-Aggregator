from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ConnectorBase(BaseModel):
    name: str
    connector_type: str  # e.g., "rest_api", "database", "file", "saas"
    config: dict  # Connector-specific configuration
    is_active: bool = True


class ConnectorCreate(ConnectorBase):
    owner_id: int


class ConnectorUpdate(BaseModel):
    name: Optional[str] = None
    connector_type: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class Connector(ConnectorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True