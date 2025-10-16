"""
Permission system for enhanced RBAC with 6 roles.
Defines granular permissions for each role and provides permission checking utilities.
"""

from typing import Dict, List, Set
from backend.schemas.user import UserRole


class Permission:
    """Permission constants for the system."""

    # User Management
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    ACTIVATE_USERS = "activate_users"
    RESET_PASSWORDS = "reset_passwords"

    # Pipeline Management
    VIEW_PIPELINES = "view_pipelines"
    CREATE_PIPELINES = "create_pipelines"
    EDIT_PIPELINES = "edit_pipelines"
    DELETE_PIPELINES = "delete_pipelines"
    EXECUTE_PIPELINES = "execute_pipelines"

    # Connector Management
    VIEW_CONNECTORS = "view_connectors"
    CREATE_CONNECTORS = "create_connectors"
    EDIT_CONNECTORS = "edit_connectors"
    DELETE_CONNECTORS = "delete_connectors"
    TEST_CONNECTIONS = "test_connections"

    # Transformation Management
    VIEW_TRANSFORMATIONS = "view_transformations"
    CREATE_TRANSFORMATIONS = "create_transformations"
    EDIT_TRANSFORMATIONS = "edit_transformations"
    DELETE_TRANSFORMATIONS = "delete_transformations"

    # Dashboard & Monitoring
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_MONITORING = "view_monitoring"
    VIEW_LOGS = "view_logs"
    VIEW_ALERTS = "view_alerts"
    MANAGE_ALERTS = "manage_alerts"

    # Analytics & Reports
    VIEW_ANALYTICS = "view_analytics"
    CREATE_REPORTS = "create_reports"
    EXPORT_DATA = "export_data"

    # System Management
    SYSTEM_SETTINGS = "system_settings"
    SYSTEM_MAINTENANCE = "system_maintenance"
    VIEW_ACTIVITY_LOGS = "view_activity_logs"
    MANAGE_CLEANUP = "manage_cleanup"

    # File Management
    UPLOAD_FILES = "upload_files"
    VIEW_FILES = "view_files"
    DELETE_FILES = "delete_files"


# Role hierarchy: Higher roles inherit permissions from lower roles
ROLE_HIERARCHY = {
    UserRole.ADMIN: 6,
    UserRole.DEVELOPER: 5,
    UserRole.DESIGNER: 4,
    UserRole.EXECUTOR: 3,
    UserRole.EXECUTIVE: 2,
    UserRole.VIEWER: 1,
}


# Permission mappings for each role
ROLE_PERMISSIONS: Dict[UserRole, Set[str]] = {
    UserRole.ADMIN: {
        # All permissions - full system access
        Permission.MANAGE_USERS,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USERS,
        Permission.DELETE_USERS,
        Permission.ACTIVATE_USERS,
        Permission.RESET_PASSWORDS,
        Permission.VIEW_PIPELINES,
        Permission.CREATE_PIPELINES,
        Permission.EDIT_PIPELINES,
        Permission.DELETE_PIPELINES,
        Permission.EXECUTE_PIPELINES,
        Permission.VIEW_CONNECTORS,
        Permission.CREATE_CONNECTORS,
        Permission.EDIT_CONNECTORS,
        Permission.DELETE_CONNECTORS,
        Permission.TEST_CONNECTIONS,
        Permission.VIEW_TRANSFORMATIONS,
        Permission.CREATE_TRANSFORMATIONS,
        Permission.EDIT_TRANSFORMATIONS,
        Permission.DELETE_TRANSFORMATIONS,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MONITORING,
        Permission.VIEW_LOGS,
        Permission.VIEW_ALERTS,
        Permission.MANAGE_ALERTS,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS,
        Permission.EXPORT_DATA,
        Permission.SYSTEM_SETTINGS,
        Permission.SYSTEM_MAINTENANCE,
        Permission.VIEW_ACTIVITY_LOGS,
        Permission.MANAGE_CLEANUP,
        Permission.UPLOAD_FILES,
        Permission.VIEW_FILES,
        Permission.DELETE_FILES,
    },

    UserRole.DEVELOPER: {
        # Near-admin access, but cannot modify admin user
        Permission.MANAGE_USERS,  # With restrictions on admin user
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USERS,  # Except admin user
        Permission.DELETE_USERS,  # Except admin user
        Permission.ACTIVATE_USERS,
        Permission.RESET_PASSWORDS,  # Except admin user
        Permission.VIEW_PIPELINES,
        Permission.CREATE_PIPELINES,
        Permission.EDIT_PIPELINES,
        Permission.DELETE_PIPELINES,
        Permission.EXECUTE_PIPELINES,
        Permission.VIEW_CONNECTORS,
        Permission.CREATE_CONNECTORS,
        Permission.EDIT_CONNECTORS,
        Permission.DELETE_CONNECTORS,
        Permission.TEST_CONNECTIONS,
        Permission.VIEW_TRANSFORMATIONS,
        Permission.CREATE_TRANSFORMATIONS,
        Permission.EDIT_TRANSFORMATIONS,
        Permission.DELETE_TRANSFORMATIONS,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MONITORING,
        Permission.VIEW_LOGS,
        Permission.VIEW_ALERTS,
        Permission.MANAGE_ALERTS,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS,
        Permission.EXPORT_DATA,
        Permission.SYSTEM_SETTINGS,
        Permission.SYSTEM_MAINTENANCE,
        Permission.VIEW_ACTIVITY_LOGS,
        Permission.MANAGE_CLEANUP,
        Permission.UPLOAD_FILES,
        Permission.VIEW_FILES,
        Permission.DELETE_FILES,
    },

    UserRole.DESIGNER: {
        # Pipeline, connector, and transformation management
        Permission.VIEW_USERS,  # Can see users for ownership
        Permission.VIEW_PIPELINES,
        Permission.CREATE_PIPELINES,
        Permission.EDIT_PIPELINES,
        Permission.DELETE_PIPELINES,
        Permission.VIEW_CONNECTORS,
        Permission.CREATE_CONNECTORS,
        Permission.EDIT_CONNECTORS,
        Permission.DELETE_CONNECTORS,
        Permission.TEST_CONNECTIONS,
        Permission.VIEW_TRANSFORMATIONS,
        Permission.CREATE_TRANSFORMATIONS,
        Permission.EDIT_TRANSFORMATIONS,
        Permission.DELETE_TRANSFORMATIONS,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MONITORING,
        Permission.VIEW_LOGS,
        Permission.VIEW_ALERTS,
        Permission.UPLOAD_FILES,
        Permission.VIEW_FILES,
    },

    UserRole.EXECUTOR: {
        # Execute pipelines and view monitoring
        Permission.VIEW_PIPELINES,
        Permission.EXECUTE_PIPELINES,
        Permission.VIEW_CONNECTORS,
        Permission.VIEW_TRANSFORMATIONS,
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_MONITORING,
        Permission.VIEW_LOGS,
        Permission.VIEW_ALERTS,
        Permission.VIEW_FILES,
    },

    UserRole.VIEWER: {
        # Read-only access to dashboard and reports
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PIPELINES,
        Permission.VIEW_CONNECTORS,
        Permission.VIEW_TRANSFORMATIONS,
    },

    UserRole.EXECUTIVE: {
        # Analytics, reports, and user data access
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_USERS,
        Permission.VIEW_PIPELINES,
        Permission.VIEW_MONITORING,
    },
}


def get_role_permissions(role: UserRole) -> Set[str]:
    """
    Get all permissions for a specific role.

    Args:
        role: The user role

    Returns:
        Set of permission strings
    """
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(role: UserRole, permission: str) -> bool:
    """
    Check if a role has a specific permission.

    Args:
        role: The user role
        permission: The permission to check

    Returns:
        True if role has permission, False otherwise
    """
    return permission in get_role_permissions(role)


def get_all_permissions() -> List[str]:
    """
    Get all available permissions in the system.

    Returns:
        List of all permission strings
    """
    return [
        attr_value for attr_name, attr_value in vars(Permission).items()
        if not attr_name.startswith('_') and isinstance(attr_value, str)
    ]


def get_role_description(role: UserRole) -> Dict[str, any]:
    """
    Get detailed description and permissions for a role.

    Args:
        role: The user role

    Returns:
        Dictionary with role information
    """
    descriptions = {
        UserRole.ADMIN: {
            "title": "Administrator",
            "description": "Full system access with user management and system settings control",
            "level": ROLE_HIERARCHY[UserRole.ADMIN],
            "can_manage_admin_user": True,
        },
        UserRole.DEVELOPER: {
            "title": "Developer",
            "description": "Near-admin access for development purposes, cannot modify admin user",
            "level": ROLE_HIERARCHY[UserRole.DEVELOPER],
            "can_manage_admin_user": False,
            "warning": "Development role - should be inactive in production environments",
        },
        UserRole.DESIGNER: {
            "title": "Designer",
            "description": "Creates and manages pipelines, connectors, and transformations",
            "level": ROLE_HIERARCHY[UserRole.DESIGNER],
            "can_manage_admin_user": False,
        },
        UserRole.EXECUTOR: {
            "title": "Executor",
            "description": "Executes pipelines and monitors system status",
            "level": ROLE_HIERARCHY[UserRole.EXECUTOR],
            "can_manage_admin_user": False,
        },
        UserRole.VIEWER: {
            "title": "Viewer",
            "description": "Read-only access to dashboard and basic information",
            "level": ROLE_HIERARCHY[UserRole.VIEWER],
            "can_manage_admin_user": False,
        },
        UserRole.EXECUTIVE: {
            "title": "Executive",
            "description": "Access to analytics, reports, and high-level user data",
            "level": ROLE_HIERARCHY[UserRole.EXECUTIVE],
            "can_manage_admin_user": False,
        },
    }

    role_info = descriptions.get(role, {})
    # Handle both UserRole enum and string values
    role_info["role"] = role.value if hasattr(role, 'value') else role
    role_info["permissions"] = list(get_role_permissions(role))
    role_info["permission_count"] = len(role_info["permissions"])

    return role_info


def is_admin_user(username: str) -> bool:
    """
    Check if a username is the admin user.

    Args:
        username: The username to check

    Returns:
        True if username is 'admin', False otherwise
    """
    return username.lower() == "admin"


def can_modify_user(current_user_role: UserRole, target_username: str, current_username: str) -> bool:
    """
    Check if current user can modify target user.

    Args:
        current_user_role: Role of the user attempting the action
        target_username: Username of the user being modified
        current_username: Username of the current user

    Returns:
        True if modification is allowed, False otherwise
    """
    # Admin can modify anyone except themselves (for certain operations)
    if current_user_role == UserRole.ADMIN:
        return True

    # Developer can modify anyone except admin user
    if current_user_role == UserRole.DEVELOPER:
        return not is_admin_user(target_username)

    # Other roles cannot modify users
    return False
