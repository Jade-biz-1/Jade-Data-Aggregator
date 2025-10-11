"""
Permission service for checking and managing user permissions.
"""

from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.schemas.user import UserRole
from backend.core.permissions import (
    get_role_permissions,
    has_permission,
    get_role_description,
    is_admin_user,
    can_modify_user,
    Permission,
)


class PermissionService:
    """Service for permission-related operations."""

    @staticmethod
    def check_permission(user_role: UserRole, permission: str, is_superuser: bool = False) -> bool:
        """
        Check if a user has a specific permission.

        Args:
            user_role: The user's role
            permission: The permission to check
            is_superuser: Whether the user is a superuser

        Returns:
            True if user has permission, False otherwise
        """
        # Superusers have all permissions
        if is_superuser:
            return True

        return has_permission(user_role, permission)

    @staticmethod
    def get_user_permissions(user_role: UserRole, is_superuser: bool = False) -> Dict[str, any]:
        """
        Get all permissions for a user.

        Args:
            user_role: The user's role
            is_superuser: Whether the user is a superuser

        Returns:
            Dictionary with permission information
        """
        if is_superuser:
            return {
                "role": "superuser",
                "permissions": [
                    attr_value for attr_name, attr_value in vars(Permission).items()
                    if not attr_name.startswith('_') and isinstance(attr_value, str)
                ],
                "role_info": {
                    "title": "Superuser",
                    "description": "System superuser with unrestricted access",
                    "level": 999,
                },
            }

        role_info = get_role_description(user_role)
        return {
            "role": user_role.value,
            "permissions": list(get_role_permissions(user_role)),
            "role_info": role_info,
        }

    @staticmethod
    def can_access_user_management(user_role: UserRole, is_superuser: bool = False) -> bool:
        """Check if user can access user management features."""
        if is_superuser:
            return True
        return has_permission(user_role, Permission.MANAGE_USERS)

    @staticmethod
    def can_modify_target_user(
        current_user_role: UserRole,
        target_username: str,
        current_username: str,
        is_superuser: bool = False
    ) -> bool:
        """
        Check if current user can modify target user.

        Args:
            current_user_role: Role of current user
            target_username: Username of user to modify
            current_username: Username of current user
            is_superuser: Whether current user is superuser

        Returns:
            True if modification allowed, False otherwise
        """
        if is_superuser:
            return True

        return can_modify_user(current_user_role, target_username, current_username)

    @staticmethod
    def can_manage_pipelines(user_role: UserRole, is_superuser: bool = False) -> bool:
        """Check if user can manage (create/edit) pipelines."""
        if is_superuser:
            return True
        return (
            has_permission(user_role, Permission.CREATE_PIPELINES) or
            has_permission(user_role, Permission.EDIT_PIPELINES)
        )

    @staticmethod
    def can_execute_pipelines(user_role: UserRole, is_superuser: bool = False) -> bool:
        """Check if user can execute pipelines."""
        if is_superuser:
            return True
        return has_permission(user_role, Permission.EXECUTE_PIPELINES)

    @staticmethod
    def can_access_analytics(user_role: UserRole, is_superuser: bool = False) -> bool:
        """Check if user can access analytics."""
        if is_superuser:
            return True
        return has_permission(user_role, Permission.VIEW_ANALYTICS)

    @staticmethod
    def can_manage_system(user_role: UserRole, is_superuser: bool = False) -> bool:
        """Check if user can manage system settings and maintenance."""
        if is_superuser:
            return True
        return has_permission(user_role, Permission.SYSTEM_MAINTENANCE)

    @staticmethod
    def get_navigation_items(user_role: UserRole, is_superuser: bool = False) -> Dict[str, bool]:
        """
        Get which navigation items should be visible for a user.

        Returns:
            Dictionary mapping navigation items to visibility
        """
        perms = PermissionService.get_user_permissions(user_role, is_superuser)
        permissions_set = set(perms["permissions"])

        return {
            "dashboard": Permission.VIEW_DASHBOARD in permissions_set,
            "pipelines": Permission.VIEW_PIPELINES in permissions_set,
            "connectors": Permission.VIEW_CONNECTORS in permissions_set,
            "transformations": Permission.VIEW_TRANSFORMATIONS in permissions_set,
            "monitoring": Permission.VIEW_MONITORING in permissions_set,
            "analytics": Permission.VIEW_ANALYTICS in permissions_set,
            "users": Permission.MANAGE_USERS in permissions_set,
            "settings": True,  # All users can access settings (for their own preferences)
            "maintenance": Permission.SYSTEM_MAINTENANCE in permissions_set,
            "activity_logs": Permission.VIEW_ACTIVITY_LOGS in permissions_set,
        }

    @staticmethod
    def get_feature_access(user_role: UserRole, is_superuser: bool = False) -> Dict[str, Dict[str, bool]]:
        """
        Get detailed feature access permissions for a user.

        Returns:
            Dictionary with feature categories and their access levels
        """
        perms = PermissionService.get_user_permissions(user_role, is_superuser)
        permissions_set = set(perms["permissions"])

        return {
            "users": {
                "view": Permission.VIEW_USERS in permissions_set,
                "create": Permission.CREATE_USERS in permissions_set,
                "edit": Permission.EDIT_USERS in permissions_set,
                "delete": Permission.DELETE_USERS in permissions_set,
                "activate": Permission.ACTIVATE_USERS in permissions_set,
                "reset_password": Permission.RESET_PASSWORDS in permissions_set,
            },
            "pipelines": {
                "view": Permission.VIEW_PIPELINES in permissions_set,
                "create": Permission.CREATE_PIPELINES in permissions_set,
                "edit": Permission.EDIT_PIPELINES in permissions_set,
                "delete": Permission.DELETE_PIPELINES in permissions_set,
                "execute": Permission.EXECUTE_PIPELINES in permissions_set,
            },
            "connectors": {
                "view": Permission.VIEW_CONNECTORS in permissions_set,
                "create": Permission.CREATE_CONNECTORS in permissions_set,
                "edit": Permission.EDIT_CONNECTORS in permissions_set,
                "delete": Permission.DELETE_CONNECTORS in permissions_set,
                "test": Permission.TEST_CONNECTIONS in permissions_set,
            },
            "transformations": {
                "view": Permission.VIEW_TRANSFORMATIONS in permissions_set,
                "create": Permission.CREATE_TRANSFORMATIONS in permissions_set,
                "edit": Permission.EDIT_TRANSFORMATIONS in permissions_set,
                "delete": Permission.DELETE_TRANSFORMATIONS in permissions_set,
            },
            "monitoring": {
                "view": Permission.VIEW_MONITORING in permissions_set,
                "view_logs": Permission.VIEW_LOGS in permissions_set,
                "view_alerts": Permission.VIEW_ALERTS in permissions_set,
                "manage_alerts": Permission.MANAGE_ALERTS in permissions_set,
            },
            "analytics": {
                "view": Permission.VIEW_ANALYTICS in permissions_set,
                "create_reports": Permission.CREATE_REPORTS in permissions_set,
                "export": Permission.EXPORT_DATA in permissions_set,
            },
            "system": {
                "settings": Permission.SYSTEM_SETTINGS in permissions_set,
                "maintenance": Permission.SYSTEM_MAINTENANCE in permissions_set,
                "view_activity_logs": Permission.VIEW_ACTIVITY_LOGS in permissions_set,
                "cleanup": Permission.MANAGE_CLEANUP in permissions_set,
            },
            "files": {
                "view": Permission.VIEW_FILES in permissions_set,
                "upload": Permission.UPLOAD_FILES in permissions_set,
                "delete": Permission.DELETE_FILES in permissions_set,
            },
        }
