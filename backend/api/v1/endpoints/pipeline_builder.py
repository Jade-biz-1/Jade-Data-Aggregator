"""
Pipeline Builder API Endpoints
Handles visual pipeline creation, validation, and testing
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated
from backend.schemas.pipeline_visual import (
    VisualPipelineDefinition,
    PipelineValidationResult,
    PipelineTemplate
)
from backend.services.pipeline_validation_service import pipeline_validation_service
from backend.services.pipeline_execution_engine import pipeline_execution_engine

router = APIRouter()


@router.post("/validate")
async def validate_pipeline(
    definition: VisualPipelineDefinition,
    current_user: User = Depends(require_any_authenticated())
) -> PipelineValidationResult:
    """
    Validate a visual pipeline definition
    """
    result = pipeline_validation_service.validate_pipeline(definition)
    return result


@router.post("/dry-run/{pipeline_id}")
async def dry_run_pipeline(
    pipeline_id: int,
    definition: VisualPipelineDefinition,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Perform a dry-run of the pipeline without actually processing data
    """
    # Validate first
    validation = pipeline_validation_service.validate_pipeline(definition)

    if not validation.is_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Pipeline validation failed",
                "errors": validation.errors
            }
        )

    # Execute dry run
    state = await pipeline_execution_engine.execute_pipeline(
        pipeline_id=pipeline_id,
        definition=definition,
        dry_run=True
    )

    return {
        "pipeline_id": pipeline_id,
        "status": state.status,
        "total_steps": len(state.steps),
        "steps": [
            {
                "step_number": step.step_number,
                "node_id": step.node_id,
                "node_type": step.node_type,
                "status": step.status,
                "records_processed": step.records_processed
            }
            for step in state.steps
        ],
        "execution_log": state.execution_log,
        "validation": validation.dict()
    }


@router.post("/execute/{pipeline_id}")
async def execute_visual_pipeline(
    pipeline_id: int,
    definition: VisualPipelineDefinition,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Execute a visual pipeline using the real pipeline executor.
    Runs synchronously and returns the final result.
    """
    from backend.services.pipeline_executor import PipelineExecutor, PipelineExecutionError

    # Validate before executing
    validation = pipeline_validation_service.validate_pipeline(definition)
    if not validation.is_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Pipeline validation failed",
                "errors": validation.errors,
                "issues": [i.dict() for i in (validation.issues or [])],
            },
        )

    executor = PipelineExecutor(db)
    try:
        run = await executor.execute_pipeline(
            pipeline_id=pipeline_id,
            triggered_by="builder",
        )
    except PipelineExecutionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return {
        "pipeline_id": pipeline_id,
        "run_id": run.id,
        "status": run.status,
        "records_processed": run.records_processed or 0,
        "records_failed": run.records_failed or 0,
        "logs": run.logs or "",
        "error_message": run.error_message,
    }


@router.get("/execution-state/{pipeline_id}")
async def get_execution_state(
    pipeline_id: int,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Return the most recent run record for a pipeline (used for post-execution polling).
    """
    from backend.crud.pipeline_run import pipeline_run as crud_run
    runs = await crud_run.get_by_pipeline(db, pipeline_id=pipeline_id, skip=0, limit=1)
    if not runs:
        raise HTTPException(status_code=404, detail="No runs found for this pipeline")
    run = runs[0]
    return {
        "pipeline_id": pipeline_id,
        "run_id": run.id,
        "status": run.status,
        "records_processed": run.records_processed or 0,
        "records_failed": run.records_failed or 0,
        "logs": run.logs or "",
        "error_message": run.error_message,
    }


@router.post("/cancel/{pipeline_id}")
async def cancel_pipeline_execution(
    pipeline_id: int,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, str]:
    """
    Cancel a running pipeline execution
    """
    pipeline_execution_engine.cancel_execution(pipeline_id)
    return {"message": f"Pipeline {pipeline_id} execution cancelled"}


@router.get("/templates")
async def get_pipeline_templates(
    current_user: User = Depends(require_any_authenticated())
) -> list[Dict[str, Any]]:
    """
    Get available pipeline templates
    """
    # In production, these would come from the database
    templates = [
        {
            "id": 1,
            "name": "Database to Warehouse ETL",
            "description": "Extract data from database, transform, and load to warehouse",
            "category": "ETL",
            "tags": ["database", "warehouse", "etl"]
        },
        {
            "id": 2,
            "name": "API to Database Sync",
            "description": "Fetch data from API and sync to database",
            "category": "Integration",
            "tags": ["api", "database", "sync"]
        },
        {
            "id": 3,
            "name": "File Processing Pipeline",
            "description": "Process CSV/JSON files and load to database",
            "category": "File Processing",
            "tags": ["file", "csv", "json"]
        }
    ]

    return templates


@router.post("/test-node")
async def test_single_node(
    node_config: Dict[str, Any],
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Test a single node configuration with sample data
    """
    # Mock testing for now
    return {
        "status": "success",
        "test_results": {
            "sample_input_records": 10,
            "sample_output_records": 10,
            "execution_time_ms": 150,
            "validation_passed": True
        },
        "sample_output": [
            {"id": 1, "data": "sample"},
            {"id": 2, "data": "sample"}
        ]
    }
