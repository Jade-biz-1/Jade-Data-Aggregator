"""
Enhanced Logging Service

Provides structured logging with correlation IDs, log aggregation, and search capabilities.
Part of Sub-Phase 5B: Advanced Monitoring (B016)
"""

import os
import gzip
import structlog
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc

from backend.models.monitoring import SystemLog, LogLevel, LogArchive


class EnhancedLoggingService:
    """Service for structured logging with correlation IDs and advanced querying"""

    # Configuration
    LOG_DIR = os.getenv("LOG_DIR", "/tmp/data_aggregator/logs")
    ARCHIVE_DIR = os.getenv("LOG_ARCHIVE_DIR", "/tmp/data_aggregator/logs/archives")
    MAX_LOG_AGE_DAYS = int(os.getenv("MAX_LOG_AGE_DAYS", 30))
    ARCHIVE_RETENTION_DAYS = int(os.getenv("ARCHIVE_RETENTION_DAYS", 365))
    LOG_BATCH_SIZE = int(os.getenv("LOG_BATCH_SIZE", 1000))

    def __init__(self):
        """Initialize logging service"""
        os.makedirs(self.LOG_DIR, exist_ok=True)
        os.makedirs(self.ARCHIVE_DIR, exist_ok=True)

        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

    async def log(
        self,
        db: AsyncSession,
        level: LogLevel,
        message: str,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        pipeline_id: Optional[int] = None,
        component: Optional[str] = None,
        function_name: Optional[str] = None,
        http_method: Optional[str] = None,
        http_path: Optional[str] = None,
        http_status: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        exception: Optional[Exception] = None,
        duration_ms: Optional[float] = None,
        memory_usage_mb: Optional[float] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        logger_name: str = "app"
    ) -> SystemLog:
        """
        Create a structured log entry

        Args:
            db: Database session
            level: Log level
            message: Log message
            correlation_id: Correlation ID for tracing
            request_id: Request ID
            session_id: User session ID
            user_id: User ID
            pipeline_id: Pipeline ID
            component: Component name
            function_name: Function name
            http_method: HTTP method
            http_path: HTTP path
            http_status: HTTP status code
            ip_address: Client IP address
            user_agent: User agent string
            exception: Exception object
            duration_ms: Operation duration
            memory_usage_mb: Memory usage
            extra_data: Additional context
            logger_name: Logger name

        Returns:
            SystemLog record
        """
        # Extract exception information
        exception_type = None
        exception_message = None
        stack_trace = None

        if exception:
            exception_type = type(exception).__name__
            exception_message = str(exception)
            import traceback
            stack_trace = traceback.format_exc()

        # Create log entry
        log_entry = SystemLog(
            correlation_id=correlation_id,
            request_id=request_id,
            session_id=session_id,
            level=level,
            message=message,
            logger_name=logger_name,
            user_id=user_id,
            pipeline_id=pipeline_id,
            component=component,
            function_name=function_name,
            http_method=http_method,
            http_path=http_path,
            http_status=http_status,
            ip_address=ip_address,
            user_agent=user_agent,
            exception_type=exception_type,
            exception_message=exception_message,
            stack_trace=stack_trace,
            duration_ms=duration_ms,
            memory_usage_mb=memory_usage_mb,
            extra_data=extra_data or {},
            timestamp=datetime.utcnow()
        )

        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)

        # Also log to structlog for file logging
        logger = structlog.get_logger(logger_name)
        log_method = getattr(logger, level.value)
        log_method(
            message,
            correlation_id=correlation_id,
            request_id=request_id,
            user_id=user_id,
            component=component,
            **( extra_data or {})
        )

        return log_entry

    async def search_logs(
        self,
        db: AsyncSession,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        level: Optional[LogLevel] = None,
        levels: Optional[List[LogLevel]] = None,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        user_id: Optional[int] = None,
        pipeline_id: Optional[int] = None,
        component: Optional[str] = None,
        logger_name: Optional[str] = None,
        message_search: Optional[str] = None,
        exception_type: Optional[str] = None,
        http_status: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "desc"
    ) -> List[SystemLog]:
        """
        Search logs with various filters

        Args:
            db: Database session
            start_time: Start time filter
            end_time: End time filter
            level: Specific log level
            levels: List of log levels
            correlation_id: Correlation ID filter
            request_id: Request ID filter
            user_id: User ID filter
            pipeline_id: Pipeline ID filter
            component: Component filter
            logger_name: Logger name filter
            message_search: Search in message (case-insensitive)
            exception_type: Exception type filter
            http_status: HTTP status filter
            limit: Max results
            offset: Result offset
            order_by: Order direction ("asc" or "desc")

        Returns:
            List of log entries
        """
        query = select(SystemLog)

        conditions = []

        # Time range filter
        if start_time:
            conditions.append(SystemLog.timestamp >= start_time)
        if end_time:
            conditions.append(SystemLog.timestamp <= end_time)

        # Level filter
        if level:
            conditions.append(SystemLog.level == level)
        elif levels:
            conditions.append(SystemLog.level.in_(levels))

        # ID filters
        if correlation_id:
            conditions.append(SystemLog.correlation_id == correlation_id)
        if request_id:
            conditions.append(SystemLog.request_id == request_id)
        if user_id is not None:
            conditions.append(SystemLog.user_id == user_id)
        if pipeline_id is not None:
            conditions.append(SystemLog.pipeline_id == pipeline_id)

        # Component filters
        if component:
            conditions.append(SystemLog.component == component)
        if logger_name:
            conditions.append(SystemLog.logger_name == logger_name)

        # Message search
        if message_search:
            conditions.append(SystemLog.message.ilike(f"%{message_search}%"))

        # Exception filter
        if exception_type:
            conditions.append(SystemLog.exception_type == exception_type)

        # HTTP status filter
        if http_status is not None:
            conditions.append(SystemLog.http_status == http_status)

        if conditions:
            query = query.where(and_(*conditions))

        # Ordering
        if order_by == "asc":
            query = query.order_by(SystemLog.timestamp.asc())
        else:
            query = query.order_by(SystemLog.timestamp.desc())

        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_log_statistics(
        self,
        db: AsyncSession,
        start_time: datetime,
        end_time: datetime,
        group_by: str = "level"  # "level", "component", "hour", "pipeline"
    ) -> List[Dict[str, Any]]:
        """
        Get log statistics aggregated by specified dimension

        Args:
            db: Database session
            start_time: Start time
            end_time: End time
            group_by: Grouping dimension

        Returns:
            List of statistics dicts
        """
        query = select(
            SystemLog.level if group_by == "level" else
            SystemLog.component if group_by == "component" else
            SystemLog.pipeline_id if group_by == "pipeline" else
            func.date_trunc('hour', SystemLog.timestamp),
            func.count(SystemLog.id).label('count')
        ).where(
            and_(
                SystemLog.timestamp >= start_time,
                SystemLog.timestamp <= end_time
            )
        ).group_by(
            SystemLog.level if group_by == "level" else
            SystemLog.component if group_by == "component" else
            SystemLog.pipeline_id if group_by == "pipeline" else
            func.date_trunc('hour', SystemLog.timestamp)
        )

        result = await db.execute(query)
        rows = result.all()

        stats = []
        for row in rows:
            stats.append({
                "group": str(row[0]),
                "count": row[1]
            })

        return stats

    async def get_error_trends(
        self,
        db: AsyncSession,
        hours: int = 24,
        interval_minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Get error log trends over time

        Args:
            db: Database session
            hours: Number of hours to analyze
            interval_minutes: Interval for grouping

        Returns:
            List of trend data points
        """
        start_time = datetime.utcnow() - timedelta(hours=hours)

        query = select(
            func.date_trunc('hour', SystemLog.timestamp).label('time_bucket'),
            SystemLog.level,
            func.count(SystemLog.id).label('count')
        ).where(
            and_(
                SystemLog.timestamp >= start_time,
                SystemLog.level.in_([LogLevel.ERROR, LogLevel.CRITICAL, LogLevel.WARNING])
            )
        ).group_by(
            func.date_trunc('hour', SystemLog.timestamp),
            SystemLog.level
        ).order_by(
            func.date_trunc('hour', SystemLog.timestamp).asc()
        )

        result = await db.execute(query)
        rows = result.all()

        trends = []
        for row in rows:
            trends.append({
                "timestamp": row[0].isoformat() if row[0] else None,
                "level": row[1].value if row[1] else None,
                "count": row[2]
            })

        return trends

    async def archive_old_logs(
        self,
        db: AsyncSession,
        before_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Archive logs older than specified date

        Args:
            db: Database session
            before_date: Archive logs before this date (default: MAX_LOG_AGE_DAYS ago)

        Returns:
            Archive result dict
        """
        if not before_date:
            before_date = datetime.utcnow() - timedelta(days=self.MAX_LOG_AGE_DAYS)

        # Get logs to archive
        result = await db.execute(
            select(SystemLog).where(
                SystemLog.timestamp < before_date
            ).order_by(SystemLog.timestamp.asc())
        )
        logs_to_archive = list(result.scalars().all())

        if not logs_to_archive:
            return {
                "archived": 0,
                "archive_file": None,
                "message": "No logs to archive"
            }

        # Create archive file
        archive_name = f"logs_{before_date.strftime('%Y%m%d')}.jsonl.gz"
        archive_path = os.path.join(self.ARCHIVE_DIR, archive_name)

        # Write logs to compressed file
        import json
        with gzip.open(archive_path, 'wt', encoding='utf-8') as f:
            for log in logs_to_archive:
                log_dict = {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "level": log.level.value if log.level else None,
                    "message": log.message,
                    "correlation_id": log.correlation_id,
                    "request_id": log.request_id,
                    "user_id": log.user_id,
                    "pipeline_id": log.pipeline_id,
                    "component": log.component,
                    "logger_name": log.logger_name,
                    "exception_type": log.exception_type,
                    "exception_message": log.exception_message,
                    "extra_data": log.extra_data
                }
                f.write(json.dumps(log_dict) + '\n')

        # Get file size
        file_size = os.path.getsize(archive_path)

        # Create archive record
        archive_record = LogArchive(
            archive_name=archive_name,
            archive_path=archive_path,
            log_count=len(logs_to_archive),
            start_date=logs_to_archive[0].timestamp,
            end_date=logs_to_archive[-1].timestamp,
            file_size_bytes=file_size,
            is_compressed=True,
            compression_type="gzip",
            storage_type="local",
            retention_days=self.ARCHIVE_RETENTION_DAYS,
            expires_at=datetime.utcnow() + timedelta(days=self.ARCHIVE_RETENTION_DAYS)
        )

        db.add(archive_record)

        # Delete archived logs from database
        for log in logs_to_archive:
            await db.delete(log)

        await db.commit()

        return {
            "archived": len(logs_to_archive),
            "archive_file": archive_name,
            "archive_path": archive_path,
            "file_size_bytes": file_size,
            "start_date": logs_to_archive[0].timestamp.isoformat(),
            "end_date": logs_to_archive[-1].timestamp.isoformat()
        }

    async def cleanup_expired_archives(
        self,
        db: AsyncSession
    ) -> int:
        """
        Delete expired archive files

        Args:
            db: Database session

        Returns:
            Number of archives deleted
        """
        now = datetime.utcnow()

        # Find expired archives
        result = await db.execute(
            select(LogArchive).where(
                and_(
                    LogArchive.expires_at < now,
                    LogArchive.is_deleted == False
                )
            )
        )
        expired_archives = list(result.scalars().all())

        count = 0
        for archive in expired_archives:
            # Delete physical file
            if os.path.exists(archive.archive_path):
                try:
                    os.remove(archive.archive_path)
                    count += 1
                except Exception as e:
                    print(f"Error deleting archive file {archive.archive_path}: {e}")

            # Mark as deleted
            archive.is_deleted = True

        await db.commit()
        return count

    async def get_logs_by_correlation(
        self,
        db: AsyncSession,
        correlation_id: str,
        limit: int = 1000
    ) -> List[SystemLog]:
        """
        Get all logs for a specific correlation ID (full request trace)

        Args:
            db: Database session
            correlation_id: Correlation ID
            limit: Max results

        Returns:
            List of log entries ordered by timestamp
        """
        result = await db.execute(
            select(SystemLog).where(
                SystemLog.correlation_id == correlation_id
            ).order_by(SystemLog.timestamp.asc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent_errors(
        self,
        db: AsyncSession,
        hours: int = 1,
        limit: int = 50
    ) -> List[SystemLog]:
        """
        Get recent error and critical logs

        Args:
            db: Database session
            hours: Number of hours to look back
            limit: Max results

        Returns:
            List of error logs
        """
        start_time = datetime.utcnow() - timedelta(hours=hours)

        result = await db.execute(
            select(SystemLog).where(
                and_(
                    SystemLog.timestamp >= start_time,
                    SystemLog.level.in_([LogLevel.ERROR, LogLevel.CRITICAL])
                )
            ).order_by(SystemLog.timestamp.desc()).limit(limit)
        )
        return list(result.scalars().all())
