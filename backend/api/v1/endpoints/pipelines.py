import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.pagination import PaginatedResponse
from backend.schemas.pipeline import Pipeline, PipelineCreate, PipelineUpdate
from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_designer
from backend import crud
from backend.models.pipeline import Pipeline as PipelineModel


router = APIRouter()


@router.get("/", response_model=PaginatedResponse[Pipeline])
async def read_pipelines(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve pipelines with pagination metadata (all authenticated users can view).

    Returns ``items`` alongside ``total``, ``page``, ``pages``, and ``has_more``
    so the frontend can drive paginated tables correctly (API-001).
    """
    total_result = await db.execute(select(func.count()).select_from(PipelineModel))
    total = total_result.scalar() or 0

    pipelines = await crud.pipeline.get_multi(db, skip=skip, limit=limit)
    pages = math.ceil(total / limit) if limit else 1

    return PaginatedResponse(
        items=pipelines,
        total=total,
        skip=skip,
        limit=limit,
        page=skip // limit + 1 if limit else 1,
        pages=pages,
        has_more=(skip + limit) < total,
    )


@router.post("/", response_model=Pipeline)
async def create_pipeline(
    pipeline: PipelineCreate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new pipeline (Designer, Developer, Admin only)
    """
    db_pipeline = await crud.pipeline.create(db, obj_in=pipeline)
    return db_pipeline


@router.get("/{pipeline_id}", response_model=Pipeline)
async def read_pipeline(
    pipeline_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific pipeline by ID (all authenticated users can view)
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


@router.put("/{pipeline_id}", response_model=Pipeline)
async def update_pipeline(
    pipeline_id: int,
    pipeline_in: PipelineUpdate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a pipeline (Designer, Developer, Admin only)
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    pipeline = await crud.pipeline.update(db, db_obj=pipeline, obj_in=pipeline_in)
    return pipeline


@router.delete("/{pipeline_id}", response_model=Pipeline)
async def delete_pipeline(
    pipeline_id: int,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a pipeline (Designer, Developer, Admin only)
    """
    pipeline = await crud.pipeline.get(db, id=pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    pipeline = await crud.pipeline.remove(db, id=pipeline_id)
    return pipeline


# ---------------------------------------------------------------------------
# UX-002: Bulk delete
# ---------------------------------------------------------------------------

from pydantic import BaseModel
from typing import List as _List


class BulkDeleteRequest(BaseModel):
    ids: _List[int]


@router.delete("/bulk", status_code=200)
async def bulk_delete_pipelines(
    body: BulkDeleteRequest,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete multiple pipelines by ID in a single request (UX-002).
    IDs that do not exist are silently skipped.
    Returns the count of actually deleted pipelines.
    """
    deleted_count = 0
    for pid in body.ids:
        pipeline = await crud.pipeline.get(db, id=pid)
        if pipeline:
            await crud.pipeline.remove(db, id=pid)
            deleted_count += 1

    return {"deleted": deleted_count, "requested": len(body.ids)}