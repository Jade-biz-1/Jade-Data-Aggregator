"""
Admin-only endpoints
For user management, activity logs, and system administration
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_admin
from backend.services.activity_log_service import ActivityLogService
from backend.services.cleanup_service import CleanupService
from backend.services.cleanup_statistics_service import CleanupStatisticsService
from backend.models.activity_log import UserActivityLog
from backend.middleware.dev_role_protection import (
    set_dev_role_production_flag,
    get_dev_role_production_setting,
    is_production_environment
)
from pydantic import BaseModel
from sqlalchemy import text, select, func


router = APIRouter()


# Pydantic models for activity logs
class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


@router.get("/activity-logs", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date")
):
    """
    Get all activity logs with optional filtering (admin only)

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        action: Filter by specific action type
        start_date: Filter logs after this date
        end_date: Filter logs before this date
    """
    logs = await ActivityLogService.get_all_activity(
        db=db,
        skip=skip,
        limit=limit,
        action_filter=action,
        start_date=start_date,
        end_date=end_date
    )
    return logs


@router.get("/activity-logs/{user_id}", response_model=List[ActivityLogResponse])
async def get_user_activity_logs(
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date")
):
    """
    Get activity logs for a specific user (admin only)

    Args:
        user_id: ID of the user to get logs for
        skip: Number of records to skip
        limit: Maximum number of records to return
        action: Filter by specific action type
        start_date: Filter logs after this date
        end_date: Filter logs before this date
    """
    logs = await ActivityLogService.get_user_activity(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        action_filter=action,
        start_date=start_date,
        end_date=end_date
    )
    return logs


@router.post("/activity-logs/cleanup")
async def cleanup_old_activity_logs(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    days_to_keep: int = Query(90, ge=1, le=365, description="Number of days of logs to keep")
):
    """
    Delete activity logs older than specified days (admin only)

    Args:
        days_to_keep: Number of days of logs to retain (default: 90)
    """
    count = await ActivityLogService.cleanup_old_logs(db=db, days_to_keep=days_to_keep)
    return {
        "message": f"Cleaned up {count} old activity logs",
        "days_kept": days_to_keep
    }


# System Settings Endpoints

class DevRoleProductionRequest(BaseModel):
    """Request model for enabling developer role in production."""
    allow: bool
    hours: int = 24


class CleanupRequest(BaseModel):
    """Request model for cleanup operations."""
    days_to_keep: Optional[int] = None
    hours_to_keep: Optional[int] = None


class CleanupScheduleConfig(BaseModel):
    """Request model for cleanup schedule configuration."""
    enabled: bool
    cron_expression: Optional[str] = "0 2 * * *"  # Daily at 2 AM
    activity_log_retention_days: int = 90
    execution_log_retention_days: int = 30
    temp_file_retention_hours: int = 24


@router.get("/settings/dev-role-production")
async def get_dev_role_production_status(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current status of ALLOW_DEV_ROLE_IN_PRODUCTION setting (admin only).

    Returns:
        Current setting status with expiration info
    """
    setting = await get_dev_role_production_setting(db)
    is_prod = is_production_environment()

    if not setting:
        return {
            "allowed": not is_prod,  # Allowed in non-production by default
            "is_production": is_prod,
            "setting_exists": False,
            "message": "No explicit setting found. Developer role allowed in non-production environments only."
        }

    return {
        "allowed": setting.is_active and setting.value == "true",
        "is_production": is_prod,
        "setting_exists": True,
        "expires_at": setting.expires_at.isoformat() if setting.expires_at else None,
        "created_at": setting.created_at.isoformat(),
        "updated_at": setting.updated_at.isoformat() if setting.updated_at else None
    }


@router.put("/settings/dev-role-production")
async def update_dev_role_production_flag(
    request: DevRoleProductionRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable or disable developer role in production environment (admin only).

    This is a safeguard to temporarily allow developer role in production.
    The setting auto-expires after specified hours (default 24).

    Args:
        allow: Whether to allow developer role
        hours: Hours until auto-expiration (default 24)

    Returns:
        Updated setting information
    """
    setting = await set_dev_role_production_flag(
        db=db,
        allow=request.allow,
        hours=request.hours
    )

    return {
        "message": f"Developer role {'enabled' if request.allow else 'disabled'} in production",
        "allowed": request.allow,
        "expires_at": setting.expires_at.isoformat() if setting.expires_at else None,
        "hours_until_expiration": request.hours if request.allow else None,
        "warning": "This setting will automatically expire for security. Developer role will be blocked after expiration." if request.allow else None
    }


# System Cleanup Endpoints

@router.get("/cleanup/stats")
async def get_cleanup_stats(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get system cleanup statistics using ORM-based service (admin only).

    Returns database size, record counts, temp files info, and old records counts.
    """
    try:
        # Use CleanupStatisticsService for all statistics
        stats = await CleanupStatisticsService.get_comprehensive_stats(db)

        # Get database size (PostgreSQL-specific, cannot be done with ORM)
        db_size_result = await db.execute(
            text("SELECT pg_database_size(current_database()) as size")
        )
        db_size_bytes = db_size_result.scalar() or 0
        db_size_mb = db_size_bytes / (1024 * 1024)

        # Get table count (PostgreSQL-specific metadata)
        table_count_result = await db.execute(
            text("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
        )
        table_count = table_count_result.scalar() or 0

        # Get expired tokens count using ORM
        from backend.models.auth_token import AuthToken
        from datetime import timedelta

        cutoff_date = datetime.utcnow()
        expired_tokens_stmt = select(func.count(AuthToken.id)).where(
            AuthToken.expires_at < cutoff_date
        )
        expired_tokens_result = await db.execute(expired_tokens_stmt)
        expired_tokens = expired_tokens_result.scalar() or 0

        # Build response from service data
        return {
            "database": {
                "size_mb": round(db_size_mb, 2),
                "table_count": table_count,
                "total_records": sum(stats["record_counts"].values())
            },
            "record_counts": stats["record_counts"],
            "temp_files": stats["temp_files"],
            "old_records": {
                "activity_logs": stats["old_records"].get("activity_logs", 0),
                "execution_logs": stats["old_records"].get("pipeline_runs", 0),
                "expired_tokens": expired_tokens
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch cleanup statistics: {str(e)}"
        )


@router.post("/cleanup/temp-files")
async def cleanup_temp_files(
    current_user: User = Depends(require_admin()),
    max_age_hours: int = Query(24, ge=1, le=168, description="Maximum age of temp files in hours")
):
    """
    Clean temporary files older than specified hours (admin only).

    Args:
        max_age_hours: Maximum age of files to keep (default: 24 hours)
    """
    result = await CleanupService.clean_temp_files(max_age_hours=max_age_hours)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/cleanup/orphaned-data")
async def cleanup_orphaned_data(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean orphaned records with no parent associations (admin only).
    """
    result = await CleanupService.clean_orphaned_pipeline_runs(db=db)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/cleanup/execution-logs")
async def cleanup_execution_logs(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    days_to_keep: int = Query(30, ge=1, le=365, description="Number of days of logs to keep")
):
    """
    Clean old execution logs (admin only).

    Args:
        days_to_keep: Number of days of logs to retain (default: 30)
    """
    result = await CleanupService.clean_old_execution_logs(db=db, days_to_keep=days_to_keep)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/cleanup/database-vacuum")
async def cleanup_database_vacuum(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Run VACUUM on PostgreSQL database to reclaim storage (admin only).

    Warning: This operation may take several minutes on large databases.
    """
    result = await CleanupService.vacuum_database(db=db)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Vacuum failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/cleanup/expired-sessions")
async def cleanup_expired_sessions(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean expired authentication sessions/tokens (admin only).
    """
    result = await CleanupService.clean_expired_sessions(db=db)

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/cleanup/all")
async def cleanup_all_operations(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    activity_log_days: int = Query(90, ge=1, le=365, description="Days to keep activity logs"),
    execution_log_days: int = Query(30, ge=1, le=365, description="Days to keep execution logs"),
    temp_file_hours: int = Query(24, ge=1, le=168, description="Hours to keep temp files")
):
    """
    Run all cleanup operations (admin only).

    Warning: This operation may take several minutes to complete.

    Args:
        activity_log_days: Days to keep activity logs (default: 90)
        execution_log_days: Days to keep execution logs (default: 30)
        temp_file_hours: Hours to keep temp files (default: 24)
    """
    start_time = datetime.utcnow()

    result = await CleanupService.clean_all(
        db=db,
        activity_log_days=activity_log_days,
        execution_log_days=execution_log_days,
        temp_file_hours=temp_file_hours
    )

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    result["summary"]["duration_seconds"] = round(duration, 2)

    return result


@router.get("/cleanup/schedule")
async def get_cleanup_schedule(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current cleanup schedule configuration using ORM (admin only).
    """
    from backend.models.system_settings import SystemSetting
    from sqlalchemy.exc import SQLAlchemyError

    try:
        # Query system settings for cleanup schedule using ORM
        stmt = select(SystemSetting).where(
            SystemSetting.key.like('cleanup_%')
        )
        result = await db.execute(stmt)
        settings = result.scalars().all()

        # Build configuration from settings
        config = {
            "enabled": False,
            "cron_expression": "0 2 * * *",  # Default: Daily at 2 AM
            "activity_log_retention_days": 90,
            "execution_log_retention_days": 30,
            "temp_file_retention_hours": 24,
            "last_updated": None
        }

        for setting in settings:
            if setting.key == "cleanup_enabled":
                config["enabled"] = setting.value == "true" and setting.is_active
            elif setting.key == "cleanup_schedule":
                config["cron_expression"] = setting.value
            elif setting.key == "cleanup_activity_log_days":
                config["activity_log_retention_days"] = int(setting.value)
            elif setting.key == "cleanup_execution_log_days":
                config["execution_log_retention_days"] = int(setting.value)
            elif setting.key == "cleanup_temp_file_hours":
                config["temp_file_retention_hours"] = int(setting.value)

            if setting.updated_at and (not config["last_updated"] or setting.updated_at.isoformat() > config["last_updated"]):
                config["last_updated"] = setting.updated_at.isoformat()

        return config

    except SQLAlchemyError as e:
        # If table doesn't exist or query fails, return defaults
        return {
            "enabled": False,
            "cron_expression": "0 2 * * *",
            "activity_log_retention_days": 90,
            "execution_log_retention_days": 30,
            "temp_file_retention_hours": 24,
            "last_updated": None,
            "message": "No schedule configuration found. Using defaults."
        }
    except Exception as e:
        # Catch any other unexpected errors
        return {
            "enabled": False,
            "cron_expression": "0 2 * * *",
            "activity_log_retention_days": 90,
            "execution_log_retention_days": 30,
            "temp_file_retention_hours": 24,
            "last_updated": None,
            "message": f"Error fetching schedule: {str(e)}"
        }


@router.put("/cleanup/schedule")
async def update_cleanup_schedule(
    config: CleanupScheduleConfig,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update cleanup schedule configuration using ORM (admin only).

    Args:
        enabled: Whether automatic cleanup is enabled
        cron_expression: Cron expression for schedule (default: "0 2 * * *")
        activity_log_retention_days: Days to keep activity logs
        execution_log_retention_days: Days to keep execution logs
        temp_file_retention_hours: Hours to keep temp files
    """
    from backend.models.system_settings import SystemSetting
    from sqlalchemy.exc import SQLAlchemyError
    from sqlalchemy import update as sql_update

    try:
        # Validate cron expression (basic validation)
        if config.cron_expression:
            parts = config.cron_expression.split()
            if len(parts) != 5:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid cron expression. Must have 5 parts: minute hour day month weekday"
                )

        # Update or create settings using ORM
        settings_to_update = [
            ("cleanup_enabled", "true" if config.enabled else "false"),
            ("cleanup_schedule", config.cron_expression or "0 2 * * *"),
            ("cleanup_activity_log_days", str(config.activity_log_retention_days)),
            ("cleanup_execution_log_days", str(config.execution_log_retention_days)),
            ("cleanup_temp_file_hours", str(config.temp_file_retention_hours))
        ]

        for key, value in settings_to_update:
            # Try to find existing setting
            stmt = select(SystemSetting).where(SystemSetting.key == key)
            result = await db.execute(stmt)
            existing_setting = result.scalar_one_or_none()

            if existing_setting:
                # Update existing setting
                existing_setting.value = value
                existing_setting.is_active = True
                existing_setting.updated_at = datetime.utcnow()
            else:
                # Create new setting
                new_setting = SystemSetting(
                    key=key,
                    value=value,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(new_setting)

        await db.commit()

        return {
            "message": "Cleanup schedule updated successfully",
            "enabled": config.enabled,
            "cron_expression": config.cron_expression,
            "activity_log_retention_days": config.activity_log_retention_days,
            "execution_log_retention_days": config.execution_log_retention_days,
            "temp_file_retention_hours": config.temp_file_retention_hours,
            "updated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error updating cleanup schedule: {str(e)}"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update cleanup schedule: {str(e)}"
        )
