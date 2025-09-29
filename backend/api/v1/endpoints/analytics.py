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


@router.get("/data")
async def get_analytics_data(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get overall analytics data
    """
    # Get pipeline counts
    total_pipelines = await db.execute(select(func.count(Pipeline.id)))
    total_count = total_pipelines.scalar() or 0

    active_pipelines = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_count = active_pipelines.scalar() or 0

    # Get connector and transformation counts
    connectors_result = await db.execute(select(func.count(Connector.id)))
    connectors_count = connectors_result.scalar() or 0

    transformations_result = await db.execute(select(func.count(Transformation.id)))
    transformations_count = transformations_result.scalar() or 0

    # Mock data for metrics that would come from pipeline execution logs
    # In a real implementation, these would be calculated from actual run data
    total_processed = 45230000
    avg_processing_time = 245  # seconds
    success_rate = 98.7
    failed_pipelines = max(0, total_count - active_count)

    return {
        "totalProcessed": total_processed,
        "avgProcessingTime": avg_processing_time,
        "successRate": success_rate,
        "activePipelines": active_count,
        "failedPipelines": failed_pipelines,
        "dataSources": connectors_count,
        "dataDestinations": transformations_count,  # Using transformations as a proxy
        "totalPipelines": total_count
    }


@router.get("/timeseries")
async def get_time_series_data(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db),
    days: int = 7
) -> List[Dict[str, Any]]:
    """
    Get time series data for charts
    """
    # In a real implementation, this would query actual pipeline execution logs
    # For now, we'll generate realistic mock data based on the number of active pipelines

    active_pipelines_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_count = active_pipelines_result.scalar() or 0

    time_series_data = []
    base_volume = max(1000000, active_count * 500000)  # Base volume proportional to active pipelines

    for i in range(days):
        date = datetime.now() - timedelta(days=days - 1 - i)
        # Add some realistic variation
        import random
        variation = random.uniform(0.8, 1.2)
        records = int(base_volume * variation)

        time_series_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "records": records
        })

    return time_series_data


@router.get("/top-pipelines")
async def get_top_pipelines(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db),
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Get top performing pipelines
    """
    pipelines_result = await db.execute(
        select(Pipeline.id, Pipeline.name, Pipeline.is_active).limit(limit)
    )
    pipelines = pipelines_result.fetchall()

    top_pipelines = []
    for pipeline_id, name, is_active in pipelines:
        # In a real implementation, these metrics would come from pipeline execution logs
        import random

        records = random.randint(1000000, 50000000)
        success_rate = random.uniform(90.0, 100.0) if is_active else random.uniform(70.0, 95.0)

        top_pipelines.append({
            "name": name,
            "records": records,
            "successRate": round(success_rate, 1)
        })

    # Sort by records processed (descending)
    top_pipelines.sort(key=lambda x: x["records"], reverse=True)

    return top_pipelines[:limit]


@router.get("/pipeline-trends")
async def get_pipeline_trends(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get pipeline performance trends
    """
    # Get current counts
    total_result = await db.execute(select(func.count(Pipeline.id)))
    current_total = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    current_active = active_result.scalar() or 0

    # Mock historical data for trends
    # In a real implementation, this would come from historical pipeline metrics

    return {
        "pipeline_growth": {
            "current": current_total,
            "previous_month": max(0, current_total - 2),
            "change_percent": 12.5 if current_total > 2 else 0
        },
        "success_rate_trend": {
            "current": 98.7,
            "previous_month": 97.2,
            "change_percent": 1.5
        },
        "data_volume_trend": {
            "current": 45230000,
            "previous_month": 38200000,
            "change_percent": 18.4
        }
    }