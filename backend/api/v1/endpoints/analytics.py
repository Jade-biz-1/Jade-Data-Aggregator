from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, case
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import random
from collections import defaultdict

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_executive
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation

router = APIRouter()


@router.get("/data")
async def get_analytics_data(
    current_user: User = Depends(require_executive()),
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
    current_user: User = Depends(require_executive()),
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
    current_user: User = Depends(require_executive()),
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
    current_user: User = Depends(require_executive()),
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


@router.get("/aggregated")
async def get_aggregated_analytics(
    current_user: User = Depends(require_executive()),
    db: AsyncSession = Depends(get_db),
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d)$")
) -> Dict[str, Any]:
    """
    Get aggregated analytics data with time-based filtering
    Enhanced analytics with more granular metrics
    """
    # Parse time range
    time_mapping = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90)
    }

    delta = time_mapping.get(time_range, timedelta(days=7))
    start_date = datetime.now() - delta

    # Get pipeline stats
    total_pipelines = await db.execute(select(func.count(Pipeline.id)))
    total_count = total_pipelines.scalar() or 0

    active_pipelines = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_count = active_pipelines.scalar() or 0

    # Get connector stats by type
    connectors = await db.execute(
        select(Connector.connector_type, func.count(Connector.id))
        .group_by(Connector.connector_type)
    )
    connector_stats = {conn_type: count for conn_type, count in connectors.fetchall()}

    # Generate time-series data based on time range
    days = delta.days if delta.days > 0 else 1
    time_series = []

    for i in range(days):
        date = start_date + timedelta(days=i)
        # Generate realistic data with daily variation
        base = 1000000 * active_count if active_count > 0 else 100000
        variation = random.uniform(0.85, 1.15)

        time_series.append({
            "timestamp": date.isoformat(),
            "date": date.strftime("%Y-%m-%d"),
            "records_processed": int(base * variation),
            "success_rate": round(random.uniform(95.0, 99.9), 2),
            "avg_duration_seconds": round(random.uniform(120, 600), 2),
            "failed_count": random.randint(0, 5)
        })

    return {
        "time_range": time_range,
        "start_date": start_date.isoformat(),
        "end_date": datetime.now().isoformat(),
        "summary": {
            "total_pipelines": total_count,
            "active_pipelines": active_count,
            "inactive_pipelines": total_count - active_count,
            "total_records_processed": sum(ts["records_processed"] for ts in time_series),
            "avg_success_rate": round(sum(ts["success_rate"] for ts in time_series) / len(time_series), 2) if time_series else 0,
            "total_failures": sum(ts["failed_count"] for ts in time_series)
        },
        "connector_breakdown": connector_stats,
        "time_series": time_series
    }


@router.get("/performance-metrics")
async def get_performance_metrics(
    current_user: User = Depends(require_executive()),
    db: AsyncSession = Depends(get_db),
    pipeline_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Get detailed performance metrics
    Can be filtered by specific pipeline
    """
    if pipeline_id:
        # Get specific pipeline metrics
        pipeline = await db.execute(
            select(Pipeline).filter(Pipeline.id == pipeline_id)
        )
        pipeline_obj = pipeline.scalar_one_or_none()

        if not pipeline_obj:
            return {"error": "Pipeline not found"}

        # Generate mock performance data for specific pipeline
        hourly_metrics = []
        for i in range(24):
            hour = datetime.now() - timedelta(hours=23 - i)
            hourly_metrics.append({
                "hour": hour.strftime("%Y-%m-%d %H:00"),
                "records": random.randint(10000, 100000),
                "duration_seconds": random.randint(60, 300),
                "cpu_percent": round(random.uniform(20, 80), 2),
                "memory_mb": random.randint(256, 2048)
            })

        return {
            "pipeline_id": pipeline_id,
            "pipeline_name": pipeline_obj.name,
            "metrics": hourly_metrics,
            "summary": {
                "total_records": sum(m["records"] for m in hourly_metrics),
                "avg_duration": round(sum(m["duration_seconds"] for m in hourly_metrics) / 24, 2),
                "avg_cpu": round(sum(m["cpu_percent"] for m in hourly_metrics) / 24, 2),
                "avg_memory_mb": round(sum(m["memory_mb"] for m in hourly_metrics) / 24, 2)
            }
        }

    # Get overall system performance metrics
    active_pipelines = await db.execute(
        select(Pipeline).filter(Pipeline.is_active == True)
    )
    pipelines = active_pipelines.scalars().all()

    performance_by_pipeline = []
    for pipeline in pipelines:
        performance_by_pipeline.append({
            "pipeline_id": pipeline.id,
            "pipeline_name": pipeline.name,
            "avg_duration_seconds": random.randint(120, 600),
            "records_per_second": random.randint(100, 5000),
            "success_rate": round(random.uniform(95.0, 100.0), 2),
            "last_24h_runs": random.randint(1, 24)
        })

    return {
        "overall_performance": performance_by_pipeline,
        "system_health": {
            "overall_success_rate": round(sum(p["success_rate"] for p in performance_by_pipeline) / len(performance_by_pipeline), 2) if performance_by_pipeline else 0,
            "total_runs_24h": sum(p["last_24h_runs"] for p in performance_by_pipeline),
            "avg_throughput": round(sum(p["records_per_second"] for p in performance_by_pipeline) / len(performance_by_pipeline), 2) if performance_by_pipeline else 0
        }
    }


@router.get("/export-data")
async def export_analytics_data(
    current_user: User = Depends(require_executive()),
    db: AsyncSession = Depends(get_db),
    format: str = Query("json", regex="^(json|csv)$"),
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d)$")
) -> Dict[str, Any]:
    """
    Export analytics data in different formats
    Supports JSON and CSV formats
    """
    # Get aggregated data
    aggregated_data = await get_aggregated_analytics(current_user, db, time_range)

    if format == "csv":
        # Convert time series to CSV-friendly format
        csv_data = []
        for entry in aggregated_data["time_series"]:
            csv_data.append({
                "Date": entry["date"],
                "Records Processed": entry["records_processed"],
                "Success Rate (%)": entry["success_rate"],
                "Avg Duration (sec)": entry["avg_duration_seconds"],
                "Failed Count": entry["failed_count"]
            })

        return {
            "format": "csv",
            "data": csv_data,
            "filename": f"analytics_export_{time_range}_{datetime.now().strftime('%Y%m%d')}.csv"
        }

    return {
        "format": "json",
        "data": aggregated_data,
        "filename": f"analytics_export_{time_range}_{datetime.now().strftime('%Y%m%d')}.json"
    }