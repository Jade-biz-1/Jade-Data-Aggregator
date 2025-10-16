"""
Unit tests for Permission Service (Phase 8).
Tests the granular permission system for all 6 roles.
"""

import pytest
from backend.services.permission_service import PermissionService
from backend.schemas.user import UserRole
from backend.core.permissions import Permission


class TestPermissionService:
    """Test suite for PermissionService."""

    def test_admin_has_all_permissions(self):
        """Test that Admin role has all permissions."""
        permissions = PermissionService.get_user_permissions(UserRole.ADMIN, is_superuser=False)

        assert permissions["role"] == "admin"
        assert Permission.MANAGE_USERS in permissions["permissions"]
        assert Permission.SYSTEM_SETTINGS in permissions["permissions"]
        assert Permission.SYSTEM_MAINTENANCE in permissions["permissions"]
        assert Permission.MANAGE_CLEANUP in permissions["permissions"]

    def test_developer_has_near_admin_permissions(self):
        """Test that Developer role has extensive permissions."""
        permissions = PermissionService.get_user_permissions(UserRole.DEVELOPER, is_superuser=False)

        assert permissions["role"] == "developer"
        assert Permission.MANAGE_USERS in permissions["permissions"]
        assert Permission.CREATE_PIPELINES in permissions["permissions"]
        assert Permission.EXECUTE_PIPELINES in permissions["permissions"]
        assert Permission.VIEW_ANALYTICS in permissions["permissions"]
        assert Permission.SYSTEM_MAINTENANCE in permissions["permissions"]

    def test_designer_can_create_pipelines(self):
        """Test that Designer role can create and edit pipelines."""
        permissions = PermissionService.get_user_permissions(UserRole.DESIGNER, is_superuser=False)

        assert permissions["role"] == "designer"
        assert Permission.CREATE_PIPELINES in permissions["permissions"]
        assert Permission.EDIT_PIPELINES in permissions["permissions"]
        assert Permission.CREATE_CONNECTORS in permissions["permissions"]
        assert Permission.CREATE_TRANSFORMATIONS in permissions["permissions"]
        # Designer cannot execute pipelines
        assert Permission.EXECUTE_PIPELINES not in permissions["permissions"]
        # Designer cannot manage users
        assert Permission.MANAGE_USERS not in permissions["permissions"]

    def test_executor_can_execute_pipelines(self):
        """Test that Executor role can execute pipelines."""
        permissions = PermissionService.get_user_permissions(UserRole.EXECUTOR, is_superuser=False)

        assert permissions["role"] == "executor"
        assert Permission.EXECUTE_PIPELINES in permissions["permissions"]
        assert Permission.VIEW_MONITORING in permissions["permissions"]
        assert Permission.VIEW_DASHBOARD in permissions["permissions"]
        # Executor cannot create/edit pipelines
        assert Permission.CREATE_PIPELINES not in permissions["permissions"]
        assert Permission.EDIT_PIPELINES not in permissions["permissions"]

    def test_executive_can_view_analytics(self):
        """Test that Executive role can view analytics and reports."""
        permissions = PermissionService.get_user_permissions(UserRole.EXECUTIVE, is_superuser=False)

        assert permissions["role"] == "executive"
        assert Permission.VIEW_ANALYTICS in permissions["permissions"]
        assert Permission.VIEW_USERS in permissions["permissions"]
        assert Permission.EXPORT_DATA in permissions["permissions"]
        # Executive cannot modify anything
        assert Permission.CREATE_PIPELINES not in permissions["permissions"]
        assert Permission.EXECUTE_PIPELINES not in permissions["permissions"]
        assert Permission.MANAGE_USERS not in permissions["permissions"]

    def test_viewer_has_read_only_access(self):
        """Test that Viewer role has read-only access."""
        permissions = PermissionService.get_user_permissions(UserRole.VIEWER, is_superuser=False)

        assert permissions["role"] == "viewer"
        assert Permission.VIEW_DASHBOARD in permissions["permissions"]
        assert Permission.VIEW_PIPELINES in permissions["permissions"]
        assert Permission.VIEW_CONNECTORS in permissions["permissions"]
        # Viewer cannot create, edit, or delete anything
        assert Permission.CREATE_PIPELINES not in permissions["permissions"]
        assert Permission.EDIT_PIPELINES not in permissions["permissions"]
        assert Permission.DELETE_PIPELINES not in permissions["permissions"]
        assert Permission.EXECUTE_PIPELINES not in permissions["permissions"]
        assert Permission.MANAGE_USERS not in permissions["permissions"]

    def test_superuser_has_all_permissions(self):
        """Test that superuser flag grants all permissions."""
        permissions = PermissionService.get_user_permissions(UserRole.VIEWER, is_superuser=True)

        assert permissions["role"] == "superuser"
        assert Permission.MANAGE_USERS in permissions["permissions"]
        assert Permission.SYSTEM_SETTINGS in permissions["permissions"]
        assert len(permissions["permissions"]) > 20  # Superuser has many permissions

    def test_can_access_user_management(self):
        """Test user management access check."""
        assert PermissionService.can_access_user_management(UserRole.ADMIN) == True
        assert PermissionService.can_access_user_management(UserRole.DEVELOPER) == True
        assert PermissionService.can_access_user_management(UserRole.DESIGNER) == False
        assert PermissionService.can_access_user_management(UserRole.EXECUTOR) == False
        assert PermissionService.can_access_user_management(UserRole.VIEWER) == False
        assert PermissionService.can_access_user_management(UserRole.EXECUTIVE) == False

    def test_can_manage_pipelines(self):
        """Test pipeline management access check."""
        assert PermissionService.can_manage_pipelines(UserRole.ADMIN) == True
        assert PermissionService.can_manage_pipelines(UserRole.DEVELOPER) == True
        assert PermissionService.can_manage_pipelines(UserRole.DESIGNER) == True
        assert PermissionService.can_manage_pipelines(UserRole.EXECUTOR) == False
        assert PermissionService.can_manage_pipelines(UserRole.VIEWER) == False
        assert PermissionService.can_manage_pipelines(UserRole.EXECUTIVE) == False

    def test_can_execute_pipelines(self):
        """Test pipeline execution access check."""
        assert PermissionService.can_execute_pipelines(UserRole.ADMIN) == True
        assert PermissionService.can_execute_pipelines(UserRole.DEVELOPER) == True
        assert PermissionService.can_execute_pipelines(UserRole.EXECUTOR) == True
        assert PermissionService.can_execute_pipelines(UserRole.DESIGNER) == False
        assert PermissionService.can_execute_pipelines(UserRole.VIEWER) == False
        assert PermissionService.can_execute_pipelines(UserRole.EXECUTIVE) == False

    def test_can_access_analytics(self):
        """Test analytics access check."""
        assert PermissionService.can_access_analytics(UserRole.ADMIN) == True
        assert PermissionService.can_access_analytics(UserRole.DEVELOPER) == True
        assert PermissionService.can_access_analytics(UserRole.EXECUTIVE) == True
        assert PermissionService.can_access_analytics(UserRole.DESIGNER) == False
        assert PermissionService.can_access_analytics(UserRole.EXECUTOR) == False
        assert PermissionService.can_access_analytics(UserRole.VIEWER) == False

    def test_can_manage_system(self):
        """Test system management access check."""
        assert PermissionService.can_manage_system(UserRole.ADMIN) == True
        assert PermissionService.can_manage_system(UserRole.DEVELOPER) == True
        assert PermissionService.can_manage_system(UserRole.DESIGNER) == False
        assert PermissionService.can_manage_system(UserRole.EXECUTOR) == False
        assert PermissionService.can_manage_system(UserRole.VIEWER) == False
        assert PermissionService.can_manage_system(UserRole.EXECUTIVE) == False

    def test_navigation_items_admin(self):
        """Test navigation items for Admin role."""
        nav = PermissionService.get_navigation_items(UserRole.ADMIN)

        assert nav["dashboard"] == True
        assert nav["pipelines"] == True
        assert nav["connectors"] == True
        assert nav["monitoring"] == True
        assert nav["analytics"] == True
        assert nav["users"] == True
        assert nav["maintenance"] == True
        assert nav["activity_logs"] == True

    def test_navigation_items_viewer(self):
        """Test navigation items for Viewer role."""
        nav = PermissionService.get_navigation_items(UserRole.VIEWER)

        assert nav["dashboard"] == True
        assert nav["pipelines"] == True
        assert nav["monitoring"] == True
        assert nav["users"] == False
        assert nav["maintenance"] == False
        assert nav["analytics"] == False

    def test_feature_access_structure(self):
        """Test that feature access returns proper structure."""
        features = PermissionService.get_feature_access(UserRole.DESIGNER)

        assert "users" in features
        assert "pipelines" in features
        assert "connectors" in features
        assert "transformations" in features
        assert "monitoring" in features
        assert "analytics" in features
        assert "system" in features

        # Designer can create pipelines
        assert features["pipelines"]["create"] == True
        assert features["pipelines"]["edit"] == True
        # But cannot execute
        assert features["pipelines"]["execute"] == False

        # Designer cannot manage users
        assert features["users"]["create"] == False
        assert features["users"]["edit"] == False

    def test_can_modify_target_user_admin_protection(self):
        """Test that Developer cannot modify admin user."""
        # Developer cannot modify admin user
        assert PermissionService.can_modify_target_user(
            UserRole.DEVELOPER, "admin", "developer_user"
        ) == False

        # Developer can modify other users
        assert PermissionService.can_modify_target_user(
            UserRole.DEVELOPER, "test_user", "developer_user"
        ) == True

        # Admin can modify admin user
        assert PermissionService.can_modify_target_user(
            UserRole.ADMIN, "admin", "admin"
        ) == True
