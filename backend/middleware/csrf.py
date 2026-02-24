"""
FEAT-003: CSRF Protection Middleware

Implements the double-submit cookie pattern:
  1. The frontend obtains a CSRF token from GET /api/v1/auth/csrf-token.
     The backend sets the token in a readable (non-HttpOnly) cookie named
     ``csrf_token`` and also returns it in the JSON body.
  2. The frontend JavaScript reads the cookie and attaches the value as the
     ``X-CSRF-Token`` request header on every state-changing request
     (POST / PUT / PATCH / DELETE).
  3. This middleware validates that the header value matches the cookie value.
     An attacker on a different origin cannot read the cookie (same-origin
     restriction), so they cannot forge the header.

Exempt paths (do not require CSRF validation):
  - GET / HEAD / OPTIONS requests (read-only)
  - /api/v1/auth/login     — form-based; no prior CSRF token available
  - /api/v1/auth/register  — same reason
  - /health*               — public health-check endpoints
  - /docs / /openapi.json  — API documentation
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Paths that are exempt from CSRF checking.
_EXEMPT_PREFIXES = (
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/csrf-token",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
)

# HTTP methods that mutate state and therefore require a CSRF token.
_PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Validate X-CSRF-Token header against the csrf_token cookie for all
    state-changing requests.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Only validate state-changing methods.
        if request.method not in _PROTECTED_METHODS:
            return await call_next(request)

        # Skip exempt paths.
        for prefix in _EXEMPT_PREFIXES:
            if request.url.path.startswith(prefix):
                return await call_next(request)

        # Read token from cookie and from request header.
        cookie_token: str | None = request.cookies.get("csrf_token")
        header_token: str | None = request.headers.get("X-CSRF-Token")

        if not cookie_token or not header_token or cookie_token != header_token:
            from starlette.responses import JSONResponse

            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing or invalid"},
            )

        return await call_next(request)
