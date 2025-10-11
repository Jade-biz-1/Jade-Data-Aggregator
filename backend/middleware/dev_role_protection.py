"""
Middleware to protect against developer role usage in production.
Implements ALLOW_DEV_ROLE_IN_PRODUCTION flag with auto-expiration.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from backend.schemas.user import User, UserRole
from backend.models.system_settings import SystemSetting


def is_production_environment() -> bool:
    """
    Check if the current environment is production.

    Returns:
        True if ENVIRONMENT=production, False otherwise
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    return env == "production"


async def get_dev_role_production_setting(db: AsyncSession) -> Optional[SystemSetting]:
    """
    Get the ALLOW_DEV_ROLE_IN_PRODUCTION setting from database.

    Args:
        db: Database session

    Returns:
        SystemSetting object or None
    """
    result = await db.execute(
        select(SystemSetting).where(
            SystemSetting.key == "ALLOW_DEV_ROLE_IN_PRODUCTION"
        )
    )
    return result.scalar_one_or_none()


async def is_dev_role_allowed_in_production(db: AsyncSession) -> bool:
    """
    Check if developer role is allowed in production environment.

    Args:
        db: Database session

    Returns:
        True if allowed (either not production or flag is set), False otherwise
    """
    # If not production, always allow
    if not is_production_environment():
        return True

    # Check database setting
    setting = await get_dev_role_production_setting(db)

    if not setting or not setting.is_active:
        return False

    # Check if setting has expired
    if setting.expires_at and setting.expires_at < datetime.utcnow():
        # Setting has expired, disable it
        setting.is_active = False
        await db.commit()
        return False

    # Check value (should be "true")
    return setting.value and setting.value.lower() == "true"


async def set_dev_role_production_flag(
    db: AsyncSession,
    allow: bool = True,
    hours: int = 24
) -> SystemSetting:
    """
    Set the ALLOW_DEV_ROLE_IN_PRODUCTION flag.

    Args:
        db: Database session
        allow: Whether to allow developer role
        hours: How many hours until auto-expiration (default 24)

    Returns:
        Updated or created SystemSetting
    """
    setting = await get_dev_role_production_setting(db)

    if not setting:
        # Create new setting
        expires_at = datetime.utcnow() + timedelta(hours=hours) if allow else None
        setting = SystemSetting(
            key="ALLOW_DEV_ROLE_IN_PRODUCTION",
            value="true" if allow else "false",
            value_type="boolean",
            description="Temporarily allows developer role in production environment",
            is_active=allow,
            expires_at=expires_at
        )
        db.add(setting)
    else:
        # Update existing setting
        setting.value = "true" if allow else "false"
        setting.is_active = allow
        setting.expires_at = datetime.utcnow() + timedelta(hours=hours) if allow else None
        setting.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(setting)

    return setting


async def check_developer_role_production(user: User, db: AsyncSession) -> dict:
    """
    Check if developer role user is allowed in production.

    Args:
        user: The user to check
        db: Database session

    Returns:
        Dict with warning information if developer role is active in production

    Raises:
        HTTPException: If developer role is not allowed in production
    """
    # Only check if user is developer role
    if user.role != UserRole.DEVELOPER:
        return {"warning": False}

    # Check if production
    if not is_production_environment():
        return {"warning": False}

    # Check if allowed
    allowed = await is_dev_role_allowed_in_production(db)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer role is not allowed in production environment. "
                   "Administrator must enable ALLOW_DEV_ROLE_IN_PRODUCTION flag."
        )

    # Get setting for expiration info
    setting = await get_dev_role_production_setting(db)

    return {
        "warning": True,
        "message": "Developer role is active in production environment",
        "expires_at": setting.expires_at.isoformat() if setting and setting.expires_at else None
    }


def mask_dev_user_login_failure() -> HTTPException:
    """
    Return generic error for dev user login failures.
    This prevents attackers from knowing if 'dev' user exists.

    Returns:
        Generic authentication error
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
        headers={"WWW-Authenticate": "Bearer"}
    )
