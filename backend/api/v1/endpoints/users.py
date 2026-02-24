import math
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend import crud
from backend.core.database import get_db
from backend.core.rbac import RBACService, require_admin, require_developer
from backend.models.user import User as UserModel
from backend.schemas.pagination import PaginatedResponse
from backend.core.security import get_current_active_user
from backend.middleware.admin_protection import (
    check_can_activate_deactivate,
    check_can_assign_role,
    check_can_delete_user,
    check_can_modify_user,
    check_can_reset_password,
)
from backend.schemas.user import (
    User,
    UserCreate,
    UserRole,
    UserUpdate,
    UserWithPermissions,
)
from backend.services.activity_log_service import (
    log_password_reset,
    log_user_activated,
    log_user_created,
    log_user_deactivated,
    log_user_updated,
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[User])
async def read_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all users with pagination metadata (admin/developer only) — API-001.
    """
    total_result = await db.execute(select(func.count()).select_from(UserModel))
    total = total_result.scalar() or 0

    users = await crud.user.get_multi(db, skip=skip, limit=limit)
    pages = math.ceil(total / limit) if limit else 1

    return PaginatedResponse(
        items=users,
        total=total,
        skip=skip,
        limit=limit,
        page=skip // limit + 1 if limit else 1,
        pages=pages,
        has_more=(skip + limit) < total,
    )


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

    # Convert string role to UserRole enum
    try:
        user_role_enum = UserRole(current_user.role)
    except ValueError:
        # Fallback to viewer if role is invalid
        user_role_enum = UserRole.VIEWER

    # Get navigation items
    navigation = PermissionService.get_navigation_items(
        user_role_enum,
        current_user.is_superuser
    )

    # Get feature access
    features = PermissionService.get_feature_access(
        user_role_enum,
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
    from sqlalchemy import select

    from backend.models.user import User as UserModel

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
    from sqlalchemy import select

    from backend.models.user import User as UserModel

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
    import secrets
    import string

    from sqlalchemy import select

    from backend.core import security
    from backend.models.user import User as UserModel

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


# ---------------------------------------------------------------------------
# FEAT-002: Admin account unlock
# ---------------------------------------------------------------------------

@router.post("/{user_id}/unlock-account")
async def unlock_account(
    user_id: int,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Clear the account lockout for a user (developer / admin only).

    Resets `failed_login_attempts` to 0 and clears `lockout_until` so the user
    can log in again without waiting for the lockout period to expire.
    """
    from datetime import datetime
    from sqlalchemy import select
    from backend.models.user import User as UserModel

    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.failed_login_attempts = 0
    user.lockout_until = None
    await db.commit()

    return {"message": f"Account lockout cleared for user {user.username}"}


# ---------------------------------------------------------------------------
# UX-002: Bulk delete users
# ---------------------------------------------------------------------------

from pydantic import BaseModel as _BaseModel
from typing import List as _List


class BulkDeleteUsersRequest(_BaseModel):
    ids: _List[int]


@router.delete("/bulk", status_code=200)
async def bulk_delete_users(
    body: BulkDeleteUsersRequest,
    current_user: User = Depends(require_developer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete multiple users by ID in a single request (UX-002).
    Admin users and the calling user cannot be bulk-deleted.
    IDs that do not exist are silently skipped.
    Returns the count of actually deleted users.
    """
    from backend.middleware.admin_protection import check_can_delete_user

    deleted_count = 0
    skipped = []
    for uid in body.ids:
        target = await crud.user.get(db, id=uid)
        if not target:
            continue
        try:
            check_can_delete_user(current_user, target.id, target.username)
        except Exception:
            skipped.append(uid)
            continue
        await crud.user.remove(db, id=uid)
        deleted_count += 1

    return {"deleted": deleted_count, "requested": len(body.ids), "skipped": skipped}