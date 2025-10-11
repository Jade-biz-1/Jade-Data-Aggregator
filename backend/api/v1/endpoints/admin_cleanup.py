"""
Admin cleanup endpoints for system maintenance.
Provides API for cleaning old data, temporary files, and database optimization.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_developer
from backend.services.cleanup_service import CleanupService
from backend.services.cleanup_statistics_service import CleanupStatisticsService

router = APIRouter()


class CleanupScheduleRequest(BaseModel):
    """Request model for configuring cleanup schedule."""
    enabled: bool
    activity_log_days: int = 90
    execution_log_days: int = 30
    temp_file_hours: int = 24
    schedule_cron: str = "0 2 * * *"  # Daily at 2 AM


@router.post("/activity-logs")
async def cleanup_activity_logs(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    days_to_keep: int = Query(90, ge=1, le=365, description="Days to keep activity logs")
):
    """
    Clean activity logs older than specified days (admin/developer only).

    Args:
        days_to_keep: Number of days of activity logs to retain

    Returns:
        Cleanup results with statistics
    """
    result = await CleanupService.clean_old_activity_logs(db, days_to_keep)
    return result


@router.post("/orphaned-data")
async def cleanup_orphaned_data(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean orphaned data (pipeline runs without pipelines, etc.) (admin/developer only).

    Returns:
        Cleanup results with statistics
    """
    result = await CleanupService.clean_orphaned_pipeline_runs(db)
    return result


@router.post("/temp-files")
async def cleanup_temp_files(
    current_user: User = Depends(require_developer()),
    max_age_hours: int = Query(24, ge=1, le=168, description="Maximum age of temp files in hours")
):
    """
    Clean temporary files older than specified hours (admin/developer only).

    Args:
        max_age_hours: Maximum age of temp files in hours

    Returns:
        Cleanup results with statistics
    """
    result = await CleanupService.clean_temp_files(max_age_hours)
    return result


@router.post("/execution-logs")
async def cleanup_execution_logs(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    days_to_keep: int = Query(30, ge=1, le=365, description="Days to keep execution logs")
):
    """
    Clean execution logs older than specified days (admin/developer only).

    Args:
        days_to_keep: Number of days of execution logs to retain

    Returns:
        Cleanup results with statistics
    """
    result = await CleanupService.clean_old_execution_logs(db, days_to_keep)
    return result


@router.post("/database-vacuum")
async def cleanup_database_vacuum(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Run VACUUM on database to reclaim storage (admin/developer only).

    Returns:
        Vacuum results
    """
    result = await CleanupService.vacuum_database(db)
    return result


@router.post("/sessions")
async def cleanup_expired_sessions(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean expired sessions (admin/developer only).

    Returns:
        Cleanup results with statistics
    """
    result = await CleanupService.clean_expired_sessions(db)
    return result


@router.post("/all")
async def cleanup_all(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    activity_log_days: int = Query(90, ge=1, le=365),
    execution_log_days: int = Query(30, ge=1, le=365),
    temp_file_hours: int = Query(24, ge=1, le=168)
):
    """
    Run all cleanup operations (admin/developer only).

    Args:
        activity_log_days: Days to keep activity logs
        execution_log_days: Days to keep execution logs
        temp_file_hours: Hours to keep temp files

    Returns:
        Comprehensive cleanup results
    """
    result = await CleanupService.clean_all(
        db,
        activity_log_days=activity_log_days,
        execution_log_days=execution_log_days,
        temp_file_hours=temp_file_hours
    )
    return result


@router.get("/stats")
async def get_cleanup_stats(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive system statistics for cleanup planning (admin/developer only).

    Returns:
        System statistics including database size, table sizes, record counts, etc.
    """
    stats = await CleanupStatisticsService.get_comprehensive_stats(db)
    return stats


@router.get("/estimate")
async def estimate_cleanup_impact(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    activity_log_days: int = Query(90, ge=1, le=365),
    execution_log_days: int = Query(30, ge=1, le=365)
):
    """
    Estimate the impact of cleanup operations (admin/developer only).

    Args:
        activity_log_days: Days to keep activity logs
        execution_log_days: Days to keep execution logs

    Returns:
        Estimated cleanup impact
    """
    estimate = await CleanupStatisticsService.estimate_cleanup_impact(
        db,
        activity_log_days=activity_log_days,
        execution_log_days=execution_log_days
    )
    return estimate


@router.get("/history")
async def get_cleanup_history(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get history of cleanup operations (admin/developer only).

    Note: This is a placeholder. Actual implementation would require
    storing cleanup history in a database table.

    Args:
        limit: Maximum number of history records to return

    Returns:
        List of cleanup history records
    """
    # Placeholder - would need to implement cleanup history tracking
    return {
        "message": "Cleanup history tracking not yet implemented",
        "history": []
    }


@router.put("/schedule")
async def configure_cleanup_schedule(
    request: CleanupScheduleRequest,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Configure automatic cleanup schedule (admin/developer only).

    Note: This is a placeholder. Actual implementation would require
    a task scheduler like Celery or APScheduler.

    Args:
        request: Cleanup schedule configuration

    Returns:
        Configuration confirmation
    """
    # Placeholder - would need to implement task scheduling
    return {
        "message": "Cleanup scheduling not yet implemented",
        "config": request.dict(),
        "note": "Manual cleanup operations are available via the cleanup endpoints"
    }
