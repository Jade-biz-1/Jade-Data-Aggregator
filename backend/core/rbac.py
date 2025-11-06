"""Role-Based Access Control (RBAC) system."""

from functools import wraps
from typing import List, Optional

from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.schemas.user import User, UserRole


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
    """Dependency to require admin role only."""
    return require_role([UserRole.ADMIN])


def require_developer():
    """Dependency to require developer or admin role."""
    return require_role([UserRole.DEVELOPER, UserRole.ADMIN])


def require_designer():
    """Dependency to require designer, developer, or admin role."""
    return require_role([UserRole.DESIGNER, UserRole.DEVELOPER, UserRole.ADMIN])


def require_executor():
    """Dependency to require executor, developer, or admin role."""
    return require_role([UserRole.EXECUTOR, UserRole.DEVELOPER, UserRole.ADMIN])


def require_executive():
    """Dependency to require executive, developer, or admin role."""
    return require_role([UserRole.EXECUTIVE, UserRole.DEVELOPER, UserRole.ADMIN])


def require_viewer():
    """Dependency to require any authenticated user (all roles)."""
    return require_role([UserRole.VIEWER, UserRole.EXECUTOR, UserRole.DESIGNER, UserRole.EXECUTIVE, UserRole.DEVELOPER, UserRole.ADMIN])


# Legacy aliases for backward compatibility
def require_editor_or_admin():
    """Dependency to require designer or higher (legacy)."""
    return require_designer()


def require_any_authenticated():
    """Dependency to require any authenticated user (all roles)."""
    return require_viewer()


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
        # Import here to avoid circular dependency
        from backend.services.permission_service import PermissionService

        if user.is_superuser:
            return {
                "can_read": True,
                "can_write": True,
                "can_delete": True,
                "can_admin": True,
                "can_manage_users": True,
                "can_execute_pipelines": True,
                "can_view_system_logs": True,
                "can_manage_system": True,
                "can_view_analytics": True,
                "role": "superuser"
            }

        # Convert string role to UserRole enum
        try:
            user_role_enum = UserRole(user.role)
        except ValueError:
            # Fallback to viewer if role is invalid
            user_role_enum = UserRole.VIEWER

        # Use new permission service for granular permissions
        return PermissionService.get_user_permissions(user_role_enum, user.is_superuser)


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