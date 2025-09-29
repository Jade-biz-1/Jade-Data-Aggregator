"""Session timeout middleware to handle automatic session expiration."""

import time
from typing import Optional
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from backend.core.config import settings


class SessionTimeoutMiddleware(BaseHTTPMiddleware):
    """Middleware to handle session timeouts."""

    def __init__(self, app, timeout_minutes: int = 60):
        super().__init__(app)
        self.timeout_seconds = timeout_minutes * 60
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"

    async def dispatch(self, request: Request, call_next):
        """Process request and check for session timeout."""

        # Skip timeout check for auth endpoints
        if request.url.path.startswith("/api/v1/auth/"):
            return await call_next(request)

        # Get authorization header
        authorization: Optional[str] = request.headers.get("Authorization")

        if not authorization or not authorization.startswith("Bearer "):
            # No token, let the endpoint handle authentication
            return await call_next(request)

        token = authorization.split(" ")[1]

        try:
            # Decode token to get expiration
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )

            exp = payload.get("exp")
            if exp:
                current_time = time.time()
                # Check if token is about to expire (within 5 minutes)
                if exp - current_time < 300:  # 5 minutes
                    response = JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "detail": "Session is about to expire",
                            "code": "SESSION_EXPIRING",
                            "expires_in": int(exp - current_time)
                        }
                    )
                    response.headers["X-Session-Warning"] = "EXPIRING"
                    return response

                # Check if token is expired
                if current_time >= exp:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "detail": "Session has expired",
                            "code": "SESSION_EXPIRED"
                        }
                    )

        except JWTError:
            # Invalid token, let the endpoint handle it
            pass

        # Continue with the request
        response = await call_next(request)

        # Add session info to response headers
        if authorization:
            try:
                payload = jwt.decode(
                    token, self.secret_key, algorithms=[self.algorithm]
                )
                exp = payload.get("exp")
                if exp:
                    current_time = time.time()
                    remaining_time = int(exp - current_time)
                    response.headers["X-Session-Remaining"] = str(remaining_time)

                    # Warning if less than 10 minutes remaining
                    if remaining_time < 600:
                        response.headers["X-Session-Warning"] = "LOW"

            except JWTError:
                pass

        return response