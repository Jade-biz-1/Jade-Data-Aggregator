import pytest
from httpx import AsyncClient


class TestAnalyticsEndpoints:
    """Test suite for analytics API endpoints."""

    async def test_get_analytics_data_unauthorized(self, test_client: AsyncClient):
        """Test that analytics data endpoint requires authentication."""
        response = await test_client.get("/api/v1/analytics/data")
        assert response.status_code == 401

    async def test_get_timeseries_data_unauthorized(self, test_client: AsyncClient):
        """Test that timeseries endpoint requires authentication."""
        response = await test_client.get("/api/v1/analytics/timeseries")
        assert response.status_code == 401

    async def test_get_top_pipelines_unauthorized(self, test_client: AsyncClient):
        """Test that top pipelines endpoint requires authentication."""
        response = await test_client.get("/api/v1/analytics/top-pipelines")
        assert response.status_code == 401

    async def test_get_pipeline_trends_unauthorized(self, test_client: AsyncClient):
        """Test that pipeline trends endpoint requires authentication."""
        response = await test_client.get("/api/v1/analytics/pipeline-trends")
        assert response.status_code == 401

    @pytest.mark.parametrize("endpoint", [
        "/api/v1/analytics/data",
        "/api/v1/analytics/timeseries",
        "/api/v1/analytics/top-pipelines",
        "/api/v1/analytics/pipeline-trends"
    ])
    async def test_analytics_endpoints_exist(self, test_client: AsyncClient, endpoint: str):
        """Test that all analytics endpoints exist (return 401, not 404)."""
        response = await test_client.get(endpoint)
        assert response.status_code != 404, f"Endpoint {endpoint} not found"