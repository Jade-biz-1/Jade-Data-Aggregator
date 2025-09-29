from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.pipeline import Pipeline, PipelineCreate, PipelineUpdate
from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend import crud


router = APIRouter()


@router.get("/", response_model=list[Pipeline])
async def read_pipelines(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve pipelines
    """
    pipelines = await crud.pipeline.get_multi(db)
    return pipelines


@router.post("/", response_model=Pipeline)
async def create_pipeline(
    pipeline: PipelineCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new pipeline
    """
    db_pipeline = await crud.pipeline.create(db, obj_in=pipeline)
    return db_pipeline


@router.get("/{pipeline_id}", response_model=Pipeline)
async def read_pipeline(
    pipeline_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific pipeline by ID
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


@router.put("/{pipeline_id}", response_model=Pipeline)
async def update_pipeline(
    pipeline_id: int,
    pipeline_in: PipelineUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a pipeline
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    pipeline = await crud.pipeline.update(db, db_obj=pipeline, obj_in=pipeline_in)
    return pipeline


@router.delete("/{pipeline_id}", response_model=Pipeline)
async def delete_pipeline(
    pipeline_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a pipeline
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    pipeline = await crud.pipeline.remove(db, id=pipeline_id)
    return pipeline