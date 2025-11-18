"""
Logging API Endpoints

API endpoints for log management, search, and analytics.
Part of Sub-Phase 5B: Advanced Monitoring
Updated: Phase 11A - SEC-002 (Fixed error message leakage)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from backend.core.database import get_db
from backend.core.error_handler import safe_error_response, database_error
from backend.services.logging_service import EnhancedLoggingService
from backend.models.monitoring import LogLevel


router = APIRouter(prefix="/logs", tags=["logs"])
logging_service = EnhancedLoggingService()


# Pydantic models
class LogCreateRequest(BaseModel):
    level: LogLevel
    message: str
    correlation_id: Optional[str] = None
    request_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    component: Optional[str] = None
    function_name: Optional[str] = None
    extra_data: Optional[dict] = None


class LogSearchRequest(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    level: Optional[LogLevel] = None
    levels: Optional[List[LogLevel]] = None
    correlation_id: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    component: Optional[str] = None
    message_search: Optional[str] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)
    order_by: str = Field(default="desc", pattern="^(asc|desc)$")


class ArchiveLogsRequest(BaseModel):
    before_date: Optional[datetime] = None


# API Endpoints

@router.post("/", status_code=201)
async def create_log(
    log_data: LogCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new log entry"""
    try:
        log_entry = await logging_service.log(
            db=db,
            level=log_data.level,
            message=log_data.message,
            correlation_id=log_data.correlation_id,
            request_id=log_data.request_id,
            session_id=log_data.session_id,
            user_id=log_data.user_id,
            pipeline_id=log_data.pipeline_id,
            component=log_data.component,
            function_name=log_data.function_name,
            extra_data=log_data.extra_data
        )

        return {
            "id": log_entry.id,
            "timestamp": log_entry.timestamp,
            "level": log_entry.level.value,
            "message": log_entry.message
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to create log entry",
            internal_error=e
        )


@router.post("/search")
async def search_logs(
    search_request: LogSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Search logs with filters"""
    try:
        logs = await logging_service.search_logs(
            db=db,
            start_time=search_request.start_time,
            end_time=search_request.end_time,
            level=search_request.level,
            levels=search_request.levels,
            correlation_id=search_request.correlation_id,
            request_id=search_request.request_id,
            user_id=search_request.user_id,
            pipeline_id=search_request.pipeline_id,
            component=search_request.component,
            message_search=search_request.message_search,
            limit=search_request.limit,
            offset=search_request.offset,
            order_by=search_request.order_by
        )

        return {
            "logs": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp,
                    "level": log.level.value,
                    "message": log.message,
                    "correlation_id": log.correlation_id,
                    "request_id": log.request_id,
                    "user_id": log.user_id,
                    "pipeline_id": log.pipeline_id,
                    "component": log.component,
                    "function_name": log.function_name,
                    "exception_type": log.exception_type,
                    "extra_data": log.extra_data
                }
                for log in logs
            ],
            "count": len(logs),
            "offset": search_request.offset,
            "limit": search_request.limit
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to search logs",
            internal_error=e
        )


@router.get("/correlation/{correlation_id}")
async def get_logs_by_correlation(
    correlation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all logs for a correlation ID (request trace)"""
    try:
        logs = await logging_service.get_logs_by_correlation(db, correlation_id)

        return {
            "correlation_id": correlation_id,
            "logs": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp,
                    "level": log.level.value,
                    "message": log.message,
                    "component": log.component,
                    "function_name": log.function_name,
                    "duration_ms": log.duration_ms,
                    "extra_data": log.extra_data
                }
                for log in logs
            ],
            "count": len(logs)
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to fetch correlation logs",
            internal_error=e
        )


@router.get("/errors/recent")
async def get_recent_errors(
    hours: int = Query(default=1, ge=1, le=168),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Get recent error and critical logs"""
    try:
        logs = await logging_service.get_recent_errors(db, hours, limit)

        return {
            "errors": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp,
                    "level": log.level.value,
                    "message": log.message,
                    "component": log.component,
                    "pipeline_id": log.pipeline_id,
                    "exception_type": log.exception_type,
                    "exception_message": log.exception_message,
                    "stack_trace": log.stack_trace
                }
                for log in logs
            ],
            "count": len(logs),
            "hours": hours
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to fetch recent errors",
            internal_error=e
        )


@router.get("/statistics")
async def get_log_statistics(
    hours: int = Query(default=24, ge=1, le=720),
    group_by: str = Query(default="level", pattern="^(level|component|hour|pipeline)$"),
    db: AsyncSession = Depends(get_db)
):
    """Get log statistics"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        stats = await logging_service.get_log_statistics(
            db, start_time, end_time, group_by
        )

        return {
            "statistics": stats,
            "start_time": start_time,
            "end_time": end_time,
            "group_by": group_by
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to fetch log statistics",
            internal_error=e
        )


@router.get("/trends/errors")
async def get_error_trends(
    hours: int = Query(default=24, ge=1, le=168),
    interval_minutes: int = Query(default=60, ge=5, le=1440),
    db: AsyncSession = Depends(get_db)
):
    """Get error log trends over time"""
    try:
        trends = await logging_service.get_error_trends(db, hours, interval_minutes)

        return {
            "trends": trends,
            "hours": hours,
            "interval_minutes": interval_minutes
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to fetch log trends",
            internal_error=e
        )


@router.post("/archive")
async def archive_logs(
    archive_request: ArchiveLogsRequest,
    db: AsyncSession = Depends(get_db)
):
    """Archive old logs to compressed files"""
    try:
        result = await logging_service.archive_old_logs(
            db, archive_request.before_date
        )

        return {
            "success": True,
            "archived_count": result["archived"],
            "archive_file": result["archive_file"],
            "archive_path": result["archive_path"],
            "file_size_bytes": result.get("file_size_bytes"),
            "message": result.get("message", "Logs archived successfully")
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to archive logs",
            internal_error=e
        )


@router.delete("/archives/cleanup")
async def cleanup_expired_archives(
    db: AsyncSession = Depends(get_db)
):
    """Delete expired archive files"""
    try:
        deleted_count = await logging_service.cleanup_expired_archives(db)

        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Deleted {deleted_count} expired archives"
        }
    except Exception as e:
        raise safe_error_response(
            500,
            "Unable to cleanup log archives",
            internal_error=e
        )
