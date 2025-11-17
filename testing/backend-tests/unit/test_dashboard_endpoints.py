import pytest
from httpx import AsyncClient


class TestDashboardEndpoints:
    """Test suite for dashboard API endpoints."""

    async def test_get_dashboard_stats_unauthorized(self, test_client: AsyncClient):
        """Test that dashboard stats endpoint requires authentication."""
        response = await test_client.get("/api/v1/dashboard/stats")
        assert response.status_code == 401

    async def test_get_recent_activity_unauthorized(self, test_client: AsyncClient):
        """Test that recent activity endpoint requires authentication."""
        response = await test_client.get("/api/v1/dashboard/recent-activity")
        assert response.status_code == 401

    async def test_get_system_status_unauthorized(self, test_client: AsyncClient):
        """Test that system status endpoint requires authentication."""
        response = await test_client.get("/api/v1/dashboard/system-status")
        assert response.status_code == 401

    async def test_get_performance_metrics_unauthorized(self, test_client: AsyncClient):
        """Test that performance metrics endpoint requires authentication."""
        response = await test_client.get("/api/v1/dashboard/performance-metrics")
        assert response.status_code == 401

    @pytest.mark.parametrize("endpoint", [
        "/api/v1/dashboard/stats",
        "/api/v1/dashboard/recent-activity",
        "/api/v1/dashboard/system-status",
        "/api/v1/dashboard/performance-metrics"
    ])
    async def test_dashboard_endpoints_exist(self, test_client: AsyncClient, endpoint: str):
        """Test that all dashboard endpoints exist (return 401, not 404)."""
        response = await test_client.get(endpoint)
        assert response.status_code != 404, f"Endpoint {endpoint} not found"