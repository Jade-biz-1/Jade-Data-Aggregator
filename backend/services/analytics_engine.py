"""
Advanced Analytics Engine Service
Provides time-series data processing, custom query engine, and performance metrics calculation
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_, case, desc, asc
from collections import defaultdict
import statistics

from backend.models.pipeline import Pipeline
from backend.models.pipeline_run import PipelineRun
from backend.models.connector import Connector
from backend.models.transformation import Transformation


class AnalyticsEngine:
    """Advanced analytics engine for data processing and metrics calculation"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_time_series_data(
        self,
        start_date: datetime,
        end_date: datetime,
        interval: str = "day",
        pipeline_id: Optional[int] = None,
        metrics: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get time-series data with configurable intervals and metrics

        Args:
            start_date: Start of time range
            end_date: End of time range
            interval: 'hour', 'day', 'week', 'month'
            pipeline_id: Optional pipeline filter
            metrics: List of metrics to include (records, success_rate, duration, etc.)
        """
        if metrics is None:
            metrics = ["records_processed", "success_rate", "avg_duration", "error_count"]

        # Build query
        query = select(PipelineRun).filter(
            and_(
                PipelineRun.started_at >= start_date,
                PipelineRun.started_at <= end_date
            )
        )

        if pipeline_id:
            query = query.filter(PipelineRun.pipeline_id == pipeline_id)

        result = await self.db.execute(query)
        runs = result.scalars().all()

        # Group data by interval
        time_series = defaultdict(lambda: {
            "records_processed": 0,
            "records_failed": 0,
            "total_runs": 0,
            "completed_runs": 0,
            "failed_runs": 0,
            "durations": []
        })

        for run in runs:
            # Determine interval key
            if interval == "hour":
                key = run.started_at.strftime("%Y-%m-%d %H:00")
            elif interval == "day":
                key = run.started_at.strftime("%Y-%m-%d")
            elif interval == "week":
                key = run.started_at.strftime("%Y-W%U")
            elif interval == "month":
                key = run.started_at.strftime("%Y-%m")
            else:
                key = run.started_at.strftime("%Y-%m-%d")

            # Aggregate metrics
            time_series[key]["records_processed"] += run.records_processed or 0
            time_series[key]["records_failed"] += run.records_failed or 0
            time_series[key]["total_runs"] += 1

            if run.status == "completed":
                time_series[key]["completed_runs"] += 1
            elif run.status == "failed":
                time_series[key]["failed_runs"] += 1

            # Calculate duration if completed
            if run.completed_at and run.started_at:
                duration = (run.completed_at - run.started_at).total_seconds()
                time_series[key]["durations"].append(duration)

        # Format output
        formatted_data = []
        for timestamp, data in sorted(time_series.items()):
            entry = {"timestamp": timestamp}

            if "records_processed" in metrics:
                entry["records_processed"] = data["records_processed"]

            if "success_rate" in metrics:
                total = data["total_runs"]
                entry["success_rate"] = round(
                    (data["completed_runs"] / total * 100) if total > 0 else 0, 2
                )

            if "avg_duration" in metrics:
                durations = data["durations"]
                entry["avg_duration"] = round(
                    statistics.mean(durations) if durations else 0, 2
                )

            if "error_count" in metrics:
                entry["error_count"] = data["failed_runs"]

            if "total_runs" in metrics:
                entry["total_runs"] = data["total_runs"]

            formatted_data.append(entry)

        return formatted_data

    async def execute_custom_query(
        self,
        query_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute custom analytics query based on configuration

        Query config format:
        {
            "entity": "pipeline_runs",
            "filters": {...},
            "aggregations": [...],
            "group_by": [...],
            "time_range": {...}
        }
        """
        entity = query_config.get("entity", "pipeline_runs")
        filters = query_config.get("filters", {})
        aggregations = query_config.get("aggregations", [])
        group_by = query_config.get("group_by", [])
        time_range = query_config.get("time_range", {})

        if entity == "pipeline_runs":
            return await self._query_pipeline_runs(filters, aggregations, group_by, time_range)
        elif entity == "pipelines":
            return await self._query_pipelines(filters, aggregations, group_by)
        elif entity == "connectors":
            return await self._query_connectors(filters, aggregations, group_by)
        else:
            raise ValueError(f"Unsupported entity: {entity}")

    async def _query_pipeline_runs(
        self,
        filters: Dict[str, Any],
        aggregations: List[str],
        group_by: List[str],
        time_range: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Query pipeline runs with custom filters and aggregations"""

        # Base query
        query = select(PipelineRun)

        # Apply time range
        if time_range:
            start = time_range.get("start")
            end = time_range.get("end")
            if start:
                query = query.filter(PipelineRun.started_at >= datetime.fromisoformat(start))
            if end:
                query = query.filter(PipelineRun.started_at <= datetime.fromisoformat(end))

        # Apply filters
        if "status" in filters:
            query = query.filter(PipelineRun.status == filters["status"])
        if "pipeline_id" in filters:
            query = query.filter(PipelineRun.pipeline_id == filters["pipeline_id"])

        result = await self.db.execute(query)
        runs = result.scalars().all()

        # Group data
        grouped_data = defaultdict(list)

        if group_by:
            for run in runs:
                key = tuple(getattr(run, field, None) for field in group_by)
                grouped_data[key].append(run)
        else:
            grouped_data["all"] = runs

        # Calculate aggregations
        results = []
        for key, run_group in grouped_data.items():
            result_entry = {}

            # Add grouping fields
            if group_by and key != "all":
                for i, field in enumerate(group_by):
                    result_entry[field] = key[i]

            # Calculate aggregations
            for agg in aggregations:
                if agg == "count":
                    result_entry["count"] = len(run_group)
                elif agg == "sum_records":
                    result_entry["total_records"] = sum(r.records_processed or 0 for r in run_group)
                elif agg == "avg_duration":
                    durations = [
                        (r.completed_at - r.started_at).total_seconds()
                        for r in run_group
                        if r.completed_at and r.started_at
                    ]
                    result_entry["avg_duration"] = round(
                        statistics.mean(durations) if durations else 0, 2
                    )
                elif agg == "success_rate":
                    completed = sum(1 for r in run_group if r.status == "completed")
                    result_entry["success_rate"] = round(
                        (completed / len(run_group) * 100) if run_group else 0, 2
                    )

            results.append(result_entry)

        return {"results": results, "total_count": len(runs)}

    async def _query_pipelines(
        self,
        filters: Dict[str, Any],
        aggregations: List[str],
        group_by: List[str]
    ) -> Dict[str, Any]:
        """Query pipelines with aggregations"""

        query = select(Pipeline)

        # Apply filters
        if "is_active" in filters:
            query = query.filter(Pipeline.is_active == filters["is_active"])
        if "pipeline_type" in filters:
            query = query.filter(Pipeline.pipeline_type == filters["pipeline_type"])

        result = await self.db.execute(query)
        pipelines = result.scalars().all()

        results = []
        for pipeline in pipelines:
            entry = {
                "id": pipeline.id,
                "name": pipeline.name,
                "is_active": pipeline.is_active,
                "pipeline_type": pipeline.pipeline_type
            }
            results.append(entry)

        return {"results": results, "total_count": len(pipelines)}

    async def _query_connectors(
        self,
        filters: Dict[str, Any],
        aggregations: List[str],
        group_by: List[str]
    ) -> Dict[str, Any]:
        """Query connectors with aggregations"""

        query = select(Connector)

        # Apply filters
        if "connector_type" in filters:
            query = query.filter(Connector.connector_type == filters["connector_type"])

        result = await self.db.execute(query)
        connectors = result.scalars().all()

        # Group by connector type if requested
        if "connector_type" in group_by:
            grouped = defaultdict(int)
            for conn in connectors:
                grouped[conn.connector_type] += 1

            results = [
                {"connector_type": k, "count": v}
                for k, v in grouped.items()
            ]
        else:
            results = [
                {"id": c.id, "name": c.name, "type": c.connector_type}
                for c in connectors
            ]

        return {"results": results, "total_count": len(connectors)}

    async def calculate_performance_metrics(
        self,
        pipeline_id: Optional[int] = None,
        time_range: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive performance metrics
        """
        query = select(PipelineRun)

        # Apply filters
        if pipeline_id:
            query = query.filter(PipelineRun.pipeline_id == pipeline_id)

        if time_range:
            if "start" in time_range:
                query = query.filter(PipelineRun.started_at >= datetime.fromisoformat(time_range["start"]))
            if "end" in time_range:
                query = query.filter(PipelineRun.started_at <= datetime.fromisoformat(time_range["end"]))

        result = await self.db.execute(query)
        runs = result.scalars().all()

        if not runs:
            return {
                "total_runs": 0,
                "metrics": {}
            }

        # Calculate metrics
        total_runs = len(runs)
        completed_runs = sum(1 for r in runs if r.status == "completed")
        failed_runs = sum(1 for r in runs if r.status == "failed")
        total_records = sum(r.records_processed or 0 for r in runs)
        total_errors = sum(r.records_failed or 0 for r in runs)

        # Duration metrics
        durations = [
            (r.completed_at - r.started_at).total_seconds()
            for r in runs
            if r.completed_at and r.started_at
        ]

        # Records per second
        throughput = [
            (r.records_processed or 0) / ((r.completed_at - r.started_at).total_seconds())
            for r in runs
            if r.completed_at and r.started_at and (r.completed_at - r.started_at).total_seconds() > 0
        ]

        return {
            "total_runs": total_runs,
            "metrics": {
                "success_rate": round((completed_runs / total_runs * 100) if total_runs > 0 else 0, 2),
                "failure_rate": round((failed_runs / total_runs * 100) if total_runs > 0 else 0, 2),
                "total_records_processed": total_records,
                "total_errors": total_errors,
                "error_rate": round((total_errors / total_records * 100) if total_records > 0 else 0, 2),
                "avg_duration_seconds": round(statistics.mean(durations) if durations else 0, 2),
                "min_duration_seconds": round(min(durations) if durations else 0, 2),
                "max_duration_seconds": round(max(durations) if durations else 0, 2),
                "median_duration_seconds": round(statistics.median(durations) if durations else 0, 2),
                "avg_throughput_records_per_second": round(statistics.mean(throughput) if throughput else 0, 2),
                "max_throughput_records_per_second": round(max(throughput) if throughput else 0, 2)
            }
        }

    async def get_trend_analysis(
        self,
        metric: str,
        time_range: Dict[str, Any],
        pipeline_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Analyze trends for a specific metric
        Returns trend direction, percentage change, and predictions
        """
        start = datetime.fromisoformat(time_range["start"])
        end = datetime.fromisoformat(time_range["end"])

        # Calculate midpoint for comparison
        midpoint = start + (end - start) / 2

        # Get data for first half
        first_half = await self.get_time_series_data(
            start, midpoint, "day", pipeline_id, [metric]
        )

        # Get data for second half
        second_half = await self.get_time_series_data(
            midpoint, end, "day", pipeline_id, [metric]
        )

        # Calculate averages
        first_avg = statistics.mean([d.get(metric, 0) for d in first_half]) if first_half else 0
        second_avg = statistics.mean([d.get(metric, 0) for d in second_half]) if second_half else 0

        # Calculate trend
        if first_avg > 0:
            percent_change = ((second_avg - first_avg) / first_avg) * 100
        else:
            percent_change = 0

        trend_direction = "up" if percent_change > 5 else "down" if percent_change < -5 else "stable"

        return {
            "metric": metric,
            "trend_direction": trend_direction,
            "percent_change": round(percent_change, 2),
            "first_period_avg": round(first_avg, 2),
            "second_period_avg": round(second_avg, 2),
            "analysis": self._generate_trend_analysis(metric, trend_direction, percent_change)
        }

    def _generate_trend_analysis(self, metric: str, direction: str, change: float) -> str:
        """Generate human-readable trend analysis"""
        metric_name = metric.replace("_", " ").title()

        if direction == "up":
            return f"{metric_name} has increased by {abs(change):.1f}% compared to the previous period."
        elif direction == "down":
            return f"{metric_name} has decreased by {abs(change):.1f}% compared to the previous period."
        else:
            return f"{metric_name} has remained stable with minimal change ({abs(change):.1f}%)."

    async def get_comparative_analytics(
        self,
        pipeline_ids: List[int],
        time_range: Dict[str, Any],
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Compare analytics across multiple pipelines
        """
        if metrics is None:
            metrics = ["records_processed", "success_rate", "avg_duration"]

        results = {}

        for pipeline_id in pipeline_ids:
            # Get pipeline name
            pipeline_result = await self.db.execute(
                select(Pipeline).filter(Pipeline.id == pipeline_id)
            )
            pipeline = pipeline_result.scalar_one_or_none()

            if pipeline:
                performance = await self.calculate_performance_metrics(
                    pipeline_id=pipeline_id,
                    time_range=time_range
                )

                results[pipeline.name] = {
                    "pipeline_id": pipeline_id,
                    "metrics": performance["metrics"]
                }

        return {
            "comparison": results,
            "time_range": time_range
        }

    async def get_predictive_indicators(
        self,
        pipeline_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate predictive indicators based on historical data
        Simple linear regression for trend prediction
        """
        # Get last 30 days of data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        time_series = await self.get_time_series_data(
            start_date,
            end_date,
            "day",
            pipeline_id,
            ["records_processed", "success_rate"]
        )

        if not time_series or len(time_series) < 7:
            return {
                "prediction_available": False,
                "message": "Insufficient data for prediction"
            }

        # Simple moving average prediction
        recent_records = [d.get("records_processed", 0) for d in time_series[-7:]]
        recent_success = [d.get("success_rate", 0) for d in time_series[-7:]]

        predicted_records = round(statistics.mean(recent_records)) if recent_records else 0
        predicted_success = round(statistics.mean(recent_success), 2) if recent_success else 0

        # Calculate volatility (standard deviation)
        records_volatility = round(statistics.stdev(recent_records), 2) if len(recent_records) > 1 else 0
        success_volatility = round(statistics.stdev(recent_success), 2) if len(recent_success) > 1 else 0

        return {
            "prediction_available": True,
            "predictions": {
                "next_day_records": predicted_records,
                "next_day_success_rate": predicted_success,
                "confidence": "high" if records_volatility < predicted_records * 0.2 else "medium" if records_volatility < predicted_records * 0.5 else "low"
            },
            "volatility": {
                "records_std_dev": records_volatility,
                "success_rate_std_dev": success_volatility
            },
            "recommendation": self._generate_recommendation(predicted_success, success_volatility)
        }

    def _generate_recommendation(self, success_rate: float, volatility: float) -> str:
        """Generate actionable recommendations based on predictions"""
        if success_rate < 90:
            return "Success rate is below optimal. Consider reviewing error logs and pipeline configuration."
        elif volatility > 5:
            return "High volatility detected. Monitor pipeline stability and consider implementing retry mechanisms."
        else:
            return "Pipeline performance is stable and within normal parameters."
