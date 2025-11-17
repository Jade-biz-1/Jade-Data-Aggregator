import pytest
from httpx import AsyncClient


class TestMonitoringEndpoints:
    """Test suite for monitoring API endpoints."""

    async def test_get_pipeline_stats_unauthorized(self, test_client: AsyncClient):
        """Test that pipeline stats endpoint requires authentication."""
        response = await test_client.get("/api/v1/monitoring/pipeline-stats")
        assert response.status_code == 401

    async def test_get_recent_alerts_unauthorized(self, test_client: AsyncClient):
        """Test that alerts endpoint requires authentication."""
        response = await test_client.get("/api/v1/monitoring/alerts")
        assert response.status_code == 401

    async def test_get_pipeline_performance_unauthorized(self, test_client: AsyncClient):
        """Test that pipeline performance endpoint requires authentication."""
        response = await test_client.get("/api/v1/monitoring/pipeline-performance")
        assert response.status_code == 401

    async def test_get_system_health_unauthorized(self, test_client: AsyncClient):
        """Test that system health endpoint requires authentication."""
        response = await test_client.get("/api/v1/monitoring/system-health")
        assert response.status_code == 401

    @pytest.mark.parametrize("endpoint", [
        "/api/v1/monitoring/pipeline-stats",
        "/api/v1/monitoring/alerts",
        "/api/v1/monitoring/pipeline-performance",
        "/api/v1/monitoring/system-health"
    ])
    async def test_monitoring_endpoints_exist(self, test_client: AsyncClient, endpoint: str):
        """Test that all monitoring endpoints exist (return 401, not 404)."""
        response = await test_client.get(endpoint)
        assert response.status_code != 404, f"Endpoint {endpoint} not found"