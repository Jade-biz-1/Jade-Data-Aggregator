from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.schemas.user import User, UserCreate, UserUpdate, UserWithPermissions
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.core.rbac import require_admin, require_editor_or_admin, RBACService
from backend import crud
from backend.services.activity_log_service import (
    log_user_created,
    log_user_updated,
    log_user_activated,
    log_user_deactivated,
    log_password_reset
)


router = APIRouter()


@router.get("/", response_model=List[User])
async def read_users(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all users (admin only)
    """
    users = await crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
async def create_user(
    request: Request,
    user: UserCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (admin only)
    """
    # Check if user already exists
    db_user = await crud.user.get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists
    db_user = await crud.user.get_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")

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
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = await crud.user.update(db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/{user_id}", response_model=User)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (admin only)
    """
    user = await crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = await crud.user.remove(db, id=user_id)
    return user


@router.post("/{user_id}/activate")
async def activate_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a user (admin only)
    """
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate a user (admin only)
    """
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    # Prevent deactivating yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )

    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset a user's password (admin only)
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