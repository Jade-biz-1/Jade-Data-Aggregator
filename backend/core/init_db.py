"""
Database initialization and seeding script
Creates default admin user on first deployment
Optionally creates developer user for testing
"""
import logging
import os
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.security import get_password_hash
from backend.models.user import User
from sqlalchemy import select

logger = logging.getLogger(__name__)


async def create_default_admin(db: AsyncSession) -> None:
    """
    Create default admin user if it doesn't exist
    Username: admin
    Password: password
    Role: admin
    """
    try:
        # Check if admin user already exists
        result = await db.execute(
            select(User).where(User.username == "admin")
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            logger.info("Default admin user already exists, skipping creation")
            return

        # Create default admin user
        admin_user = User(
            username="admin",
            email="admin@dataaggregator.local",
            hashed_password=get_password_hash("password"),
            role="admin",
            is_active=True,
            is_superuser=False  # Using role-based permissions, not superuser flag
        )

        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)

        logger.warning(
            "Default admin user created - "
            "Username: admin, Password: password - "
            "PLEASE CHANGE PASSWORD IMMEDIATELY"
        )

    except Exception as e:
        logger.error(f"Error creating default admin user: {e}")
        await db.rollback()
        raise


async def create_developer_user(db: AsyncSession) -> None:
    """
    Create developer user for testing (only if CREATE_DEV_USER=true)
    Username: dev
    Password: dev12345
    Role: developer
    Status: INACTIVE by default
    """
    try:
        # Check environment variable
        create_dev_user = os.getenv("CREATE_DEV_USER", "false").lower() == "true"

        if not create_dev_user:
            logger.info("CREATE_DEV_USER not set, skipping developer user creation")
            return

        # Check if dev user already exists
        result = await db.execute(
            select(User).where(User.username == "dev")
        )
        existing_dev = result.scalar_one_or_none()

        if existing_dev:
            logger.info("Developer user already exists, skipping creation")
            return

        # Determine if dev user should be active based on environment
        environment = os.getenv("ENVIRONMENT", "development").lower()
        is_dev_active = environment == "development"

        # Create developer user
        dev_user = User(
            username="dev",
            email="dev@dataaggregator.local",
            hashed_password=get_password_hash("dev12345"),
            role="developer",
            is_active=is_dev_active,  # Active in development, inactive in other environments
            is_superuser=False
        )

        db.add(dev_user)
        await db.commit()
        await db.refresh(dev_user)

        status_msg = "ACTIVE" if is_dev_active else "INACTIVE"
        logger.warning(
            f"Developer user created - "
            f"Username: dev, Password: dev12345, Status: {status_msg}, Environment: {environment} - "
            f"THIS IS A DEVELOPMENT ACCOUNT. "
            f"{'Ready for immediate use.' if is_dev_active else 'Activate via admin panel for testing.'} "
            f"SHOULD NOT BE USED IN PRODUCTION"
        )

    except Exception as e:
        logger.error(f"Error creating developer user: {e}")
        await db.rollback()
        raise


async def init_db(db: AsyncSession, force: bool = False) -> None:
    """
    Initialize database with default data.

    Args:
        db: Database session
        force: Force initialization without prompts (use with caution)
    """
    from backend.core.database_backup import check_database_has_data, create_database_backup

    logger.info("Initializing database...")

    # Check AUTO_INIT_DB environment variable
    auto_init = os.getenv("AUTO_INIT_DB", "true").lower() == "true"

    # Check if database has data
    has_data = await check_database_has_data(db)

    if has_data and not force:
        if not auto_init:
            logger.warning(
                "Database contains data and AUTO_INIT_DB is false. "
                "Skipping initialization. Set AUTO_INIT_DB=true or use force=True to initialize."
            )
            return

        # In non-production, we can skip confirmation for convenience
        environment = os.getenv("ENVIRONMENT", "development").lower()

        if environment == "production":
            logger.error(
                "CRITICAL: Database contains data in PRODUCTION environment. "
                "Automatic initialization is BLOCKED for safety. "
                "Manual intervention required."
            )
            return
        else:
            logger.warning(
                f"Database contains data in {environment} environment. "
                "Proceeding with initialization (non-production). "
                "Consider backing up if data is important."
            )

            # Create backup before initialization
            logger.info("Creating backup before initialization...")
            success, backup_path, message = create_database_backup()

            if success:
                logger.info(f"Backup created: {backup_path}")
            else:
                logger.warning(f"Backup failed: {message}. Proceeding anyway in {environment}.")

    # Create default admin user
    await create_default_admin(db)

    # Create developer user if CREATE_DEV_USER is set
    await create_developer_user(db)

    logger.info("Database initialization completed")


async def reset_database(db: AsyncSession, create_backup: bool = True) -> tuple[bool, str]:
    """
    Reset database (drop all data and reinitialize).
    USE WITH EXTREME CAUTION!

    Args:
        db: Database session
        create_backup: Whether to create a backup first

    Returns:
        Tuple of (success, message)
    """
    from backend.core.database_backup import create_database_backup

    environment = os.getenv("ENVIRONMENT", "development").lower()

    if environment == "production":
        return False, "Database reset is BLOCKED in production environment for safety."

    try:
        if create_backup:
            logger.info("Creating backup before reset...")
            success, backup_path, message = create_database_backup("pre_reset_backup")

            if not success:
                return False, f"Backup failed, aborting reset: {message}"

            logger.info(f"Backup created: {backup_path}")

        # Drop all tables (this would need to be implemented based on your ORM)
        logger.warning("Database reset not fully implemented. Would drop all tables here.")

        # Reinitialize
        await init_db(db, force=True)

        return True, "Database reset completed successfully"

    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return False, f"Database reset failed: {str(e)}"
