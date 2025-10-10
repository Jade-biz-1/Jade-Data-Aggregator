"""
Inactive User Middleware
Blocks API access for inactive users
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class InactiveUserMiddleware(BaseHTTPMiddleware):
    """
    Middleware to block inactive users from accessing protected endpoints
    Allows access to login, logout, and health check endpoints
    """

    # Endpoints that don't require active user status
    ALLOWED_PATHS = [
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/logout",
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
    ]

    async def dispatch(self, request: Request, call_next):
        # Check if path is in allowed list
        path = request.url.path
        if any(path.startswith(allowed) for allowed in self.ALLOWED_PATHS):
            return await call_next(request)

        # Skip check for non-API paths
        if not path.startswith("/api/"):
            return await call_next(request)

        # Get user from request state (set by auth middleware)
        user = getattr(request.state, "user", None)

        if user and not user.is_active:
            logger.warning(f"Inactive user {user.username} attempted to access {path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Your account is inactive. Please contact the administrator.",
                    "admin_contact": "admin@dataaggregator.local",
                    "is_active": False
                }
            )

        return await call_next(request)
