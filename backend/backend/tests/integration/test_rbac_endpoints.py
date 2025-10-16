"""
Integration tests for RBAC endpoints (Phase 8).
Tests role-based access control across all endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status


class TestRBACEndpoints:
    """Integration tests for role-based access control."""

    @pytest.mark.asyncio
    async def test_viewer_can_view_pipelines(self, async_client: AsyncClient, viewer_token: str):
        """Test that Viewer role can view pipelines."""
        response = await async_client.get(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {viewer_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_viewer_cannot_create_pipeline(self, async_client: AsyncClient, viewer_token: str):
        """Test that Viewer role cannot create pipelines."""
        response = await async_client.post(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {viewer_token}"},
            json={"name": "Test Pipeline", "description": "Test"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_designer_can_create_pipeline(self, async_client: AsyncClient, designer_token: str):
        """Test that Designer role can create pipelines."""
        response = await async_client.post(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {designer_token}"},
            json={
                "name": "Designer Test Pipeline",
                "description": "Created by designer",
                "is_active": True
            }
        )
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    @pytest.mark.asyncio
    async def test_designer_cannot_execute_pipeline(self, async_client: AsyncClient, designer_token: str):
        """Test that Designer role cannot execute pipelines."""
        response = await async_client.post(
            "/api/v1/pipeline-execution/1/execute",
            headers={"Authorization": f"Bearer {designer_token}"},
            json={"triggered_by": "manual"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_executor_can_execute_pipeline(self, async_client: AsyncClient, executor_token: str):
        """Test that Executor role can execute pipelines."""
        response = await async_client.post(
            "/api/v1/pipeline-execution/1/execute",
            headers={"Authorization": f"Bearer {executor_token}"},
            json={"triggered_by": "manual"}
        )
        # May be 200, 201, or 404 if pipeline doesn't exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    @pytest.mark.asyncio
    async def test_executor_cannot_create_pipeline(self, async_client: AsyncClient, executor_token: str):
        """Test that Executor role cannot create pipelines."""
        response = await async_client.post(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {executor_token}"},
            json={"name": "Executor Test", "description": "Should fail"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_executive_can_view_analytics(self, async_client: AsyncClient, executive_token: str):
        """Test that Executive role can view analytics."""
        response = await async_client.get(
            "/api/v1/analytics/data",
            headers={"Authorization": f"Bearer {executive_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_viewer_cannot_view_analytics(self, async_client: AsyncClient, viewer_token: str):
        """Test that Viewer role cannot view analytics."""
        response = await async_client.get(
            "/api/v1/analytics/data",
            headers={"Authorization": f"Bearer {viewer_token}"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_executive_can_export_data(self, async_client: AsyncClient, executive_token: str):
        """Test that Executive role can export analytics data."""
        response = await async_client.get(
            "/api/v1/analytics/export-data?format=json&time_range=7d",
            headers={"Authorization": f"Bearer {executive_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_developer_can_access_cleanup_endpoints(self, async_client: AsyncClient, developer_token: str):
        """Test that Developer role can access cleanup endpoints."""
        response = await async_client.get(
            "/api/v1/admin/cleanup/stats",
            headers={"Authorization": f"Bearer {developer_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_designer_cannot_access_cleanup_endpoints(self, async_client: AsyncClient, designer_token: str):
        """Test that Designer role cannot access cleanup endpoints."""
        response = await async_client.get(
            "/api/v1/admin/cleanup/stats",
            headers={"Authorization": f"Bearer {designer_token}"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_admin_can_manage_users(self, async_client: AsyncClient, admin_token: str):
        """Test that Admin role can manage users."""
        response = await async_client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_developer_can_view_users(self, async_client: AsyncClient, developer_token: str):
        """Test that Developer role can view users."""
        response = await async_client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {developer_token}"}
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_designer_cannot_view_users(self, async_client: AsyncClient, designer_token: str):
        """Test that Designer role cannot view users."""
        response = await async_client.get(
            "/api/v1/users/",
            headers={"Authorization": f"Bearer {designer_token}"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_developer_cannot_modify_admin_user(self, async_client: AsyncClient, developer_token: str):
        """Test that Developer role cannot modify admin user."""
        response = await async_client.put(
            "/api/v1/users/1",  # Assuming admin user ID is 1
            headers={"Authorization": f"Bearer {developer_token}"},
            json={"email": "newemail@test.com"}
        )
        # Should either be forbidden or return specific error
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]

    @pytest.mark.asyncio
    async def test_developer_cannot_reset_admin_password(self, async_client: AsyncClient, developer_token: str):
        """Test that Developer role cannot reset admin user password."""
        response = await async_client.post(
            "/api/v1/users/1/reset-password",
            headers={"Authorization": f"Bearer {developer_token}"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_all_roles_can_view_dashboard(self, async_client: AsyncClient, viewer_token: str,
                                                 designer_token: str, executor_token: str):
        """Test that all roles can view dashboard."""
        for token in [viewer_token, designer_token, executor_token]:
            response = await async_client.get(
                "/api/v1/dashboard/stats",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_all_roles_can_view_monitoring(self, async_client: AsyncClient, viewer_token: str,
                                                   executor_token: str, executive_token: str):
        """Test that all roles can view monitoring."""
        for token in [viewer_token, executor_token, executive_token]:
            response = await async_client.get(
                "/api/v1/monitoring/pipeline-stats",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_unauthenticated_access_denied(self, async_client: AsyncClient):
        """Test that unauthenticated requests are denied."""
        endpoints = [
            "/api/v1/pipelines/",
            "/api/v1/dashboard/stats",
            "/api/v1/analytics/data",
            "/api/v1/users/"
        ]

        for endpoint in endpoints:
            response = await async_client.get(endpoint)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
