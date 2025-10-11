"""
Role management endpoints.
Provides information about roles and their permissions.
"""

from fastapi import APIRouter, Depends
from typing import List, Dict
from backend.schemas.user import User, UserRole
from backend.core.security import get_current_active_user
from backend.core.rbac import require_developer
from backend.core.permissions import get_role_description, get_all_permissions
from backend.services.permission_service import PermissionService

router = APIRouter()


@router.get("/")
async def list_roles(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all available roles with their descriptions.
    All authenticated users can view roles.
    """
    roles_info = []
    for role in UserRole:
        role_desc = get_role_description(role)
        roles_info.append(role_desc)

    return {
        "roles": roles_info,
        "total": len(roles_info)
    }


@router.get("/{role}/permissions")
async def get_role_permissions(
    role: UserRole,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get permissions for a specific role.
    All authenticated users can view role permissions.
    """
    role_desc = get_role_description(role)
    return role_desc


@router.get("/permissions/all")
async def list_all_permissions(
    current_user: User = Depends(require_developer())
):
    """
    Get all available permissions in the system.
    Admin/Developer only.
    """
    permissions = get_all_permissions()
    return {
        "permissions": permissions,
        "total": len(permissions)
    }


@router.get("/navigation/items")
async def get_navigation_items(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get which navigation items should be visible for current user.
    """
    nav_items = PermissionService.get_navigation_items(
        current_user.role,
        current_user.is_superuser
    )
    return {
        "user_id": current_user.id,
        "role": current_user.role,
        "navigation": nav_items
    }


@router.get("/features/access")
async def get_feature_access(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed feature access permissions for current user.
    """
    feature_access = PermissionService.get_feature_access(
        current_user.role,
        current_user.is_superuser
    )
    return {
        "user_id": current_user.id,
        "role": current_user.role,
        "features": feature_access
    }
