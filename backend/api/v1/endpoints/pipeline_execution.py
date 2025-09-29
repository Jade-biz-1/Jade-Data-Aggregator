from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.schemas.user import User
from backend.schemas.pipeline_run import (
    PipelineRun,
    PipelineRunExecuteRequest,
    PipelineRunExecuteResponse
)
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.core.rbac import require_editor_or_admin
from backend.services.pipeline_executor import PipelineExecutor, PipelineExecutionError
from backend.crud.pipeline_run import pipeline_run as crud_pipeline_run


router = APIRouter()


@router.post("/{pipeline_id}/execute", response_model=PipelineRunExecuteResponse)
async def execute_pipeline(
    pipeline_id: int,
    request: PipelineRunExecuteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_editor_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute a pipeline.

    This creates a pipeline run and starts execution in the background.
    """
    try:
        executor = PipelineExecutor(db)

        # For now, we'll execute synchronously
        # In production, this should be moved to a background task queue like Celery
        run = await executor.execute_pipeline(
            pipeline_id=pipeline_id,
            execution_config=request.execution_config,
            triggered_by=request.triggered_by
        )

        return PipelineRunExecuteResponse(
            run_id=run.id,
            pipeline_id=pipeline_id,
            status=run.status,
            message=f"Pipeline execution {'completed' if run.status == 'completed' else 'started'}"
        )

    except PipelineExecutionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")


@router.get("/{pipeline_id}/runs", response_model=List[PipelineRun])
async def get_pipeline_runs(
    pipeline_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all runs for a specific pipeline.
    """
    executor = PipelineExecutor(db)
    runs = await executor.get_pipeline_runs(
        pipeline_id=pipeline_id,
        skip=skip,
        limit=limit
    )
    return runs


@router.get("/runs/{run_id}", response_model=PipelineRun)
async def get_pipeline_run(
    run_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific pipeline run.
    """
    executor = PipelineExecutor(db)
    run = await executor.get_run_status(run_id)

    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    return run


@router.post("/runs/{run_id}/cancel", response_model=PipelineRun)
async def cancel_pipeline_run(
    run_id: int,
    current_user: User = Depends(require_editor_or_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running pipeline.
    """
    try:
        executor = PipelineExecutor(db)
        run = await executor.cancel_run(run_id)
        return run

    except PipelineExecutionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs", response_model=List[PipelineRun])
async def get_all_recent_runs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent pipeline runs across all pipelines.
    """
    runs = await crud_pipeline_run.get_recent_runs(db, skip=skip, limit=limit)
    return runs