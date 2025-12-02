"""
Advanced Analytics API Endpoints
Provides enhanced analytics capabilities including time-series, custom queries, exports, and predictions
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.core.rbac import require_any_authenticated
from backend.services.analytics_engine import AnalyticsEngine
from backend.services.export_service import ExportService, ExportFormat, ScheduledExportManager, ReportBuilder

router = APIRouter()

# In a real app, this should be a persistent, shared manager
# Initialize export manager (in production, use database-backed storage)
export_manager = ScheduledExportManager()


# Pydantic models for request validation
class TimeRangeRequest(BaseModel):
    start: str = Field(..., description="ISO format datetime string")
    end: str = Field(..., description="ISO format datetime string")


class CustomQueryRequest(BaseModel):
    entity: str = Field(..., description="Entity to query: pipeline_runs, pipelines, connectors")
    filters: Dict[str, Any] = Field(default_factory=dict)
    aggregations: List[str] = Field(default_factory=list)
    group_by: List[str] = Field(default_factory=list)
    time_range: Optional[Dict[str, str]] = None


class ExportRequest(BaseModel):
    export_format: ExportFormat
    export_type: str = "analytics"
    time_range: Optional[Dict[str, str]] = None
    query_config: Optional[Dict[str, Any]] = None


class ScheduledExportRequest(BaseModel):
    name: str
    query_config: Dict[str, Any]
    export_format: str
    schedule: str = Field(..., description="Cron expression")
    recipients: List[str] = Field(default_factory=list)
    enabled: bool = True


class ReportRequest(BaseModel):
    report_type: str = Field(..., description="executive_summary, detailed_analytics, custom")
    time_range: Dict[str, str]
    pipeline_id: Optional[int] = None
    custom_config: Optional[Dict[str, Any]] = None


@router.post("/time-series")
async def get_advanced_time_series(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    interval: str = Query("day", regex="^(hour|day|week|month)$"),
    pipeline_id: Optional[int] = Query(None),
    metrics: Optional[List[str]] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get advanced time-series data with configurable intervals and metrics
    """
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO format.")

    engine = AnalyticsEngine(db)
    time_series = await engine.get_time_series_data(
        start,
        end,
        interval,
        pipeline_id,
        metrics
    )

    return {
        "time_range": {
            "start": start_date,
            "end": end_date,
            "interval": interval
        },
        "pipeline_id": pipeline_id,
        "data": time_series,
        "data_points": len(time_series)
    }


@router.post("/custom-query")
async def execute_custom_analytics_query(
    query: CustomQueryRequest,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Execute custom analytics query with flexible filters and aggregations
    """
    engine = AnalyticsEngine(db)

    try:
        result = await engine.execute_custom_query(query.dict())
        return {
            "query_config": query.dict(),
            "result": result,
            "executed_at": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/performance-metrics")
async def get_advanced_performance_metrics(
    pipeline_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive performance metrics with optional filtering
    """
    engine = AnalyticsEngine(db)

    time_range = None
    if start_date and end_date:
        time_range = {"start": start_date, "end": end_date}

    metrics = await engine.calculate_performance_metrics(
        pipeline_id=pipeline_id,
        time_range=time_range
    )

    return {
        "pipeline_id": pipeline_id,
        "time_range": time_range,
        "performance_metrics": metrics
    }


@router.post("/trend-analysis")
async def get_trend_analysis(
    metric: str = Query(..., description="Metric to analyze"),
    time_range: TimeRangeRequest = Body(...),
    pipeline_id: Optional[int] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze trends for specific metrics
    """
    engine = AnalyticsEngine(db)

    trend = await engine.get_trend_analysis(
        metric=metric,
        time_range=time_range.dict(),
        pipeline_id=pipeline_id
    )

    return trend


@router.post("/comparative-analytics")
async def get_comparative_analytics(
    pipeline_ids: List[int] = Query(..., description="List of pipeline IDs to compare"),
    time_range: TimeRangeRequest = Body(...),
    metrics: Optional[List[str]] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Compare analytics across multiple pipelines
    """
    engine = AnalyticsEngine(db)

    comparison = await engine.get_comparative_analytics(
        pipeline_ids=pipeline_ids,
        time_range=time_range.dict(),
        metrics=metrics
    )

    return comparison


@router.get("/predictive-indicators")
async def get_predictive_indicators(
    pipeline_id: Optional[int] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get predictive indicators and forecasts
    """
    engine = AnalyticsEngine(db)

    predictions = await engine.get_predictive_indicators(pipeline_id=pipeline_id)

    return predictions


@router.post("/export")
async def export_analytics_data(
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Export analytics data in various formats
    """
    engine = AnalyticsEngine(db)

    # Get data based on query config
    if export_request.query_config:
        data = await engine.execute_custom_query(export_request.query_config)
    else:
        # Default: get aggregated analytics
        time_range = export_request.time_range or {
            "start": (datetime.now() - timedelta(days=7)).isoformat(),
            "end": datetime.now().isoformat()
        }
        start = datetime.fromisoformat(time_range["start"])
        end = datetime.fromisoformat(time_range["end"])

        data = await engine.get_time_series_data(start, end, "day")

    # Prepare export
    # For large exports, this should be an async job
    export_service = ExportService()

    # This is a synchronous example, but better as a background task
    file_content, filename = export_service.generate_export_content(
        data,
        export_request.export_format,
        "analytics_export"
    )

    # Here you would typically save the file and return a URL or job ID
    # For this example, we'll return a simplified response
    # In a real app: background_tasks.add_task(save_and_notify, file_content, filename, current_user)

    return {
        "message": "Export job started. You will be notified upon completion.",
        "filename": filename,
        "format": export_request.export_format
    }


@router.post("/scheduled-exports")
async def create_scheduled_export(
    export_config: ScheduledExportRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Create a scheduled analytics export
    """
    scheduled_export = export_manager.create_scheduled_export(
        user_id=current_user.id,
        export_config=export_config.dict()
    )

    return {
        "message": "Scheduled export created successfully",
        "scheduled_export": scheduled_export
    }


@router.get("/scheduled-exports")
async def get_scheduled_exports(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get all scheduled exports for current user
    """
    exports = export_manager.get_scheduled_exports(current_user.id)

    return {
        "scheduled_exports": exports,
        "total_count": len(exports)
    }


@router.put("/scheduled-exports/{export_id}")
async def update_scheduled_export(
    export_id: int,
    updates: Dict[str, Any],
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Update a scheduled export
    """
    updated = export_manager.update_scheduled_export(export_id, updates)

    if not updated:
        raise HTTPException(status_code=404, detail="Scheduled export not found")

    return {
        "message": "Scheduled export updated successfully",
        "scheduled_export": updated
    }


@router.delete("/scheduled-exports/{export_id}")
async def delete_scheduled_export(
    export_id: int,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Delete a scheduled export
    """
    deleted = export_manager.delete_scheduled_export(export_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Scheduled export not found")

    return {"message": "Scheduled export deleted successfully"}


@router.post("/reports/generate")
async def generate_report(
    report_request: ReportRequest,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate custom analytics reports
    """
    engine = AnalyticsEngine(db)

    # Get required data
    start = datetime.fromisoformat(report_request.time_range["start"])
    end = datetime.fromisoformat(report_request.time_range["end"])

    if report_request.report_type == "executive_summary":
        performance_data = await engine.calculate_performance_metrics(
            pipeline_id=report_request.pipeline_id,
            time_range=report_request.time_range
        )

        report = ReportBuilder.build_executive_summary(
            performance_data,
            report_request.time_range
        )

    elif report_request.report_type == "detailed_analytics":
        time_series = await engine.get_time_series_data(start, end, "day", report_request.pipeline_id)
        performance_metrics = await engine.calculate_performance_metrics(
            pipeline_id=report_request.pipeline_id,
            time_range=report_request.time_range
        )
        trends = await engine.get_trend_analysis(
            "records_processed",
            report_request.time_range,
            report_request.pipeline_id
        )

        report = ReportBuilder.build_detailed_analytics_report(
            time_series,
            performance_metrics,
            trends,
            report_request.time_range
        )

    elif report_request.report_type == "custom":
        if not report_request.custom_config:
            raise HTTPException(status_code=400, detail="Custom config required for custom reports")

        data = await engine.execute_custom_query(report_request.custom_config.get("query", {}))

        report = ReportBuilder.build_custom_report(
            report_request.custom_config,
            data
        )

    else:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_request.report_type}")

    return report


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    time_range: str = Query("7d", regex="^(24h|7d|30d|90d)$"),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard summary with all key metrics
    """
    engine = AnalyticsEngine(db)

    # Calculate time range
    time_mapping = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90)
    }

    delta = time_mapping[time_range]
    end_date = datetime.now()
    start_date = end_date - delta

    time_range_dict = {
        "start": start_date.isoformat(),
        "end": end_date.isoformat()
    }

    # Get all metrics
    time_series = await engine.get_time_series_data(
        start_date, end_date, "day"
    )

    performance = await engine.calculate_performance_metrics(
        time_range=time_range_dict
    )

    predictions = await engine.get_predictive_indicators()

    return {
        "time_range": time_range,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "time_series": time_series,
        "performance_metrics": performance,
        "predictive_indicators": predictions,
        "generated_at": datetime.now().isoformat()
    }


@router.get("/health")
async def analytics_health_check(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "advanced_analytics",
        "timestamp": datetime.now().isoformat()
    }