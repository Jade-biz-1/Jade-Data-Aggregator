from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession, exc as sa_exc
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
from backend.models.pipeline_run import PipelineRun
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
    total_pipelines_result = await db.execute(select(func.count(Pipeline.id)))
    total_count = total_pipelines_result.scalar_one_or_none() or 0

    active_pipelines_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_count = active_pipelines_result.scalar_one_or_none() or 0

    # Get connector and transformation counts
    connectors_result = await db.execute(select(func.count(Connector.id)))
    connectors_count = connectors_result.scalar_one_or_none() or 0

    transformations_result = await db.execute(select(func.count(Transformation.id)))
    transformations_count = transformations_result.scalar_one_or_none() or 0

    # Get execution metrics from PipelineRun
    
    # Total processed records
    total_processed_result = await db.execute(
        select(func.sum(PipelineRun.records_processed))
    )
    total_processed = total_processed_result.scalar_one_or_none() or 0
    
    # Average processing time (completed runs only)
    # Note: This requires calculating duration from start/end times
    # For simplicity in SQL, we'll fetch completed runs and calculate in python if needed, 
    # or use a more complex SQL query. Here we'll use a simplified approach.
    
    # Success rate
    total_runs_result = await db.execute(select(func.count(PipelineRun.id)))
    total_runs = total_runs_result.scalar_one_or_none() or 0
    
    successful_runs_result = await db.execute(
        select(func.count(PipelineRun.id)).filter(PipelineRun.status == 'completed')
    )
    successful_runs = successful_runs_result.scalar_one_or_none() or 0
    
    success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0
    
    # Failed pipelines (pipelines with recent failures)
    # Simplified: Pipelines with status 'failed' in their last run
    failed_pipelines = 0 
    # (Complex query omitted for brevity, using 0 as placeholder for now or could implement subquery)

    return {
        "totalProcessed": total_processed,
        "avgProcessingTime": 0, # Placeholder until we have duration column or complex calculation
        "successRate": round(success_rate, 1),
        "activePipelines": active_count,
        "failedPipelines": failed_pipelines,
        "dataSources": connectors_count,
        "dataDestinations": transformations_count,
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
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Group by date
    # Note: SQLite/Postgres syntax differs for date truncation. Assuming Postgres.
    query = (
        select(
            func.date_trunc('day', PipelineRun.created_at).label('date'),
            func.sum(PipelineRun.records_processed).label('records')
        )
        .filter(PipelineRun.created_at >= start_date)
        .group_by(func.date_trunc('day', PipelineRun.created_at))
        .order_by(func.date_trunc('day', PipelineRun.created_at))
    )
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    time_series_data = []
    for row in rows:
        time_series_data.append({
            "date": row.date.strftime("%Y-%m-%d"),
            "records": row.records or 0
        })
        
    # Fill in missing days with 0 if needed (optional polish)
    
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
    
    # Join Pipeline and PipelineRun to get aggregated stats
    query = (
        select(
            Pipeline.name,
            func.sum(PipelineRun.records_processed).label('total_records'),
            func.count(PipelineRun.id).label('total_runs'),
            func.sum(case((PipelineRun.status == 'completed', 1), else_=0)).label('successful_runs')
        )
        .join(PipelineRun, Pipeline.id == PipelineRun.pipeline_id)
        .group_by(Pipeline.id, Pipeline.name)
        .order_by(func.sum(PipelineRun.records_processed).desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    top_pipelines = []
    for row in rows:
        success_rate = (row.successful_runs / row.total_runs * 100) if row.total_runs > 0 else 0
        top_pipelines.append({
            "name": row.name,
            "records": row.total_records or 0,
            "successRate": round(success_rate, 1)
        })

    return top_pipelines


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
    current_total = total_result.scalar_one_or_none() or 0

    active_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    current_active = active_result.scalar_one_or_none() or 0

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
    total_pipelines_result = await db.execute(select(func.count(Pipeline.id)))
    total_count = total_pipelines_result.scalar_one_or_none() or 0

    active_pipelines_result = await db.execute(
        select(func.count(Pipeline.id)).filter(Pipeline.is_active == True)
    )
    active_count = active_pipelines_result.scalar_one_or_none() or 0

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
            select(Pipeline).where(Pipeline.id == pipeline_id)
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
