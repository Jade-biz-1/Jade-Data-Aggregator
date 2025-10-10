from fastapi import APIRouter
from backend.api.v1.endpoints import (
    auth, users, pipelines, connectors, transformations,
    monitoring, analytics, dashboard, pipeline_execution, websocket, pipeline_builder,
    analytics_advanced, schema, configuration, pipeline_templates, pipeline_versions, transformation_functions,
    logs, alerts, search, health, preferences, dashboards, admin
)


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pipelines.router, prefix="/pipelines", tags=["pipelines"])
api_router.include_router(pipeline_execution.router, prefix="/pipelines", tags=["pipeline-execution"])
api_router.include_router(pipeline_builder.router, prefix="/pipeline-builder", tags=["pipeline-builder"])
api_router.include_router(pipeline_templates.router, prefix="/pipeline-templates", tags=["pipeline-templates"])
api_router.include_router(pipeline_versions.router, prefix="/pipeline-versions", tags=["pipeline-versions"])
api_router.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
api_router.include_router(transformations.router, prefix="/transformations", tags=["transformations"])
api_router.include_router(transformation_functions.router, prefix="/transformation-functions", tags=["transformation-functions"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(analytics_advanced.router, prefix="/analytics/advanced", tags=["analytics-advanced"])
api_router.include_router(schema.router, prefix="/schema", tags=["schema"])
api_router.include_router(configuration.router, prefix="/configuration", tags=["configuration"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(logs.router, tags=["logs"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(search.router, tags=["search"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(websocket.router, tags=["websocket"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["dashboards"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])