import csv
import io
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.schemas.user import User
from backend.schemas.pipeline_run import (
    PipelineRun,
    PipelineRunResponse,
    PipelineRunExecuteRequest,
    PipelineRunExecuteResponse,
)
from backend.models.pipeline_run import PipelineRun as PipelineRunORM
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_executor
from backend.services.pipeline_executor import PipelineExecutor, PipelineExecutionError
from backend.crud.pipeline_run import pipeline_run as crud_pipeline_run
from backend.utils.error_handling import safe_error_response


router = APIRouter()


def _to_run_response(run: PipelineRunORM, pipeline_name: Optional[str] = None) -> PipelineRunResponse:
    """Build an extended run response with computed fields."""
    duration = None
    if run.started_at and run.completed_at:
        duration = (run.completed_at - run.started_at).total_seconds()

    triggered_by = run.triggered_by or "manual"
    if triggered_by.startswith("retry:"):
        triggered_by = triggered_by[6:] or "manual"

    if triggered_by in ("scheduled", "scheduler"):
        trigger_type = "scheduled"
    elif triggered_by in ("webhook", "api"):
        trigger_type = "api"
    else:
        trigger_type = "manual"

    return PipelineRunResponse(
        id=run.id,
        pipeline_id=run.pipeline_id,
        status=run.status,
        records_processed=run.records_processed or 0,
        records_failed=run.records_failed or 0,
        execution_config=run.execution_config,
        error_message=run.error_message,
        triggered_by=triggered_by,
        started_at=run.started_at,
        completed_at=run.completed_at,
        logs=run.logs,
        created_at=run.created_at,
        updated_at=run.updated_at,
        duration_seconds=duration,
        pipeline_name=pipeline_name,
        trigger_type=trigger_type,
        steps=[],
    )


def _parse_logs(run: PipelineRunORM) -> List[dict]:
    """Parse the run's log text into structured log entries."""
    entries = []
    if run.error_message:
        entries.append({
            "id": "err-0",
            "timestamp": (run.completed_at or run.updated_at or run.started_at).isoformat(),
            "level": "ERROR",
            "message": run.error_message,
            "step_name": None,
            "metadata": {},
        })

    if run.logs:
        for i, line in enumerate(run.logs.splitlines()):
            line = line.strip()
            if not line:
                continue
            entries.append({
                "id": str(i),
                "timestamp": run.started_at.isoformat() if run.started_at else datetime.utcnow().isoformat(),
                "level": "INFO",
                "message": line,
                "step_name": None,
                "metadata": {},
            })

    return entries


@router.post("/{pipeline_id}/execute", response_model=PipelineRunExecuteResponse)
async def execute_pipeline(
    pipeline_id: int,
    request: PipelineRunExecuteRequest,
    current_user: User = Depends(require_executor()),
    db: AsyncSession = Depends(get_db)
):
    """Execute a pipeline."""
    try:
        executor = PipelineExecutor(db)
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
        raise safe_error_response(500, "Unable to execute pipeline", internal_error=e)


# ── Statistics (literal path must come before /{run_id}) ─────────────────────

@router.get("/{pipeline_id}/runs/statistics")
async def get_pipeline_run_statistics(
    pipeline_id: int,
    days: Optional[int] = Query(None),
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate statistics for all runs of a pipeline."""
    query = select(PipelineRunORM).filter(PipelineRunORM.pipeline_id == pipeline_id)
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(PipelineRunORM.started_at >= cutoff)
    result = await db.execute(query)
    runs = result.scalars().all()

    total = len(runs)
    successful = sum(1 for r in runs if r.status == "completed")
    failed = sum(1 for r in runs if r.status == "failed")
    total_records = sum(r.records_processed or 0 for r in runs)

    timed_runs = [r for r in runs if r.started_at and r.completed_at]
    avg_duration = (
        sum((r.completed_at - r.started_at).total_seconds() for r in timed_runs) / len(timed_runs)
        if timed_runs else 0.0
    )
    success_rate = (successful / total * 100) if total > 0 else 0.0

    return {
        "total_runs": total,
        "successful_runs": successful,
        "failed_runs": failed,
        "average_duration_seconds": round(avg_duration, 2),
        "total_records_processed": total_records,
        "success_rate": round(success_rate, 2),
    }


# ── Export runs CSV (literal path must come before /{run_id}) ─────────────────

@router.get("/{pipeline_id}/runs/export")
async def export_pipeline_runs(
    pipeline_id: int,
    days: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Export pipeline runs as CSV."""
    query = (
        select(PipelineRunORM)
        .filter(PipelineRunORM.pipeline_id == pipeline_id)
        .order_by(desc(PipelineRunORM.started_at))
    )
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(PipelineRunORM.started_at >= cutoff)
    if status and status != "all":
        query = query.filter(PipelineRunORM.status == status)

    result = await db.execute(query)
    runs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "pipeline_id", "status", "started_at", "completed_at",
        "duration_seconds", "records_processed", "records_failed",
        "triggered_by", "error_message",
    ])
    for run in runs:
        duration = None
        if run.started_at and run.completed_at:
            duration = round((run.completed_at - run.started_at).total_seconds(), 2)
        writer.writerow([
            run.id, run.pipeline_id, run.status,
            run.started_at.isoformat() if run.started_at else "",
            run.completed_at.isoformat() if run.completed_at else "",
            duration, run.records_processed or 0, run.records_failed or 0,
            run.triggered_by or "", run.error_message or "",
        ])

    output.seek(0)
    filename = f"pipeline-{pipeline_id}-runs.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── List runs ──────────────────────────────────────────────────────────────────

@router.get("/{pipeline_id}/runs", response_model=List[PipelineRunResponse])
async def get_pipeline_runs(
    pipeline_id: int,
    skip: int = 0,
    limit: int = 100,
    days: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """List all runs for a specific pipeline."""
    query = (
        select(PipelineRunORM)
        .filter(PipelineRunORM.pipeline_id == pipeline_id)
        .order_by(desc(PipelineRunORM.started_at))
    )
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(PipelineRunORM.started_at >= cutoff)
    if status and status != "all":
        query = query.filter(PipelineRunORM.status == status)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    runs = result.scalars().all()
    return [_to_run_response(r) for r in runs]


# ── Run detail ─────────────────────────────────────────────────────────────────

@router.get("/{pipeline_id}/runs/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline_run(
    pipeline_id: int,
    run_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific pipeline run."""
    result = await db.execute(
        select(PipelineRunORM).filter(
            PipelineRunORM.id == run_id,
            PipelineRunORM.pipeline_id == pipeline_id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    # Fetch pipeline name for the detail view
    from backend.crud.pipeline import pipeline as crud_pipeline
    pipeline = await crud_pipeline.get(db, id=pipeline_id)
    pipeline_name = pipeline.name if pipeline else None

    return _to_run_response(run, pipeline_name=pipeline_name)


# ── Run logs ───────────────────────────────────────────────────────────────────

@router.get("/{pipeline_id}/runs/{run_id}/logs")
async def get_pipeline_run_logs(
    pipeline_id: int,
    run_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Return structured log entries for a pipeline run."""
    result = await db.execute(
        select(PipelineRunORM).filter(
            PipelineRunORM.id == run_id,
            PipelineRunORM.pipeline_id == pipeline_id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    return {"logs": _parse_logs(run)}


# ── Export logs ────────────────────────────────────────────────────────────────

@router.get("/{pipeline_id}/runs/{run_id}/logs/export")
async def export_pipeline_run_logs(
    pipeline_id: int,
    run_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Export run logs as plain text."""
    result = await db.execute(
        select(PipelineRunORM).filter(
            PipelineRunORM.id == run_id,
            PipelineRunORM.pipeline_id == pipeline_id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    lines = []
    if run.error_message:
        ts = (run.completed_at or run.updated_at or run.started_at)
        ts_str = ts.isoformat() if ts else ""
        lines.append(f"[{ts_str}] ERROR  {run.error_message}")
    if run.logs:
        for line in run.logs.splitlines():
            ts_str = run.started_at.isoformat() if run.started_at else ""
            lines.append(f"[{ts_str}] INFO   {line.strip()}")

    content = "\n".join(lines) if lines else "No logs available."
    filename = f"run-{run_id}-logs.txt"
    return StreamingResponse(
        iter([content]),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ── Retry ──────────────────────────────────────────────────────────────────────

@router.post("/{pipeline_id}/runs/{run_id}/retry", response_model=PipelineRunExecuteResponse)
async def retry_pipeline_run(
    pipeline_id: int,
    run_id: int,
    current_user: User = Depends(require_executor()),
    db: AsyncSession = Depends(get_db)
):
    """Retry a failed or cancelled pipeline run."""
    try:
        executor = PipelineExecutor(db)
        new_run = await executor.retry_run(run_id)
        return PipelineRunExecuteResponse(
            run_id=new_run.id,
            pipeline_id=pipeline_id,
            status=new_run.status,
            message="Pipeline retry initiated",
        )
    except PipelineExecutionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise safe_error_response(500, "Unable to retry pipeline run", internal_error=e)


# ── Cancel ─────────────────────────────────────────────────────────────────────

@router.post("/{pipeline_id}/runs/{run_id}/cancel", response_model=PipelineRunResponse)
async def cancel_pipeline_run(
    pipeline_id: int,
    run_id: int,
    current_user: User = Depends(require_executor()),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a running pipeline run."""
    try:
        executor = PipelineExecutor(db)
        run = await executor.cancel_run(run_id)
        return _to_run_response(run)
    except PipelineExecutionError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Global recent runs ─────────────────────────────────────────────────────────

@router.get("/runs", response_model=List[PipelineRunResponse])
async def get_all_recent_runs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """Get recent pipeline runs across all pipelines."""
    runs = await crud_pipeline_run.get_recent_runs(db, skip=skip, limit=limit)
    return [_to_run_response(r) for r in runs]
