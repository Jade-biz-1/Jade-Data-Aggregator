from fastapi import APIRouter
from backend.api.v1.endpoints import (
    auth, users, pipelines, connectors, transformations,
    monitoring, analytics, dashboard, pipeline_execution
)


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pipelines.router, prefix="/pipelines", tags=["pipelines"])
api_router.include_router(pipeline_execution.router, prefix="/pipelines", tags=["pipeline-execution"])
api_router.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
api_router.include_router(transformations.router, prefix="/transformations", tags=["transformations"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])