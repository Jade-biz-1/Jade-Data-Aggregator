from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Dict, List, Any
from datetime import datetime, timedelta

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.core.rbac import require_any_authenticated
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation

router = APIRouter()


@router.get("/pipeline-stats")
async def get_pipeline_stats(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get pipeline statistics for monitoring dashboard
    """
    # Get total pipelines
    total_result = await db.execute(select(func.count(Pipeline.id)))
    total_pipelines = total_result.scalar() or 0

    # Get active pipelines
    active_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_pipelines = active_result.scalar() or 0

    # For now, we'll use mock data for running/failed counts since we don't have execution tracking yet
    # In a real implementation, this would come from a pipeline_runs table
    running_pipelines = max(0, min(3, active_pipelines))  # Mock: up to 3 running
    failed_pipelines = max(0, min(1, total_pipelines - active_pipelines))  # Mock: some failed

    # Mock execution statistics - these would come from actual pipeline run records
    successful_runs = 2456
    failed_runs = 45
    records_processed = 45230000

    return {
        "totalPipelines": total_pipelines,
        "activePipelines": active_pipelines,
        "runningPipelines": running_pipelines,
        "failedPipelines": failed_pipelines,
        "successfulRuns": successful_runs,
        "failedRuns": failed_runs,
        "recordsProcessed": records_processed,
    }


@router.get("/alerts")
async def get_recent_alerts(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get recent alerts and notifications
    """
    # In a real implementation, this would come from an alerts/notifications table
    # For now, we'll return mock data based on actual pipelines

    pipelines_result = await db.execute(select(Pipeline.name, Pipeline.is_active))
    pipelines = pipelines_result.fetchall()

    alerts = []
    alert_id = 1

    # Generate some mock alerts based on actual pipelines
    for pipeline_name, is_active in pipelines:
        if not is_active:
            alerts.append({
                "id": alert_id,
                "message": f'Pipeline "{pipeline_name}" is currently inactive',
                "type": "warning",
                "timestamp": datetime.now() - timedelta(hours=2),
                "pipeline": pipeline_name
            })
            alert_id += 1

    # Add some general system alerts
    alerts.extend([
        {
            "id": alert_id,
            "message": "System health check completed successfully",
            "type": "info",
            "timestamp": datetime.now() - timedelta(minutes=30),
            "pipeline": "System"
        },
        {
            "id": alert_id + 1,
            "message": "Database connection pool optimized",
            "type": "success",
            "timestamp": datetime.now() - timedelta(hours=1),
            "pipeline": "System"
        }
    ])

    # Sort by timestamp (most recent first) and limit to 10
    alerts.sort(key=lambda x: x["timestamp"], reverse=True)
    return alerts[:10]


@router.get("/pipeline-performance")
async def get_pipeline_performance(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get pipeline performance metrics
    """
    pipelines_result = await db.execute(
        select(Pipeline.id, Pipeline.name, Pipeline.is_active)
    )
    pipelines = pipelines_result.fetchall()

    performance_data = []
    for pipeline_id, pipeline_name, is_active in pipelines:
        # In a real implementation, these metrics would be calculated from pipeline run history
        # For now, we'll generate realistic mock data

        import random

        # Generate mock performance data
        avg_processing_time = random.randint(60, 600)  # 1-10 minutes
        avg_data_volume = random.randint(1000, 50000)  # Records processed
        success_rate = random.uniform(85.0, 100.0) if is_active else random.uniform(60.0, 90.0)

        status = "running" if is_active and random.choice([True, False]) else (
            "active" if is_active else "failed"
        )

        performance_data.append({
            "id": pipeline_id,
            "name": pipeline_name,
            "avgProcessingTime": avg_processing_time,
            "avgDataVolume": avg_data_volume,
            "successRate": round(success_rate, 1),
            "status": status
        })

    return performance_data


@router.get("/system-health")
async def get_system_health(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get system health status
    """
    # In a real implementation, this would check actual system components
    # For now, we'll return a mix of healthy and one degraded service

    return {
        "services": {
            "api": {"status": "operational", "uptime": "99.9%"},
            "database": {"status": "connected", "connections": 12},
            "messageQueue": {"status": "healthy", "messages": 0},
            "fileStorage": {"status": "degraded", "usage": "78%"},
            "cacheService": {"status": "available", "hit_rate": "94%"}
        },
        "overall_status": "operational",
        "last_check": datetime.now()
    }