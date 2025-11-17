"""
Database backup and restore utilities.
Provides functionality to backup and restore database before destructive operations.
"""

import logging
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.core.config import settings

logger = logging.getLogger(__name__)

# Backup directory relative to repository root
BACKUP_DIR = Path("platform/backups/database")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def get_backup_filename(prefix: str = "backup") -> str:
    """
    Generate a backup filename with timestamp.

    Args:
        prefix: Prefix for the backup file

    Returns:
        Backup filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.sql"


def create_database_backup(backup_name: Optional[str] = None) -> tuple[bool, str, str]:
    """
    Create a backup of the PostgreSQL database.

    Args:
        backup_name: Optional custom backup name

    Returns:
        Tuple of (success, backup_path, message)
    """
    try:
        # Generate backup filename
        if not backup_name:
            backup_name = get_backup_filename("db_backup")

        backup_path = BACKUP_DIR / backup_name

        # Extract database connection details from settings
        # Assuming DATABASE_URL format: postgresql://user:pass@host:port/dbname
        db_url = settings.DATABASE_URL

        # Parse database URL
        # This is a simple parser, consider using urllib.parse for production
        if "postgresql://" in db_url or "postgres://" in db_url:
            # Extract components
            url_parts = db_url.replace("postgresql://", "").replace("postgres://", "")

            # Use pg_dump command
            logger.info(f"Creating database backup: {backup_path}")

            # For simplicity, using environment variable method
            # In production, consider more secure methods
            cmd = f'pg_dump "{db_url}" > "{backup_path}"'

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode == 0:
                logger.info(f"Database backup created successfully: {backup_path}")
                return True, str(backup_path), f"Backup created: {backup_path}"
            else:
                error_msg = result.stderr or "Unknown error"
                logger.error(f"Database backup failed: {error_msg}")
                return False, "", f"Backup failed: {error_msg}"
        else:
            logger.warning("Unsupported database type for backup")
            return False, "", "Unsupported database type for backup"

    except subprocess.TimeoutExpired:
        logger.error("Database backup timed out")
        return False, "", "Backup timed out after 5 minutes"
    except Exception as e:
        logger.error(f"Error creating database backup: {e}")
        return False, "", f"Backup error: {str(e)}"


def restore_database_backup(backup_path: str) -> tuple[bool, str]:
    """
    Restore database from a backup file.

    Args:
        backup_path: Path to the backup file

    Returns:
        Tuple of (success, message)
    """
    try:
        if not os.path.exists(backup_path):
            return False, f"Backup file not found: {backup_path}"

        logger.info(f"Restoring database from: {backup_path}")

        db_url = settings.DATABASE_URL

        if "postgresql://" in db_url or "postgres://" in db_url:
            # Use psql command to restore
            cmd = f'psql "{db_url}" < "{backup_path}"'

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout for restore
            )

            if result.returncode == 0:
                logger.info(f"Database restored successfully from: {backup_path}")
                return True, f"Database restored from: {backup_path}"
            else:
                error_msg = result.stderr or "Unknown error"
                logger.error(f"Database restore failed: {error_msg}")
                return False, f"Restore failed: {error_msg}"
        else:
            return False, "Unsupported database type for restore"

    except subprocess.TimeoutExpired:
        logger.error("Database restore timed out")
        return False, "Restore timed out after 10 minutes"
    except Exception as e:
        logger.error(f"Error restoring database: {e}")
        return False, f"Restore error: {str(e)}"


def list_backups() -> list[dict]:
    """
    List all available database backups.

    Returns:
        List of backup information dictionaries
    """
    backups = []

    try:
        for backup_file in BACKUP_DIR.glob("*.sql"):
            stat = backup_file.stat()
            backups.append({
                "filename": backup_file.name,
                "path": str(backup_file),
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        # Sort by creation time, newest first
        backups.sort(key=lambda x: x["created_at"], reverse=True)

    except Exception as e:
        logger.error(f"Error listing backups: {e}")

    return backups


def delete_old_backups(days_to_keep: int = 30) -> int:
    """
    Delete backup files older than specified days.

    Args:
        days_to_keep: Number of days to keep backups

    Returns:
        Number of backups deleted
    """
    deleted_count = 0
    cutoff_time = datetime.now().timestamp() - (days_to_keep * 24 * 60 * 60)

    try:
        for backup_file in BACKUP_DIR.glob("*.sql"):
            if backup_file.stat().st_ctime < cutoff_time:
                backup_file.unlink()
                deleted_count += 1
                logger.info(f"Deleted old backup: {backup_file.name}")

        logger.info(f"Deleted {deleted_count} old backup(s)")

    except Exception as e:
        logger.error(f"Error deleting old backups: {e}")

    return deleted_count


async def check_database_has_data(db) -> bool:
    """
    Check if database has any data.

    Args:
        db: Database session

    Returns:
        True if database has data, False otherwise
    """
    try:
        from sqlalchemy import text

        # Check if users table has any records
        result = await db.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()

        return user_count > 0

    except Exception as e:
        logger.warning(f"Could not check database data: {e}")
        return False
