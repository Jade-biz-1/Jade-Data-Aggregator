import pytest
import redis
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

from backend.core.config import settings
from backend.core.error_handler import add_exception_handlers
from backend.middleware.csrf import CSRFMiddleware
from backend.middleware.input_validation import validate_request_data
from backend.middleware.rate_limiting import rate_limit_middleware
from backend.middleware.security_headers import add_security_headers


class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str


@pytest.fixture
def client():
    app = FastAPI()
    redis_client = redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
    )
    redis_client.flushdb()
    app.state.redis = redis_client

    app.add_middleware(BaseHTTPMiddleware, dispatch=add_security_headers)
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)
    app.add_middleware(BaseHTTPMiddleware, dispatch=validate_request_data)
    app.add_middleware(CSRFMiddleware)
    add_exception_handlers(app)

    @app.get("/api/v1/health/live")
    async def health_live():
        return {"status": "ok"}

    @app.post("/api/v1/auth/login")
    async def login():
        return {"access_token": "test", "token_type": "bearer"}

    @app.post("/api/v1/auth/register")
    async def register(payload: RegisterPayload):
        return {"username": payload.username, "email": payload.email}

    @app.post("/api/v1/auth/password-reset/request")
    async def password_reset_request():
        return {"status": "ok"}

    return TestClient(app, raise_server_exceptions=False)


def test_security_headers(client):
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert "Content-Security-Policy" in response.headers
    assert "X-Content-Type-Options" in response.headers
    assert "Strict-Transport-Security" in response.headers


def test_rate_limiting(client):
    url = "/api/v1/auth/login"

    for _ in range(5):
        response = client.post(url, data={"username": "unknown", "password": "wrong"})
        assert response.status_code != 429

    response = client.post(url, data={"username": "unknown", "password": "wrong"})
    assert response.status_code == 429
    assert response.headers.get("X-RateLimit-Limit") == "5"
    assert response.headers.get("X-RateLimit-Remaining") == "0"


def test_input_validation(client):
    response = client.post(
        "/api/v1/auth/register",
        data="not json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
    assert "Validation error" in response.text


def test_csrf_protection(client):
    response = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 403
    assert "CSRF token missing or invalid" in response.text
