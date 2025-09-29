from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v1.api import api_router
from backend.core.config import settings
from backend.core.security import get_current_active_user
from backend.schemas.user import User
from backend.core.database import engine, Base
from backend.middleware.session_timeout import SessionTimeoutMiddleware
# Import all models to register them with SQLAlchemy
from backend import models
from backend.models import pipeline_run, auth_token


def create_app():
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION
    )

    # Add session timeout middleware
    app.add_middleware(SessionTimeoutMiddleware, timeout_minutes=60)

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

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()


@app.get("/")
async def root():
    return {"message": "Welcome to the Data Aggregator Platform API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)