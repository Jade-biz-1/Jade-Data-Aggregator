"""
Cleanup statistics service for tracking and reporting cleanup operations.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func
from pathlib import Path

logger = logging.getLogger(__name__)


class CleanupStatisticsService:
    """Service for calculating and reporting cleanup statistics."""

    @staticmethod
    async def get_database_size(db: AsyncSession) -> Dict[str, any]:
        """
        Get current database size information.

        Args:
            db: Database session

        Returns:
            Dict with database size statistics
        """
        try:
            # Get database size (PostgreSQL specific)
            query = text("SELECT pg_database_size(current_database())")
            result = await db.execute(query)
            size_bytes = result.scalar()

            size_mb = round(size_bytes / (1024 * 1024), 2)
            size_gb = round(size_bytes / (1024 * 1024 * 1024), 2)

            return {
                "success": True,
                "size_bytes": size_bytes,
                "size_mb": size_mb,
                "size_gb": size_gb
            }

        except Exception as e:
            logger.error(f"Error getting database size: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def get_table_sizes(db: AsyncSession) -> List[Dict[str, any]]:
        """
        Get size information for all tables.

        Args:
            db: Database session

        Returns:
            List of table size information
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 20
            """)

            result = await db.execute(query)
            rows = result.fetchall()

            tables = []
            for row in rows:
                tables.append({
                    "schema": row[0],
                    "table": row[1],
                    "size_pretty": row[2],
                    "size_bytes": row[3],
                    "size_mb": round(row[3] / (1024 * 1024), 2)
                })

            return tables

        except Exception as e:
            logger.error(f"Error getting table sizes: {e}")
            return []

    @staticmethod
    async def get_record_counts(db: AsyncSession) -> Dict[str, int]:
        """
        Get record counts for major tables using ORM.

        Args:
            db: Database session

        Returns:
            Dict with record counts
        """
        from backend.models.user import User
        from backend.models.pipeline import Pipeline
        from backend.models.pipeline_run import PipelineRun
        from backend.models.connector import Connector
        from backend.models.transformation import Transformation
        from backend.models.activity_log import UserActivityLog
        from backend.models.file_upload import FileUpload
        from sqlalchemy.exc import SQLAlchemyError

        counts = {}

        # Define table mappings to models
        model_mappings = {
            "users": User,
            "pipelines": Pipeline,
            "pipeline_runs": PipelineRun,
            "connectors": Connector,
            "transformations": Transformation,
            "user_activity_logs": UserActivityLog,
            "file_uploads": FileUpload
        }

        try:
            for table_name, model in model_mappings.items():
                try:
                    result = await db.execute(select(func.count()).select_from(model))
                    counts[table_name] = result.scalar() or 0
                except SQLAlchemyError as e:
                    logger.warning(f"Error counting {table_name}: {e}")
                    counts[table_name] = 0

            return counts

        except Exception as e:
            logger.error(f"Error getting record counts: {e}")
            return counts

    @staticmethod
    def get_temp_files_stats() -> Dict[str, any]:
        """
        Get statistics about temporary files.

        Returns:
            Dict with temp files statistics
        """
        try:
            temp_dir = Path("temp")
            if not temp_dir.exists():
                return {
                    "exists": False,
                    "file_count": 0,
                    "total_size_mb": 0
                }

            file_count = 0
            total_size = 0

            for file_path in temp_dir.rglob("*"):
                if file_path.is_file():
                    file_count += 1
                    total_size += file_path.stat().st_size

            return {
                "exists": True,
                "file_count": file_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }

        except Exception as e:
            logger.error(f"Error getting temp files stats: {e}")
            return {
                "exists": False,
                "file_count": 0,
                "total_size_mb": 0,
                "error": str(e)
            }

    @staticmethod
    async def get_old_records_count(
        db: AsyncSession,
        days_threshold: int = 90
    ) -> Dict[str, int]:
        """
        Count records older than threshold that could be cleaned using ORM.

        Args:
            db: Database session
            days_threshold: Age threshold in days

        Returns:
            Dict with counts of old records per table
        """
        from backend.models.activity_log import UserActivityLog
        from backend.models.pipeline_run import PipelineRun
        from sqlalchemy.exc import SQLAlchemyError

        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        counts = {}

        try:
            # Activity logs
            activity_stmt = select(func.count(UserActivityLog.id)).where(
                UserActivityLog.timestamp < cutoff_date
            )
            result = await db.execute(activity_stmt)
            counts["activity_logs"] = result.scalar() or 0

            # Pipeline runs (completed/failed)
            pipeline_stmt = select(func.count(PipelineRun.id)).where(
                PipelineRun.created_at < cutoff_date,
                PipelineRun.status.in_(['completed', 'failed'])
            )
            result = await db.execute(pipeline_stmt)
            counts["pipeline_runs"] = result.scalar() or 0

            return counts

        except SQLAlchemyError as e:
            logger.error(f"Database error counting old records: {e}")
            return counts
        except Exception as e:
            logger.error(f"Unexpected error counting old records: {e}")
            return counts

    @staticmethod
    async def estimate_cleanup_impact(
        db: AsyncSession,
        activity_log_days: int = 90,
        execution_log_days: int = 30
    ) -> Dict[str, any]:
        """
        Estimate the impact of running cleanup operations.

        Args:
            db: Database session
            activity_log_days: Days to keep activity logs
            execution_log_days: Days to keep execution logs

        Returns:
            Dict with estimated cleanup impact
        """
        estimate = {
            "activity_logs": {},
            "execution_logs": {},
            "temp_files": {},
            "total_estimated_space_freed_mb": 0
        }

        try:
            # Activity logs
            old_logs = await CleanupStatisticsService.get_old_records_count(
                db, activity_log_days
            )
            estimate["activity_logs"] = {
                "records_to_delete": old_logs.get("activity_logs", 0),
                "days_threshold": activity_log_days
            }

            # Execution logs
            old_executions = await CleanupStatisticsService.get_old_records_count(
                db, execution_log_days
            )
            estimate["execution_logs"] = {
                "records_to_delete": old_executions.get("pipeline_runs", 0),
                "days_threshold": execution_log_days
            }

            # Temp files
            temp_stats = CleanupStatisticsService.get_temp_files_stats()
            estimate["temp_files"] = temp_stats

            # Rough estimate of space to be freed
            # Assume ~1KB per log record on average
            estimated_logs_mb = (
                estimate["activity_logs"]["records_to_delete"] +
                estimate["execution_logs"]["records_to_delete"]
            ) / 1024

            estimate["total_estimated_space_freed_mb"] = round(
                estimated_logs_mb + temp_stats.get("total_size_mb", 0),
                2
            )

            return estimate

        except Exception as e:
            logger.error(f"Error estimating cleanup impact: {e}")
            return estimate

    @staticmethod
    async def get_comprehensive_stats(db: AsyncSession) -> Dict[str, any]:
        """
        Get comprehensive system statistics.

        Args:
            db: Database session

        Returns:
            Dict with all statistics
        """
        stats = {
            "timestamp": datetime.utcnow().isoformat(),
            "database": await CleanupStatisticsService.get_database_size(db),
            "tables": await CleanupStatisticsService.get_table_sizes(db),
            "record_counts": await CleanupStatisticsService.get_record_counts(db),
            "temp_files": CleanupStatisticsService.get_temp_files_stats(),
            "old_records": await CleanupStatisticsService.get_old_records_count(db),
            "cleanup_estimate": await CleanupStatisticsService.estimate_cleanup_impact(db)
        }

        return stats
