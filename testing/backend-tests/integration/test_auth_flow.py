import pytest
from httpx import AsyncClient
from backend.crud import user as crud_user
from backend.schemas.user import UserCreate


class TestAuthenticationFlow:
    """Integration tests for authentication flow."""

    async def test_full_auth_flow(self, test_client: AsyncClient, test_session, test_user_data):
        """Test complete authentication flow: create user, login, access protected endpoint."""

        # Step 1: Create a test user directly in database
        user_create = UserCreate(**test_user_data)
        db_user = await crud_user.create(test_session, obj_in=user_create)
        assert db_user is not None
        assert db_user.email == test_user_data["email"]

        # Step 2: Login with the created user
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }

        login_response = await test_client.post("/api/v1/auth/login", data=login_data)
        assert login_response.status_code == 200

        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # Step 3: Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # Test accessing current user endpoint
        user_response = await test_client.get("/api/v1/users/me", headers=headers)
        assert user_response.status_code == 200

        user_data = user_response.json()
        assert user_data["email"] == test_user_data["email"]
        assert user_data["username"] == test_user_data["username"]

    async def test_invalid_login(self, test_client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpassword"
        }

        response = await test_client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401

    async def test_protected_endpoint_without_token(self, test_client: AsyncClient):
        """Test accessing protected endpoint without authentication token."""
        response = await test_client.get("/api/v1/users/me")
        assert response.status_code == 401

    async def test_protected_endpoint_with_invalid_token(self, test_client: AsyncClient):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await test_client.get("/api/v1/users/me", headers=headers)
        assert response.status_code in [401, 422]  # Could be 422 for malformed JWT