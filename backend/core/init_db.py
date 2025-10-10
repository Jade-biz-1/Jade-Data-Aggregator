"""
Database initialization and seeding script
Creates default admin user on first deployment
"""
import logging
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
            is_active=True
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


async def init_db(db: AsyncSession) -> None:
    """
    Initialize database with default data
    """
    logger.info("Initializing database...")

    # Create default admin user
    await create_default_admin(db)

    logger.info("Database initialization completed")
