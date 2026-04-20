import uuid

import pytest


@pytest.mark.asyncio
async def test_health_endpoint_security_headers(test_client):
    response = await test_client.get("/health")
    assert response.status_code == 200
    assert response.json()["security"] == "active"
    assert "X-Content-Type-Options" in response.headers
    assert "Content-Security-Policy" in response.headers
    assert "Strict-Transport-Security" in response.headers


@pytest.mark.asyncio
async def test_login_rate_limiting(test_client):
    url = "/api/v1/auth/login"
    for _ in range(5):
        response = await test_client.post(url, data={"username": "unknown", "password": "wrong"})
        assert response.status_code != 429

    response = await test_client.post(url, data={"username": "unknown", "password": "wrong"})
    assert response.status_code == 429
    assert response.headers.get("X-RateLimit-Limit") == "5"
    assert response.headers.get("X-RateLimit-Remaining") == "0"


@pytest.mark.asyncio
async def test_csrf_protection_on_password_reset(test_client):
    response = await test_client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 403
    assert "CSRF token missing or invalid" in response.text


