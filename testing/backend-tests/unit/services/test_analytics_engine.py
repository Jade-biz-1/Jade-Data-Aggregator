"""
Unit Tests for Analytics Engine Service
TEST-006: Analytics engine coverage (60 tests target — 55 new tests here)

Tests cover:
- Time-series data grouping by hour / day / week / month
- Custom query dispatch (pipeline_runs, pipelines, connectors)
- Aggregations: count, sum_records, avg_duration, success_rate
- Performance metrics calculations
- Trend analysis and direction detection
- Predictive indicator generation
- Comparative analytics across multiple pipelines
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

from backend.services.analytics_engine import AnalyticsEngine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_run(
    status="completed",
    records_processed=100,
    records_failed=0,
    started_at=None,
    duration_seconds=10,
    pipeline_id=1,
):
    """Create a mock PipelineRun object."""
    run = Mock()
    run.status = status
    run.records_processed = records_processed
    run.records_failed = records_failed
    run.pipeline_id = pipeline_id
    run.started_at = started_at or datetime(2024, 1, 15, 12, 0, 0)
    if status == "completed":
        run.completed_at = run.started_at + timedelta(seconds=duration_seconds)
    else:
        run.completed_at = None
    return run


def make_db_returning(rows):
    """Create an AsyncMock db session whose execute() returns the given rows."""
    mock_db = AsyncMock()
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = rows
    mock_result.scalar_one_or_none.return_value = rows[0] if rows else None
    mock_db.execute.return_value = mock_result
    return mock_db


# ---------------------------------------------------------------------------
# TEST-006-A: Time-Series Data (16 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEngineTimeSeries:
    """Tests for AnalyticsEngine.get_time_series_data()"""

    @pytest.mark.asyncio
    async def test_empty_db_returns_empty_list(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31)
        )
        assert result == []

    @pytest.mark.asyncio
    async def test_groups_by_day_default(self):
        run = make_run(started_at=datetime(2024, 1, 15, 10, 0, 0))
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="day"
        )
        assert len(result) == 1
        assert result[0]["timestamp"] == "2024-01-15"

    @pytest.mark.asyncio
    async def test_groups_by_hour(self):
        run = make_run(started_at=datetime(2024, 1, 15, 10, 30, 0))
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="hour"
        )
        assert len(result) == 1
        assert result[0]["timestamp"] == "2024-01-15 10:00"

    @pytest.mark.asyncio
    async def test_groups_by_week(self):
        run = make_run(started_at=datetime(2024, 1, 15))
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="week"
        )
        assert len(result) == 1
        assert "W" in result[0]["timestamp"]

    @pytest.mark.asyncio
    async def test_groups_by_month(self):
        run = make_run(started_at=datetime(2024, 1, 15))
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="month"
        )
        assert len(result) == 1
        assert result[0]["timestamp"] == "2024-01"

    @pytest.mark.asyncio
    async def test_unknown_interval_defaults_to_day(self):
        run = make_run(started_at=datetime(2024, 1, 15, 10, 30, 0))
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="unknown"
        )
        assert result[0]["timestamp"] == "2024-01-15"

    @pytest.mark.asyncio
    async def test_aggregates_two_runs_same_day(self):
        runs = [
            make_run(records_processed=100, started_at=datetime(2024, 1, 15, 9, 0, 0)),
            make_run(records_processed=200, started_at=datetime(2024, 1, 15, 14, 0, 0)),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="day",
            metrics=["records_processed"]
        )
        assert result[0]["records_processed"] == 300

    @pytest.mark.asyncio
    async def test_two_separate_days_produce_two_entries(self):
        runs = [
            make_run(started_at=datetime(2024, 1, 15)),
            make_run(started_at=datetime(2024, 1, 16)),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="day"
        )
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_success_rate_all_completed(self):
        runs = [make_run(status="completed") for _ in range(4)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["success_rate"]
        )
        assert result[0]["success_rate"] == 100.0

    @pytest.mark.asyncio
    async def test_success_rate_mixed_statuses(self):
        runs = [
            make_run(status="completed", started_at=datetime(2024, 1, 15)),
            make_run(status="failed", started_at=datetime(2024, 1, 15)),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["success_rate"]
        )
        assert result[0]["success_rate"] == 50.0

    @pytest.mark.asyncio
    async def test_avg_duration_zero_when_no_completed_runs(self):
        runs = [make_run(status="failed")]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["avg_duration"]
        )
        assert result[0]["avg_duration"] == 0

    @pytest.mark.asyncio
    async def test_avg_duration_calculated_correctly(self):
        runs = [
            make_run(status="completed", duration_seconds=10),
            make_run(status="completed", duration_seconds=20),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["avg_duration"]
        )
        assert result[0]["avg_duration"] == 15.0

    @pytest.mark.asyncio
    async def test_error_count_metric(self):
        runs = [
            make_run(status="completed", started_at=datetime(2024, 1, 15)),
            make_run(status="failed", started_at=datetime(2024, 1, 15)),
            make_run(status="failed", started_at=datetime(2024, 1, 15)),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["error_count"]
        )
        assert result[0]["error_count"] == 2

    @pytest.mark.asyncio
    async def test_total_runs_metric(self):
        runs = [make_run() for _ in range(5)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["total_runs"]
        )
        assert result[0]["total_runs"] == 5

    @pytest.mark.asyncio
    async def test_result_sorted_ascending_by_timestamp(self):
        runs = [
            make_run(started_at=datetime(2024, 1, 20)),
            make_run(started_at=datetime(2024, 1, 10)),
            make_run(started_at=datetime(2024, 1, 15)),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), interval="day"
        )
        timestamps = [r["timestamp"] for r in result]
        assert timestamps == sorted(timestamps)

    @pytest.mark.asyncio
    async def test_none_records_processed_treated_as_zero(self):
        run = make_run()
        run.records_processed = None
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_time_series_data(
            datetime(2024, 1, 1), datetime(2024, 1, 31), metrics=["records_processed"]
        )
        assert result[0]["records_processed"] == 0


# ---------------------------------------------------------------------------
# TEST-006-B: Custom Query Dispatch (10 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEngineCustomQuery:
    """Tests for AnalyticsEngine.execute_custom_query()"""

    @pytest.mark.asyncio
    async def test_unsupported_entity_raises_value_error(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        with pytest.raises(ValueError, match="Unsupported entity"):
            await engine.execute_custom_query({"entity": "unknown_entity"})

    @pytest.mark.asyncio
    async def test_pipeline_runs_entity_returns_results_and_total_count(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.execute_custom_query({"entity": "pipeline_runs"})
        assert "results" in result
        assert "total_count" in result

    @pytest.mark.asyncio
    async def test_pipelines_entity_returns_results_and_total_count(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.execute_custom_query({"entity": "pipelines"})
        assert "results" in result
        assert "total_count" in result

    @pytest.mark.asyncio
    async def test_connectors_entity_returns_results_and_total_count(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.execute_custom_query({"entity": "connectors"})
        assert "results" in result
        assert "total_count" in result

    @pytest.mark.asyncio
    async def test_count_aggregation_on_pipeline_runs(self):
        runs = [make_run() for _ in range(3)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine._query_pipeline_runs(
            filters={}, aggregations=["count"], group_by=[], time_range={}
        )
        assert result["results"][0]["count"] == 3

    @pytest.mark.asyncio
    async def test_sum_records_aggregation(self):
        runs = [make_run(records_processed=50) for _ in range(4)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine._query_pipeline_runs(
            filters={}, aggregations=["sum_records"], group_by=[], time_range={}
        )
        assert result["results"][0]["total_records"] == 200

    @pytest.mark.asyncio
    async def test_avg_duration_aggregation(self):
        runs = [
            make_run(status="completed", duration_seconds=10),
            make_run(status="completed", duration_seconds=30),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine._query_pipeline_runs(
            filters={}, aggregations=["avg_duration"], group_by=[], time_range={}
        )
        assert result["results"][0]["avg_duration"] == 20.0

    @pytest.mark.asyncio
    async def test_success_rate_aggregation(self):
        runs = [
            make_run(status="completed"),
            make_run(status="completed"),
            make_run(status="failed"),
            make_run(status="failed"),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine._query_pipeline_runs(
            filters={}, aggregations=["success_rate"], group_by=[], time_range={}
        )
        assert result["results"][0]["success_rate"] == 50.0

    @pytest.mark.asyncio
    async def test_empty_pipeline_runs_returns_zero_total_count(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine._query_pipeline_runs(
            filters={}, aggregations=[], group_by=[], time_range={}
        )
        assert result["total_count"] == 0

    @pytest.mark.asyncio
    async def test_query_pipelines_returns_pipeline_fields(self):
        pipeline = Mock()
        pipeline.id = 1
        pipeline.name = "Test Pipeline"
        pipeline.is_active = True
        pipeline.pipeline_type = "batch"
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [pipeline]
        mock_db.execute.return_value = mock_result
        engine = AnalyticsEngine(db=mock_db)
        result = await engine._query_pipelines(filters={}, aggregations=[], group_by=[])
        assert result["total_count"] == 1
        assert result["results"][0]["name"] == "Test Pipeline"


# ---------------------------------------------------------------------------
# TEST-006-C: Performance Metrics (10 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEnginePerformanceMetrics:
    """Tests for AnalyticsEngine.calculate_performance_metrics()"""

    @pytest.mark.asyncio
    async def test_no_runs_returns_zero_total_and_empty_metrics(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["total_runs"] == 0
        assert result["metrics"] == {}

    @pytest.mark.asyncio
    async def test_calculates_success_rate(self):
        runs = [
            make_run(status="completed"),
            make_run(status="completed"),
            make_run(status="failed"),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["success_rate"] == pytest.approx(66.67, abs=0.1)

    @pytest.mark.asyncio
    async def test_calculates_failure_rate_100_percent(self):
        runs = [make_run(status="failed") for _ in range(2)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["failure_rate"] == 100.0

    @pytest.mark.asyncio
    async def test_calculates_total_records_processed(self):
        runs = [make_run(records_processed=100) for _ in range(3)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["total_records_processed"] == 300

    @pytest.mark.asyncio
    async def test_calculates_avg_duration(self):
        runs = [
            make_run(status="completed", duration_seconds=10),
            make_run(status="completed", duration_seconds=20),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["avg_duration_seconds"] == 15.0

    @pytest.mark.asyncio
    async def test_calculates_min_and_max_duration(self):
        runs = [
            make_run(status="completed", duration_seconds=5),
            make_run(status="completed", duration_seconds=15),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["min_duration_seconds"] == 5.0
        assert result["metrics"]["max_duration_seconds"] == 15.0

    @pytest.mark.asyncio
    async def test_calculates_median_duration(self):
        runs = [
            make_run(status="completed", duration_seconds=10),
            make_run(status="completed", duration_seconds=20),
            make_run(status="completed", duration_seconds=30),
        ]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["median_duration_seconds"] == 20.0

    @pytest.mark.asyncio
    async def test_total_runs_count(self):
        runs = [make_run() for _ in range(7)]
        db = make_db_returning(runs)
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["total_runs"] == 7

    @pytest.mark.asyncio
    async def test_calculates_throughput(self):
        run = make_run(status="completed", records_processed=1000, duration_seconds=10)
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["avg_throughput_records_per_second"] == pytest.approx(100.0, abs=0.01)

    @pytest.mark.asyncio
    async def test_error_rate_zero_when_no_records(self):
        run = make_run(records_processed=0, records_failed=0)
        db = make_db_returning([run])
        engine = AnalyticsEngine(db=db)
        result = await engine.calculate_performance_metrics()
        assert result["metrics"]["error_rate"] == 0.0


# ---------------------------------------------------------------------------
# TEST-006-D: Trend Analysis (7 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEngineTrendAnalysis:
    """Tests for get_trend_analysis() and _generate_trend_analysis()"""

    def test_generate_trend_analysis_upward_direction(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_trend_analysis("success_rate", "up", 15.0)
        assert "increased" in result
        assert "15.0%" in result

    def test_generate_trend_analysis_downward_direction(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_trend_analysis("success_rate", "down", -20.0)
        assert "decreased" in result
        assert "20.0%" in result

    def test_generate_trend_analysis_stable_direction(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_trend_analysis("records_processed", "stable", 2.0)
        assert "stable" in result

    def test_generate_trend_analysis_formats_metric_name(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_trend_analysis("success_rate", "up", 10.0)
        assert "Success Rate" in result

    @pytest.mark.asyncio
    async def test_trend_analysis_returns_required_keys(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = []
            result = await engine.get_trend_analysis(
                metric="error_count",
                time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
            )
        assert result["metric"] == "error_count"
        assert "trend_direction" in result
        assert "percent_change" in result
        assert "analysis" in result

    @pytest.mark.asyncio
    async def test_trend_analysis_stable_when_small_change(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = [{"records_processed": 100}]
            result = await engine.get_trend_analysis(
                metric="records_processed",
                time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
            )
        assert result["trend_direction"] == "stable"

    @pytest.mark.asyncio
    async def test_trend_analysis_upward_when_large_positive_change(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            first_call = [{"records_processed": 10}]
            second_call = [{"records_processed": 100}]
            mock_ts.side_effect = [first_call, second_call]
            result = await engine.get_trend_analysis(
                metric="records_processed",
                time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
            )
        assert result["trend_direction"] == "up"
        assert result["percent_change"] > 5


# ---------------------------------------------------------------------------
# TEST-006-E: Recommendations (3 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEngineRecommendations:
    """Tests for _generate_recommendation()"""

    def test_recommendation_for_low_success_rate(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_recommendation(success_rate=85.0, volatility=1.0)
        assert result  # Non-empty string mentioning the issue
        assert "error" in result.lower() or "success" in result.lower() or "below" in result.lower()

    def test_recommendation_for_high_volatility(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_recommendation(success_rate=95.0, volatility=10.0)
        assert "volatility" in result.lower() or "stable" in result.lower() or "retry" in result.lower()

    def test_recommendation_for_stable_performance(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        result = engine._generate_recommendation(success_rate=95.0, volatility=1.0)
        assert "stable" in result.lower()


# ---------------------------------------------------------------------------
# TEST-006-F: Predictive Indicators (5 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEnginePredictiveIndicators:
    """Tests for get_predictive_indicators()"""

    @pytest.mark.asyncio
    async def test_insufficient_data_empty_series(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = []
            result = await engine.get_predictive_indicators()
        assert result["prediction_available"] is False

    @pytest.mark.asyncio
    async def test_insufficient_data_fewer_than_7_days(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = [{"records_processed": 100, "success_rate": 95.0}] * 5
            result = await engine.get_predictive_indicators()
        assert result["prediction_available"] is False

    @pytest.mark.asyncio
    async def test_sufficient_data_returns_predictions(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = [
                {"records_processed": 100, "success_rate": 95.0}
            ] * 10
            result = await engine.get_predictive_indicators()
        assert result["prediction_available"] is True
        assert "next_day_records" in result["predictions"]
        assert "next_day_success_rate" in result["predictions"]

    @pytest.mark.asyncio
    async def test_constant_data_yields_high_confidence(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = [
                {"records_processed": 1000, "success_rate": 95.0}
            ] * 10
            result = await engine.get_predictive_indicators()
        assert result["predictions"]["confidence"] == "high"

    @pytest.mark.asyncio
    async def test_volatility_keys_present(self):
        engine = AnalyticsEngine(db=make_db_returning([]))
        with patch.object(engine, "get_time_series_data", new_callable=AsyncMock) as mock_ts:
            mock_ts.return_value = [
                {"records_processed": 100, "success_rate": 90.0}
            ] * 10
            result = await engine.get_predictive_indicators()
        assert "volatility" in result
        assert "records_std_dev" in result["volatility"]
        assert "success_rate_std_dev" in result["volatility"]


# ---------------------------------------------------------------------------
# TEST-006-G: Comparative Analytics (4 tests)
# ---------------------------------------------------------------------------

class TestAnalyticsEngineComparative:
    """Tests for get_comparative_analytics()"""

    @pytest.mark.asyncio
    async def test_empty_pipeline_list_returns_empty_comparison(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        result = await engine.get_comparative_analytics(
            pipeline_ids=[],
            time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
        )
        assert result["comparison"] == {}

    @pytest.mark.asyncio
    async def test_nonexistent_pipeline_is_skipped(self):
        mock_db = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        engine = AnalyticsEngine(db=mock_db)
        result = await engine.get_comparative_analytics(
            pipeline_ids=[999],
            time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
        )
        assert result["comparison"] == {}

    @pytest.mark.asyncio
    async def test_time_range_included_in_result(self):
        db = make_db_returning([])
        engine = AnalyticsEngine(db=db)
        time_range = {"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
        result = await engine.get_comparative_analytics(
            pipeline_ids=[], time_range=time_range
        )
        assert result["time_range"] == time_range

    @pytest.mark.asyncio
    async def test_existing_pipeline_included_in_comparison(self):
        pipeline = Mock()
        pipeline.id = 1
        pipeline.name = "Sales Pipeline"

        call_count = 0

        async def execute_side_effect(*args):
            nonlocal call_count
            call_count += 1
            result = Mock()
            if call_count == 1:
                result.scalar_one_or_none.return_value = pipeline
            else:
                result.scalar_one_or_none.return_value = None
                result.scalars.return_value.all.return_value = []
            return result

        mock_db = AsyncMock()
        mock_db.execute.side_effect = execute_side_effect
        engine = AnalyticsEngine(db=mock_db)
        result = await engine.get_comparative_analytics(
            pipeline_ids=[1],
            time_range={"start": "2024-01-01T00:00:00", "end": "2024-01-31T00:00:00"}
        )
        assert "Sales Pipeline" in result["comparison"]


# Run with:
# POSTGRES_SERVER=localhost POSTGRES_USER=user POSTGRES_PASSWORD=pass POSTGRES_DB=db \
# REDIS_URL=redis://localhost:6379 PYTHONPATH=/Users/Deepak/Public/Jade-Data-Aggregator \
# poetry run pytest testing/backend-tests/unit/services/test_analytics_engine.py -v
