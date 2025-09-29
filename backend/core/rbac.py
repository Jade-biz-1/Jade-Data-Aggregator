"""Role-Based Access Control (RBAC) system."""

from functools import wraps
from typing import List, Optional

from fastapi import HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.user import User, UserRole
from backend.core.security import get_current_active_user
from backend.core.database import get_db


class RBACError(Exception):
    """Custom exception for RBAC violations."""
    pass


def require_role(allowed_roles: List[UserRole]):
    """
    Decorator factory to require specific roles for endpoint access.

    Args:
        allowed_roles: List of roles that are allowed to access the endpoint

    Returns:
        Dependency function that can be used with FastAPI Depends()
    """
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.is_superuser:
            # Superusers can access everything
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required roles: {[role.value for role in allowed_roles]}"
            )

        return current_user

    return role_checker


def require_admin():
    """Dependency to require admin role."""
    return require_role([UserRole.ADMIN])


def require_editor_or_admin():
    """Dependency to require editor or admin role."""
    return require_role([UserRole.EDITOR, UserRole.ADMIN])


def require_any_authenticated():
    """Dependency to require any authenticated user (all roles)."""
    return require_role([UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN])


class RBACService:
    """Service for role-based access control operations."""

    @staticmethod
    def can_user_access_resource(
        user: User,
        resource_type: str,
        action: str,
        resource_owner_id: Optional[int] = None
    ) -> bool:
        """
        Check if user can perform action on resource type.

        Args:
            user: The user attempting the action
            resource_type: Type of resource (pipeline, connector, etc.)
            action: Action being performed (read, write, delete, etc.)
            resource_owner_id: ID of the resource owner (for ownership checks)

        Returns:
            True if user has permission, False otherwise
        """
        # Superusers can do anything
        if user.is_superuser:
            return True

        # Admin role can do anything
        if user.role == UserRole.ADMIN:
            return True

        # For ownership-based resources, users can manage their own
        if resource_owner_id and resource_owner_id == user.id:
            return True

        # Role-based permissions
        if action == "read":
            # All authenticated users can read
            return True
        elif action in ["write", "update", "create"]:
            # Editors and admins can write
            return user.role in [UserRole.EDITOR, UserRole.ADMIN]
        elif action == "delete":
            # Only admins can delete (unless they own the resource)
            return user.role == UserRole.ADMIN
        elif action in ["admin", "manage_users", "system_settings"]:
            # Only admins can perform admin actions
            return user.role == UserRole.ADMIN

        return False

    @staticmethod
    def get_user_permissions(user: User) -> dict:
        """
        Get a dictionary of permissions for a user.

        Returns:
            Dictionary with permission mappings
        """
        if user.is_superuser:
            return {
                "can_read": True,
                "can_write": True,
                "can_delete": True,
                "can_admin": True,
                "can_manage_users": True,
                "can_execute_pipelines": True,
                "can_view_system_logs": True,
                "role": "superuser"
            }

        base_permissions = {
            "role": user.role.value,
            "can_read": True,  # All users can read
        }

        if user.role == UserRole.ADMIN:
            base_permissions.update({
                "can_write": True,
                "can_delete": True,
                "can_admin": True,
                "can_manage_users": True,
                "can_execute_pipelines": True,
                "can_view_system_logs": True,
            })
        elif user.role == UserRole.EDITOR:
            base_permissions.update({
                "can_write": True,
                "can_delete": False,  # Editors can't delete by default
                "can_admin": False,
                "can_manage_users": False,
                "can_execute_pipelines": True,
                "can_view_system_logs": False,
            })
        elif user.role == UserRole.VIEWER:
            base_permissions.update({
                "can_write": False,
                "can_delete": False,
                "can_admin": False,
                "can_manage_users": False,
                "can_execute_pipelines": False,
                "can_view_system_logs": False,
            })

        return base_permissions


# Convenience functions for common permission checks
def check_admin_permission(user: User) -> bool:
    """Check if user has admin permissions."""
    return user.is_superuser or user.role == UserRole.ADMIN


def check_write_permission(user: User) -> bool:
    """Check if user has write permissions."""
    return (
        user.is_superuser or
        user.role in [UserRole.ADMIN, UserRole.EDITOR]
    )


def check_read_permission(user: User) -> bool:
    """Check if user has read permissions."""
    return True  # All authenticated users can read