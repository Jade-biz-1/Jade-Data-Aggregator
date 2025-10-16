from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.connector import Connector, ConnectorCreate, ConnectorUpdate
from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_designer
from backend import crud


router = APIRouter()


@router.get("/", response_model=list[Connector])
async def read_connectors(
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve connectors (all authenticated users can view)
    """
    connectors = await crud.connector.get_multi(db)
    return connectors


@router.post("/", response_model=Connector)
async def create_connector(
    connector: ConnectorCreate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new connector (Designer, Developer, Admin only)
    """
    db_connector = await crud.connector.create(db, obj_in=connector)
    return db_connector


@router.get("/{connector_id}", response_model=Connector)
async def read_connector(
    connector_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific connector by ID (all authenticated users can view)
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    return connector


@router.put("/{connector_id}", response_model=Connector)
async def update_connector(
    connector_id: int,
    connector_in: ConnectorUpdate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a connector (Designer, Developer, Admin only)
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    connector = await crud.connector.update(db, db_obj=connector, obj_in=connector_in)
    return connector


@router.delete("/{connector_id}", response_model=Connector)
async def delete_connector(
    connector_id: int,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a connector (Designer, Developer, Admin only)
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    connector = await crud.connector.remove(db, id=connector_id)
    return connector