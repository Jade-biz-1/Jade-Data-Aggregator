from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.schemas.user import User, UserCreate, UserUpdate, UserWithPermissions
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.core.rbac import require_admin, require_developer, RBACService
from backend import crud
from backend.services.activity_log_service import (
    log_user_created,
    log_user_updated,
    log_user_activated,
    log_user_deactivated,
    log_password_reset
)
from backend.middleware.admin_protection import (
    check_can_modify_user,
    check_can_delete_user,
    check_can_reset_password,
    check_can_activate_deactivate,
    check_can_assign_role
)


router = APIRouter()


@router.get("/", response_model=List[User])
async def read_users(
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all users (admin/developer only)
    """
    users = await crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
async def create_user(
    request: Request,
    user: UserCreate,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (admin/developer)
    """
    # Check if user already exists
    db_user = await crud.user.get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists
    db_user = await crud.user.get_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check role assignment permissions
    if user.role:
        check_can_assign_role(current_user, user.username, user.role)

    new_user = await crud.user.create(db, obj_in=user)

    # Log user creation
    await log_user_created(db, new_user.id, current_user.id, request)

    return new_user


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user
    """
    return current_user


@router.get("/me/permissions")
async def get_current_user_permissions(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's permissions
    """
    permissions = RBACService.get_user_permissions(current_user)
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "permissions": permissions
    }


@router.get("/me/session-info")
async def get_session_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive session information (user, permissions, navigation, features) in a single call.

    This endpoint consolidates data from:
    - /users/me
    - /users/me/permissions
    - /roles/navigation/items
    - /roles/features/access

    Reduces 3-4 separate API calls to 1 call for better performance.
    """
    from backend.services.permission_service import PermissionService

    # Get permissions
    permissions = RBACService.get_user_permissions(current_user)

    # Get navigation items
    navigation = PermissionService.get_navigation_items(
        current_user.role,
        current_user.is_superuser
    )

    # Get feature access
    features = PermissionService.get_feature_access(
        current_user.role,
        current_user.is_superuser
    )

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "is_superuser": current_user.is_superuser
        },
        "permissions": {
            "role": current_user.role,
            "permissions": permissions.get("permissions", []),
            "role_info": permissions.get("role_info", {})
        },
        "navigation": navigation,
        "features": features
    }


@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user by ID
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user (admin/developer)
    Developer cannot modify admin user
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if current user can modify this user
    check_can_modify_user(current_user, user.id, user.username)

    # Check role assignment if role is being changed
    if user_in.role and user_in.role != user.role:
        check_can_assign_role(current_user, user.username, user_in.role)

    user = await crud.user.update(db, db_obj=user, obj_in=user_in)

    # Log user update
    await log_user_updated(db, user_id, current_user.id, request)

    return user


@router.delete("/{user_id}", response_model=User)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (admin/developer, with restrictions)
    Cannot delete admin user or yourself
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if deletion is allowed
    check_can_delete_user(current_user, user.id, user.username)

    user = await crud.user.remove(db, id=user_id)
    return user


@router.post("/{user_id}/activate")
async def activate_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a user (admin/developer)
    Cannot activate admin user (always active)
    """
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if activation is allowed
    check_can_activate_deactivate(current_user, user.id, user.username, "activate")

    if user.is_active:
        raise HTTPException(status_code=400, detail="User is already active")

    user.is_active = True
    await db.commit()
    await db.refresh(user)

    # Log user activation event
    await log_user_activated(db, user_id, current_user.id, request)

    return {"message": f"User {user.username} has been activated"}


@router.post("/{user_id}/deactivate")
async def deactivate_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user (admin/developer)
    Cannot deactivate admin user or yourself
    """
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if deactivation is allowed
    check_can_activate_deactivate(current_user, user.id, user.username, "deactivate")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is already inactive")

    user.is_active = False
    await db.commit()
    await db.refresh(user)

    # Log user deactivation event
    await log_user_deactivated(db, user_id, current_user.id, request)

    return {"message": f"User {user.username} has been deactivated"}


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset a user's password (admin/developer)
    Cannot reset admin user password (use change password instead)
    Generates a temporary password that the user must change
    """
    from backend.models.user import User as UserModel
    from backend.core import security
    from sqlalchemy import select
    import secrets
    import string

    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if password reset is allowed
    check_can_reset_password(current_user, user.username)

    # Generate a temporary password (12 characters, alphanumeric)
    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

    # Hash and update password
    user.hashed_password = security.get_password_hash(temp_password)
    await db.commit()

    # Log password reset event
    await log_password_reset(db, user_id, current_user.id, request)

    return {
        "message": f"Password reset for user {user.username}",
        "temporary_password": temp_password,
        "note": "User should change this password immediately"
    }