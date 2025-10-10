"""
Activity Logging Service
Provides functions to log user actions for audit trail
"""
import logging
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from fastapi import Request

from backend.models.activity_log import UserActivityLog

logger = logging.getLogger(__name__)


class ActivityLogService:
    """Service for logging and querying user activity"""

    @staticmethod
    async def log_activity(
        db: AsyncSession,
        user_id: Optional[int],
        action: str,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserActivityLog:
        """
        Log a user activity event

        Args:
            db: Database session
            user_id: ID of the user (None for failed login attempts)
            action: Type of action (login, logout, password_change, etc.)
            details: Additional details about the action
            ip_address: IP address of the request
            user_agent: User agent string

        Returns:
            Created activity log entry
        """
        try:
            activity_log = UserActivityLog(
                user_id=user_id,
                action=action,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow()
            )

            db.add(activity_log)
            await db.commit()
            await db.refresh(activity_log)

            logger.info(f"Activity logged: {action} for user_id={user_id}")
            return activity_log

        except Exception as e:
            logger.error(f"Error logging activity: {e}")
            await db.rollback()
            raise

    @staticmethod
    async def log_from_request(
        db: AsyncSession,
        request: Request,
        user_id: Optional[int],
        action: str,
        details: Optional[str] = None
    ) -> UserActivityLog:
        """
        Log activity from a FastAPI request
        Automatically extracts IP and user agent
        """
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        return await ActivityLogService.log_activity(
            db=db,
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    async def get_user_activity(
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        action_filter: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[UserActivityLog]:
        """
        Get activity logs for a specific user

        Args:
            db: Database session
            user_id: User ID to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return
            action_filter: Filter by action type
            start_date: Filter by start date
            end_date: Filter by end date

        Returns:
            List of activity log entries
        """
        query = select(UserActivityLog).where(UserActivityLog.user_id == user_id)

        if action_filter:
            query = query.where(UserActivityLog.action == action_filter)

        if start_date:
            query = query.where(UserActivityLog.timestamp >= start_date)

        if end_date:
            query = query.where(UserActivityLog.timestamp <= end_date)

        query = query.order_by(desc(UserActivityLog.timestamp)).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_all_activity(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        action_filter: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[UserActivityLog]:
        """
        Get all activity logs (admin only)

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            action_filter: Filter by action type
            start_date: Filter by start date
            end_date: Filter by end date

        Returns:
            List of activity log entries
        """
        query = select(UserActivityLog)

        if action_filter:
            query = query.where(UserActivityLog.action == action_filter)

        if start_date:
            query = query.where(UserActivityLog.timestamp >= start_date)

        if end_date:
            query = query.where(UserActivityLog.timestamp <= end_date)

        query = query.order_by(desc(UserActivityLog.timestamp)).offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def cleanup_old_logs(
        db: AsyncSession,
        days_to_keep: int = 90
    ) -> int:
        """
        Delete activity logs older than specified days

        Args:
            db: Database session
            days_to_keep: Number of days of logs to retain

        Returns:
            Number of logs deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            result = await db.execute(
                select(UserActivityLog).where(UserActivityLog.timestamp < cutoff_date)
            )
            old_logs = result.scalars().all()

            count = len(old_logs)

            for log in old_logs:
                await db.delete(log)

            await db.commit()

            logger.info(f"Cleaned up {count} activity logs older than {days_to_keep} days")
            return count

        except Exception as e:
            logger.error(f"Error cleaning up old logs: {e}")
            await db.rollback()
            raise


# Convenience functions for common actions

async def log_login(db: AsyncSession, user_id: int, request: Request):
    """Log a successful login"""
    await ActivityLogService.log_from_request(
        db, request, user_id, "login", "User logged in successfully"
    )


async def log_logout(db: AsyncSession, user_id: int, request: Request):
    """Log a logout"""
    await ActivityLogService.log_from_request(
        db, request, user_id, "logout", "User logged out"
    )


async def log_failed_login(db: AsyncSession, username: str, request: Request):
    """Log a failed login attempt"""
    await ActivityLogService.log_from_request(
        db, request, None, "failed_login", f"Failed login attempt for username: {username}"
    )


async def log_password_change(db: AsyncSession, user_id: int, request: Request):
    """Log a password change"""
    await ActivityLogService.log_from_request(
        db, request, user_id, "password_change", "User changed their password"
    )


async def log_password_reset(db: AsyncSession, target_user_id: int, admin_user_id: int, request: Request):
    """Log an admin password reset"""
    await ActivityLogService.log_from_request(
        db, request, admin_user_id, "password_reset",
        f"Admin reset password for user_id={target_user_id}"
    )


async def log_user_created(db: AsyncSession, new_user_id: int, creator_user_id: int, request: Request):
    """Log user creation"""
    await ActivityLogService.log_from_request(
        db, request, creator_user_id, "user_created",
        f"Created new user with user_id={new_user_id}"
    )


async def log_user_updated(db: AsyncSession, target_user_id: int, updater_user_id: int, request: Request):
    """Log user update"""
    await ActivityLogService.log_from_request(
        db, request, updater_user_id, "user_updated",
        f"Updated user with user_id={target_user_id}"
    )


async def log_user_activated(db: AsyncSession, target_user_id: int, admin_user_id: int, request: Request):
    """Log user activation"""
    await ActivityLogService.log_from_request(
        db, request, admin_user_id, "user_activated",
        f"Activated user with user_id={target_user_id}"
    )


async def log_user_deactivated(db: AsyncSession, target_user_id: int, admin_user_id: int, request: Request):
    """Log user deactivation"""
    await ActivityLogService.log_from_request(
        db, request, admin_user_id, "user_deactivated",
        f"Deactivated user with user_id={target_user_id}"
    )
