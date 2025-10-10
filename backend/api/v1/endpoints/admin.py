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
from backend.models.activity_log import UserActivityLog
from pydantic import BaseModel


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
