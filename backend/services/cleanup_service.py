"""
System cleanup service for maintaining database and file system health.
Provides functionality to clean old logs, temporary files, and orphaned data.
"""

import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, delete, func
from sqlalchemy.exc import SQLAlchemyError
from backend.models.activity_log import UserActivityLog
from backend.models.file_upload import FileUpload
from backend.models.pipeline import Pipeline
from backend.models.pipeline_run import PipelineRun
from backend.models.auth_token import AuthToken

logger = logging.getLogger(__name__)


class CleanupService:
    """Service for system cleanup operations."""

    @staticmethod
    async def clean_old_activity_logs(
        db: AsyncSession,
        days_to_keep: int = 90
    ) -> Dict[str, any]:
        """
        Clean activity logs older than specified days.

        Args:
            db: Database session
            days_to_keep: Number of days to keep logs

        Returns:
            Dict with cleanup statistics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            # Count logs to be deleted
            count_result = await db.execute(
                select(func.count(UserActivityLog.id)).where(
                    UserActivityLog.timestamp < cutoff_date
                )
            )
            count_before = count_result.scalar() or 0

            # Delete old logs
            await db.execute(
                delete(UserActivityLog).where(
                    UserActivityLog.timestamp < cutoff_date
                )
            )
            await db.commit()

            logger.info(f"Cleaned {count_before} activity logs older than {days_to_keep} days")

            return {
                "success": True,
                "records_deleted": count_before,
                "cutoff_date": cutoff_date.isoformat(),
                "days_kept": days_to_keep
            }

        except SQLAlchemyError as e:
            logger.error(f"Database error cleaning activity logs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }
        except Exception as e:
            logger.error(f"Unexpected error cleaning activity logs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }

    @staticmethod
    async def clean_orphaned_pipeline_runs(db: AsyncSession) -> Dict[str, any]:
        """
        Clean pipeline runs that reference non-existent pipelines.

        Args:
            db: Database session

        Returns:
            Dict with cleanup statistics
        """
        try:
            # Find orphaned pipeline runs using ORM subquery
            # pipeline_id NOT IN (SELECT id FROM pipelines)
            pipeline_ids_subquery = select(Pipeline.id)

            # Count orphaned records first
            count_stmt = select(func.count(PipelineRun.id)).where(
                PipelineRun.pipeline_id.not_in(pipeline_ids_subquery)
            )
            count_result = await db.execute(count_stmt)
            count = count_result.scalar() or 0

            # Delete orphaned pipeline runs
            if count > 0:
                delete_stmt = delete(PipelineRun).where(
                    PipelineRun.pipeline_id.not_in(pipeline_ids_subquery)
                )
                await db.execute(delete_stmt)
                await db.commit()

            logger.info(f"Cleaned {count} orphaned pipeline runs")

            return {
                "success": True,
                "records_deleted": count,
                "type": "orphaned_pipeline_runs"
            }

        except SQLAlchemyError as e:
            logger.error(f"Database error cleaning orphaned pipeline runs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }
        except Exception as e:
            logger.error(f"Unexpected error cleaning orphaned pipeline runs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }

    @staticmethod
    async def clean_temp_files(max_age_hours: int = 24, temp_dir_path: Optional[Path] = None) -> Dict[str, any]:
        """
        Clean temporary files older than specified hours.

        Args:
            max_age_hours: Maximum age of temp files in hours
            temp_dir_path: Path to temporary directory (default: from settings.temp_files_dir)

        Returns:
            Dict with cleanup statistics
        """
        try:
            # Get temp directory from parameter or config
            if temp_dir_path is None:
                from backend.core.config import settings
                temp_dir = settings.temp_files_dir
            else:
                temp_dir = temp_dir_path if isinstance(temp_dir_path, Path) else Path(temp_dir_path)
            if not temp_dir.exists():
                return {
                    "success": True,
                    "files_deleted": 0,
                    "space_freed_mb": 0,
                    "message": "Temp directory does not exist"
                }

            cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
            files_deleted = 0
            space_freed = 0

            for file_path in temp_dir.rglob("*"):
                if file_path.is_file():
                    if file_path.stat().st_mtime < cutoff_time:
                        size = file_path.stat().st_size
                        file_path.unlink()
                        files_deleted += 1
                        space_freed += size

            space_freed_mb = round(space_freed / (1024 * 1024), 2)

            logger.info(f"Cleaned {files_deleted} temp files, freed {space_freed_mb} MB")

            return {
                "success": True,
                "files_deleted": files_deleted,
                "space_freed_mb": space_freed_mb,
                "max_age_hours": max_age_hours
            }

        except Exception as e:
            logger.error(f"Error cleaning temp files: {e}")
            return {
                "success": False,
                "error": str(e),
                "files_deleted": 0,
                "space_freed_mb": 0
            }

    @staticmethod
    async def clean_old_execution_logs(
        db: AsyncSession,
        days_to_keep: int = 30
    ) -> Dict[str, any]:
        """
        Clean execution logs older than specified days.

        Args:
            db: Database session
            days_to_keep: Number of days to keep logs

        Returns:
            Dict with cleanup statistics
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            # Count old execution logs using ORM
            count_stmt = select(func.count(PipelineRun.id)).where(
                PipelineRun.created_at < cutoff_date,
                PipelineRun.status.in_(['completed', 'failed'])
            )
            count_result = await db.execute(count_stmt)
            count = count_result.scalar() or 0

            # Delete old execution logs
            if count > 0:
                delete_stmt = delete(PipelineRun).where(
                    PipelineRun.created_at < cutoff_date,
                    PipelineRun.status.in_(['completed', 'failed'])
                )
                await db.execute(delete_stmt)
                await db.commit()

            logger.info(f"Cleaned {count} old execution logs")

            return {
                "success": True,
                "records_deleted": count,
                "cutoff_date": cutoff_date.isoformat(),
                "days_kept": days_to_keep
            }

        except SQLAlchemyError as e:
            logger.error(f"Database error cleaning execution logs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }
        except Exception as e:
            logger.error(f"Unexpected error cleaning execution logs: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }

    @staticmethod
    async def vacuum_database(db: AsyncSession) -> Dict[str, any]:
        """
        Run VACUUM on PostgreSQL database to reclaim storage.

        Args:
            db: Database session

        Returns:
            Dict with vacuum statistics
        """
        try:
            # Close the transaction first
            await db.commit()

            # VACUUM cannot run inside a transaction block
            # We need to use autocommit mode
            logger.info("Running database VACUUM...")

            # Get connection and run VACUUM
            connection = await db.connection()
            await connection.exec_driver_sql("VACUUM ANALYZE")

            logger.info("Database VACUUM completed successfully")

            return {
                "success": True,
                "message": "Database vacuum completed"
            }

        except SQLAlchemyError as e:
            logger.error(f"Database error running vacuum: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error running database vacuum: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def clean_expired_sessions(db: AsyncSession) -> Dict[str, any]:
        """
        Clean expired sessions from Redis/database.

        Args:
            db: Database session

        Returns:
            Dict with cleanup statistics
        """
        try:
            # Clean expired auth tokens using ORM
            cutoff_date = datetime.utcnow()

            # Count expired tokens
            count_stmt = select(func.count(AuthToken.id)).where(
                AuthToken.expires_at < cutoff_date
            )
            count_result = await db.execute(count_stmt)
            count = count_result.scalar() or 0

            # Delete expired tokens
            if count > 0:
                delete_stmt = delete(AuthToken).where(
                    AuthToken.expires_at < cutoff_date
                )
                await db.execute(delete_stmt)
                await db.commit()

            logger.info(f"Cleaned {count} expired sessions")

            return {
                "success": True,
                "records_deleted": count
            }

        except SQLAlchemyError as e:
            logger.error(f"Database error cleaning expired sessions: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }
        except Exception as e:
            logger.error(f"Unexpected error cleaning expired sessions: {e}")
            await db.rollback()
            return {
                "success": False,
                "error": str(e),
                "records_deleted": 0
            }

    @staticmethod
    async def clean_all(
        db: AsyncSession,
        activity_log_days: int = 90,
        execution_log_days: int = 30,
        temp_file_hours: int = 24
    ) -> Dict[str, any]:
        """
        Run all cleanup operations.

        Args:
            db: Database session
            activity_log_days: Days to keep activity logs
            execution_log_days: Days to keep execution logs
            temp_file_hours: Hours to keep temp files

        Returns:
            Dict with all cleanup statistics
        """
        logger.info("Starting comprehensive system cleanup...")

        results = {
            "started_at": datetime.utcnow().isoformat(),
            "operations": {}
        }

        # Run all cleanup operations
        results["operations"]["activity_logs"] = await CleanupService.clean_old_activity_logs(
            db, activity_log_days
        )

        results["operations"]["orphaned_data"] = await CleanupService.clean_orphaned_pipeline_runs(db)

        results["operations"]["temp_files"] = await CleanupService.clean_temp_files(temp_file_hours)

        results["operations"]["execution_logs"] = await CleanupService.clean_old_execution_logs(
            db, execution_log_days
        )

        results["operations"]["expired_sessions"] = await CleanupService.clean_expired_sessions(db)

        results["operations"]["database_vacuum"] = await CleanupService.vacuum_database(db)

        results["completed_at"] = datetime.utcnow().isoformat()

        # Calculate totals
        total_records_deleted = sum(
            op.get("records_deleted", 0)
            for op in results["operations"].values()
        )
        total_files_deleted = results["operations"]["temp_files"].get("files_deleted", 0)
        total_space_freed_mb = results["operations"]["temp_files"].get("space_freed_mb", 0)

        results["summary"] = {
            "total_records_deleted": total_records_deleted,
            "total_files_deleted": total_files_deleted,
            "total_space_freed_mb": total_space_freed_mb,
            "success": all(op.get("success", False) for op in results["operations"].values())
        }

        logger.info(f"Cleanup completed: {total_records_deleted} records, {total_files_deleted} files, {total_space_freed_mb} MB freed")

        return results
