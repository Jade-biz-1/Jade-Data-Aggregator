from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import redis

from backend.api.v1.api import api_router
from backend.core.config import settings
from backend.core.security import get_current_active_user
from backend.schemas.user import User
from backend.core.database import engine, Base, get_db
from backend.middleware.session_timeout import SessionTimeoutMiddleware
from backend.middleware.security_headers import add_security_headers
from backend.middleware.rate_limiting import rate_limit_middleware
from backend.middleware.admin_protection import apply_admin_protection
from backend.middleware.dev_role_protection import apply_dev_role_protection
from backend.middleware.input_validation import validate_request_data
from backend.core.init_db import init_db
# Import all models to register them with SQLAlchemy
from backend import models
from backend.models import pipeline_run, auth_token


def create_app():
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION
    )

    # Initialize Redis client for rate limiting
    try:
        redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5
        )
        # Test connection
        redis_client.ping()
        app.state.redis = redis_client
        print(f"✅ Redis connected successfully: {settings.REDIS_URL}")
    except Exception as e:
        print(f"⚠️  Warning: Redis connection failed: {e}")
        print(f"⚠️  Rate limiting will be degraded (allowing all requests)")
        app.state.redis = None

    # ============================================
    # SECURITY MIDDLEWARE (Phase 11A - SEC-001)
    # ============================================

    # 1. Security Headers Middleware
    # Adds CSP, XSS Protection, HSTS, etc.
    app.add_middleware(BaseHTTPMiddleware, dispatch=add_security_headers)

    # 2. Rate Limiting Middleware
    # Prevents brute force attacks, requires Redis
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

    # 3. Input Validation Middleware
    # Blocks SQL injection and XSS attempts
    app.add_middleware(BaseHTTPMiddleware, dispatch=validate_request_data)

    # 4. Session Timeout Middleware (already active)
    app.add_middleware(SessionTimeoutMiddleware, timeout_minutes=60)

    # 5. Admin User Protection Middleware (Phase 8)
    app.add_middleware(BaseHTTPMiddleware, dispatch=apply_admin_protection)

    # 6. Developer Role in Production Protection Middleware (Phase 8)
    app.add_middleware(BaseHTTPMiddleware, dispatch=apply_dev_role_protection)

    # Set all CORS enabled origins
    if settings.cors_origins_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.on_event("startup")
    async def startup_event():
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Initialize database with default data (admin user, etc.)
        async for db in get_db():
            try:
                await init_db(db)
            finally:
                await db.close()
            break  # Only run once

        print("🚀 Data Aggregator Platform API started successfully")
        print(f"📚 API Documentation: http://localhost:8001/docs")
        print(f"🔒 Security middleware: ACTIVE")
        print(f"🛡️  Rate limiting: {'ACTIVE' if app.state.redis else 'DEGRADED (Redis unavailable)'}")

    @app.on_event("shutdown")
    async def shutdown_event():
        # Close Redis connection
        if app.state.redis:
            app.state.redis.close()
            print("✅ Redis connection closed")

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "redis": "connected" if app.state.redis else "disconnected",
            "security": "active"
        }

    return app


app = create_app()


@app.get("/")
async def root():
    return {"message": "Welcome to the Data Aggregator Platform API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)