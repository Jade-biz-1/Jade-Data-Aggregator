import pytest
from httpx import AsyncClient


class TestUsersEndpoints:
    """Test suite for users API endpoints."""

    async def test_get_users_unauthorized(self, test_client: AsyncClient):
        """Test that users list endpoint requires authentication."""
        response = await test_client.get("/api/v1/users/")
        assert response.status_code == 401

    async def test_create_user_unauthorized(self, test_client: AsyncClient, test_user_data):
        """Test that create user endpoint requires authentication."""
        response = await test_client.post("/api/v1/users/", json=test_user_data)
        assert response.status_code == 401

    async def test_get_current_user_unauthorized(self, test_client: AsyncClient):
        """Test that current user endpoint requires authentication."""
        response = await test_client.get("/api/v1/users/me")
        assert response.status_code == 401

    async def test_update_user_unauthorized(self, test_client: AsyncClient):
        """Test that update user endpoint requires authentication."""
        response = await test_client.put("/api/v1/users/1", json={"first_name": "Updated"})
        assert response.status_code == 401

    async def test_delete_user_unauthorized(self, test_client: AsyncClient):
        """Test that delete user endpoint requires authentication."""
        response = await test_client.delete("/api/v1/users/1")
        assert response.status_code == 401

    @pytest.mark.parametrize("method,endpoint,data", [
        ("GET", "/api/v1/users/", None),
        ("POST", "/api/v1/users/", {"email": "test@test.com", "username": "test"}),
        ("GET", "/api/v1/users/me", None),
        ("GET", "/api/v1/users/1", None),
        ("PUT", "/api/v1/users/1", {"first_name": "Test"}),
        ("DELETE", "/api/v1/users/1", None)
    ])
    async def test_users_endpoints_exist(self, test_client: AsyncClient, method: str, endpoint: str, data):
        """Test that all users endpoints exist (return 401, not 404)."""
        if method == "GET":
            response = await test_client.get(endpoint)
        elif method == "POST":
            response = await test_client.post(endpoint, json=data)
        elif method == "PUT":
            response = await test_client.put(endpoint, json=data)
        elif method == "DELETE":
            response = await test_client.delete(endpoint)

        assert response.status_code != 404, f"Endpoint {method} {endpoint} not found"