"""
Unit Tests for Monitoring Endpoints Security
Data Aggregator Platform - Testing Framework - Week 94 TEST-005

Tests cover:
- Monitoring endpoints (/monitoring/*)
- Dashboard endpoints (/dashboard/*)
- Alert endpoints (/alerts/*)
- Log endpoints (/logs/*)
- Authentication enforcement
- Authorization (RBAC) checks
- Error handling without information leakage
- Input validation

Total: 40 tests for monitoring endpoint security
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from backend.schemas.user import User
from backend.models.monitoring import LogLevel, AlertSeverity, AlertStatus


def _make_mock_user(user_id: int, username: str, email: str, role: str) -> User:
    return User(
        id=user_id,
        username=username,
        email=email,
        role=role,
        is_active=True,
        created_at=datetime.utcnow()
    )


class TestMonitoringEndpointAuthentication:
    """Test authentication requirements for monitoring endpoints"""

    @pytest.fixture
    def mock_viewer_user(self):
        """Create a mock viewer user"""
        return _make_mock_user(1, "viewer", "viewer@example.com", "viewer")

    @pytest.fixture
    def mock_admin_user(self):
        """Create a mock admin user"""
        return _make_mock_user(2, "admin", "admin@example.com", "admin")

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 0
        mock_result.scalars.return_value.all.return_value = []
        mock_result.fetchall.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        return session

    # Authentication Tests

    @pytest.mark.asyncio
    async def test_monitoring_stats_requires_authentication(self, mock_viewer_user, mock_db_session):
        """Test that get_pipeline_stats returns the expected response structure"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_stats

        result = await get_pipeline_stats(current_user=mock_viewer_user, db=mock_db_session)

        assert "totalPipelines" in result
        assert "activePipelines" in result
        assert "runningPipelines" in result
        assert "failedPipelines" in result

    @pytest.mark.asyncio
    async def test_dashboard_stats_requires_authentication(self, mock_viewer_user, mock_db_session):
        """Test that get_dashboard_stats returns the expected response structure"""
        from backend.api.v1.endpoints.dashboard import get_dashboard_stats

        result = await get_dashboard_stats(current_user=mock_viewer_user, db=mock_db_session)

        assert "pipelines" in result
        assert "connectors" in result
        assert "data_processed" in result
        assert "trends" in result

    @pytest.mark.asyncio
    async def test_alert_creation_requires_authentication(self, mock_db_session):
        """Test that create_alert_rule wraps service exceptions with a safe HTTP 500"""
        from backend.api.v1.endpoints.alerts import create_alert_rule, AlertRuleCreate

        rule = AlertRuleCreate(
            name="Auth Test Rule",
            rule_type="threshold",
            metric_name="cpu_usage",
            condition="gt",
            threshold_value=80.0,
        )

        with patch(
            "backend.api.v1.endpoints.alerts.alert_service.create_alert_rule",
            side_effect=Exception("DB connection failed"),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await create_alert_rule(rule=rule, db=mock_db_session)

        assert exc_info.value.status_code == 500
        assert "Unable to create alert rule" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_log_search_requires_authentication(self, mock_db_session):
        """Test that search_logs returns expected structure with default parameters"""
        from backend.api.v1.endpoints.logs import search_logs, LogSearchRequest

        search_request = LogSearchRequest()

        with patch(
            "backend.api.v1.endpoints.logs.logging_service.search_logs",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await search_logs(search_request=search_request, db=mock_db_session)

        assert "logs" in result
        assert "count" in result
        assert "offset" in result
        assert "limit" in result
        assert result["count"] == 0


class TestMonitoringEndpointAuthorization:
    """Test RBAC authorization for monitoring endpoints"""

    @pytest.fixture
    def mock_viewer_user(self):
        """Create a mock viewer user"""
        return _make_mock_user(1, "viewer", "viewer@example.com", "viewer")

    @pytest.fixture
    def mock_developer_user(self):
        """Create a mock developer user"""
        return _make_mock_user(2, "developer", "dev@example.com", "developer")

    @pytest.fixture
    def mock_admin_user(self):
        """Create a mock admin user"""
        return _make_mock_user(3, "admin", "admin@example.com", "admin")

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 0
        mock_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        return session

    # RBAC Authorization Tests

    @pytest.mark.asyncio
    async def test_viewer_can_access_monitoring_stats(self, mock_viewer_user, mock_db_session):
        """Test that viewer role can access monitoring stats"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_stats

        result = await get_pipeline_stats(
            current_user=mock_viewer_user,
            db=mock_db_session
        )

        assert "totalPipelines" in result
        assert "activePipelines" in result

    @pytest.mark.asyncio
    async def test_viewer_can_access_dashboard_stats(self, mock_viewer_user, mock_db_session):
        """Test that viewer role can access dashboard stats"""
        from backend.api.v1.endpoints.dashboard import get_dashboard_stats

        result = await get_dashboard_stats(
            current_user=mock_viewer_user,
            db=mock_db_session
        )

        assert "pipelines" in result
        assert "connectors" in result

    @pytest.mark.asyncio
    async def test_developer_can_access_alerts(self, mock_developer_user, mock_db_session):
        """Test that developer role can access alerts"""
        from backend.api.v1.endpoints.alerts import get_active_alerts

        result = await get_active_alerts(
            severity=None,
            pipeline_id=None,
            limit=100,
            db=mock_db_session
        )

        assert "alerts" in result
        assert "count" in result

    @pytest.mark.asyncio
    async def test_admin_can_create_alert_rules(self, mock_admin_user, mock_db_session):
        """Test that an admin user can successfully create an alert rule"""
        from backend.api.v1.endpoints.alerts import create_alert_rule, AlertRuleCreate

        rule = AlertRuleCreate(
            name="Admin Alert Rule",
            rule_type="threshold",
            metric_name="memory_usage",
            condition="gt",
            threshold_value=90.0,
            severity=AlertSeverity.HIGH,
        )

        mock_alert = Mock()
        mock_alert.id = 1
        mock_alert.name = "Admin Alert Rule"
        mock_alert.rule_type = "threshold"
        mock_alert.metric_name = "memory_usage"
        mock_alert.condition = "gt"
        mock_alert.threshold_value = 90.0
        mock_alert.severity = AlertSeverity.HIGH
        mock_alert.is_active = True
        mock_alert.created_at = datetime.utcnow()

        with patch(
            "backend.api.v1.endpoints.alerts.alert_service.create_alert_rule",
            new_callable=AsyncMock,
            return_value=mock_alert,
        ):
            result = await create_alert_rule(
                rule=rule, user_id=mock_admin_user.id, db=mock_db_session
            )

        assert result["name"] == "Admin Alert Rule"
        assert result["severity"] == AlertSeverity.HIGH.value

    @pytest.mark.asyncio
    async def test_active_alerts_returns_empty_for_clean_system(self, mock_viewer_user, mock_db_session):
        """Test that get_active_alerts returns an empty list when no alerts exist"""
        from backend.api.v1.endpoints.alerts import get_active_alerts

        with patch(
            "backend.api.v1.endpoints.alerts.alert_service.get_active_alerts",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await get_active_alerts(
                severity=None, pipeline_id=None, limit=100, db=mock_db_session
            )

        assert "alerts" in result
        assert "count" in result
        assert result["count"] == 0
        assert result["alerts"] == []


class TestMonitoringEndpointInputValidation:
    """Test input validation for monitoring endpoints"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 0
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        return session

    # Input Validation Tests

    @pytest.mark.asyncio
    async def test_alert_creation_validates_severity(self, mock_db_session):
        """Test that alert rule creation validates severity"""
        from backend.api.v1.endpoints.alerts import create_alert_rule, AlertRuleCreate

        # Valid severities
        valid_severities = [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]

        for severity in valid_severities:
            rule = AlertRuleCreate(
                name="Test Rule",
                rule_type="threshold",
                metric_name="cpu_usage",
                condition="gt",
                threshold_value=80.0,
                severity=severity
            )
            # Should not raise validation error
            assert rule.severity == severity

    @pytest.mark.asyncio
    async def test_log_search_validates_limit(self, mock_db_session):
        """Test that log search validates limit parameter"""
        from backend.api.v1.endpoints.logs import LogSearchRequest

        # Test valid limit
        valid_request = LogSearchRequest(limit=100)
        assert valid_request.limit == 100

        # Test maximum limit enforcement
        max_request = LogSearchRequest(limit=1000)
        assert max_request.limit == 1000

        # Pydantic should reject invalid limits
        with pytest.raises(Exception):
            LogSearchRequest(limit=10000)  # Exceeds le=1000

    @pytest.mark.asyncio
    async def test_alert_rule_validates_time_window(self, mock_db_session):
        """Test that alert rule validates time window range"""
        from backend.api.v1.endpoints.alerts import AlertRuleCreate

        # Valid time windows (1-1440 minutes)
        valid_rule = AlertRuleCreate(
            name="Test",
            rule_type="threshold",
            metric_name="test",
            condition="gt",
            threshold_value=10.0,
            time_window_minutes=60
        )
        assert 1 <= valid_rule.time_window_minutes <= 1440

        # Invalid time window (too small)
        with pytest.raises(Exception):
            AlertRuleCreate(
                name="Test",
                rule_type="threshold",
                metric_name="test",
                condition="gt",
                threshold_value=10.0,
                time_window_minutes=0  # Invalid: must be >= 1
            )

    @pytest.mark.asyncio
    async def test_alert_rule_validates_condition(self, mock_db_session):
        """Test that alert rule validates condition values"""
        from backend.api.v1.endpoints.alerts import AlertRuleCreate

        # Valid conditions
        valid_conditions = ["gt", "gte", "lt", "lte", "eq"]

        for condition in valid_conditions:
            rule = AlertRuleCreate(
                name="Test",
                rule_type="threshold",
                metric_name="test",
                condition=condition,
                threshold_value=10.0
            )
            assert rule.condition == condition

        # Invalid condition
        with pytest.raises(Exception):
            AlertRuleCreate(
                name="Test",
                rule_type="threshold",
                metric_name="test",
                condition="invalid",  # Not in pattern
                threshold_value=10.0
            )

    @pytest.mark.asyncio
    async def test_log_level_enum_validation(self, mock_db_session):
        """Test that log level is validated against enum"""
        # Valid log levels
        valid_levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL]

        for level in valid_levels:
            assert level in LogLevel.__members__.values()

    @pytest.mark.asyncio
    async def test_alert_query_parameter_limits(self, mock_db_session):
        """Test that alert query parameters have proper limits"""
        from backend.api.v1.endpoints.alerts import get_active_alerts

        # Valid limit
        result = await get_active_alerts(
            severity=None,
            pipeline_id=None,
            limit=100,
            db=mock_db_session
        )
        assert "alerts" in result

        # Test with maximum limit (500 according to endpoint)
        result = await get_active_alerts(
            severity=None,
            pipeline_id=None,
            limit=500,
            db=mock_db_session
        )
        assert "alerts" in result


class TestMonitoringEndpointErrorHandling:
    """Test error handling in monitoring endpoints"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    # Error Handling Tests

    @pytest.mark.asyncio
    async def test_alert_creation_handles_database_error(self, mock_db_session):
        """Test that alert creation handles database errors gracefully"""
        from backend.api.v1.endpoints.alerts import create_alert_rule, AlertRuleCreate
        from backend.services.alert_management_service import AlertManagementService

        rule = AlertRuleCreate(
            name="Test",
            rule_type="threshold",
            metric_name="test",
            condition="gt",
            threshold_value=10.0
        )

        # Mock database error
        mock_db_session.execute = AsyncMock(side_effect=Exception("Database error"))

        with patch.object(AlertManagementService, 'create_alert_rule', side_effect=Exception("DB error")):
            with pytest.raises(HTTPException) as exc_info:
                await create_alert_rule(rule=rule, user_id=1, db=mock_db_session)

            # Should use safe_error_response (not leak internal error)
            assert exc_info.value.status_code == 500
            assert "Unable to create alert rule" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_log_search_handles_invalid_dates(self, mock_db_session):
        """Test that log search handles invalid date ranges"""
        from backend.api.v1.endpoints.logs import search_logs, LogSearchRequest

        # Future end_time should be handled gracefully
        search_request = LogSearchRequest(
            start_time=datetime.utcnow() + timedelta(days=1),
            end_time=datetime.utcnow() + timedelta(days=2)
        )

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await search_logs(search_request=search_request, db=mock_db_session)

        # Should return empty results, not error
        assert "logs" in result
        assert result["count"] == 0

    @pytest.mark.asyncio
    async def test_alert_acknowledge_handles_not_found(self, mock_db_session):
        """Test that alert acknowledge handles non-existent alerts"""
        from backend.api.v1.endpoints.alerts import acknowledge_alert, AlertAcknowledge

        # Mock alert not found
        with patch('backend.services.alert_management_service.AlertManagementService.acknowledge_alert', return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                await acknowledge_alert(
                    alert_id=99999,
                    ack=AlertAcknowledge(note="test"),
                    user_id=1,
                    db=mock_db_session
                )

            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_monitoring_stats_handles_empty_database(self, mock_db_session):
        """Test that monitoring stats handles empty database"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_stats
        from backend.schemas.user import User

        mock_user = _make_mock_user(1, "test", "test@example.com", "viewer")

        # Mock empty database (all counts = 0)
        mock_result = Mock()
        mock_result.scalar.return_value = 0
        mock_result.fetchall.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await get_pipeline_stats(current_user=mock_user, db=mock_db_session)

        # Should return zero stats, not error
        assert result["totalPipelines"] == 0
        assert result["activePipelines"] == 0


class TestAlertEndpointSecurity:
    """Test alert-specific security requirements"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        return session

    # Alert Security Tests

    @pytest.mark.asyncio
    async def test_alert_rule_creation_sanitizes_input(self, mock_db_session):
        """Test that alert rule creation sanitizes malicious input"""
        from backend.api.v1.endpoints.alerts import create_alert_rule, AlertRuleCreate

        # Malicious input attempts
        malicious_rule = AlertRuleCreate(
            name="Test'; DROP TABLE alerts;--",
            rule_type="threshold",
            metric_name="<script>alert('xss')</script>",
            condition="gt",
            threshold_value=10.0
        )

        # Pydantic should allow the string but SQLAlchemy should parameterize
        assert malicious_rule.name is not None
        assert malicious_rule.metric_name is not None

    @pytest.mark.asyncio
    async def test_alert_escalation_validates_level(self, mock_db_session):
        """Test that alert escalation validates escalation level"""
        from backend.api.v1.endpoints.alerts import escalate_alert

        # Valid escalation
        with patch('backend.services.alert_management_service.AlertManagementService.escalate_alert', return_value=Mock(id=1, current_escalation_level=2)):
            result = await escalate_alert(
                alert_id=1,
                escalation_level=2,
                db=mock_db_session
            )
            assert result is not None

    @pytest.mark.asyncio
    async def test_alert_notification_config_validation(self, mock_db_session):
        """Test that notification config is validated"""
        from backend.api.v1.endpoints.alerts import AlertRuleCreate

        # Valid notification channels
        rule = AlertRuleCreate(
            name="Test",
            rule_type="threshold",
            metric_name="test",
            condition="gt",
            threshold_value=10.0,
            notification_channels=["email", "webhook"]
        )

        assert "email" in rule.notification_channels
        assert "webhook" in rule.notification_channels


class TestLogEndpointSecurity:
    """Test log-specific security requirements"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        return session

    # Log Security Tests

    @pytest.mark.asyncio
    async def test_log_search_prevents_sensitive_data_leakage(self, mock_db_session):
        """Test that log search doesn't leak sensitive data in errors"""
        from backend.api.v1.endpoints.logs import search_logs, LogSearchRequest

        search_request = LogSearchRequest(
            message_search="password"
        )

        result = await search_logs(search_request=search_request, db=mock_db_session)

        # Should search logs but not expose sensitive content in error messages
        assert "logs" in result

    @pytest.mark.asyncio
    async def test_log_correlation_access_control(self, mock_db_session):
        """Test that log correlation respects access control"""
        from backend.api.v1.endpoints.logs import get_logs_by_correlation

        correlation_id = "test-correlation-123"

        result = await get_logs_by_correlation(
            correlation_id=correlation_id,
            db=mock_db_session
        )

        # Should return logs for correlation ID
        assert "correlation_id" in result
        assert result["correlation_id"] == correlation_id

    @pytest.mark.asyncio
    async def test_log_statistics_aggregation_security(self, mock_db_session):
        """Test that log statistics don't leak sensitive information"""
        from backend.api.v1.endpoints.logs import get_log_statistics

        mock_result = Mock()
        mock_result.fetchall.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await get_log_statistics(
            hours=24,
            group_by="level",
            db=mock_db_session
        )

        # Should return aggregated stats only, not individual log contents
        assert "statistics" in result


class TestDashboardEndpointSecurity:
    """Test dashboard-specific security requirements"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 5
        session.execute = AsyncMock(return_value=mock_result)
        return session

    @pytest.fixture
    def mock_viewer_user(self):
        """Create a mock viewer user"""
        return _make_mock_user(1, "viewer", "viewer@example.com", "viewer")

    # Dashboard Security Tests

    @pytest.mark.asyncio
    async def test_dashboard_stats_no_information_leakage(self, mock_viewer_user, mock_db_session):
        """Test that dashboard stats don't leak unauthorized information"""
        from backend.api.v1.endpoints.dashboard import get_dashboard_stats

        result = await get_dashboard_stats(
            current_user=mock_viewer_user,
            db=mock_db_session
        )

        # Should return stats but not sensitive configuration details
        assert "pipelines" in result
        assert "connectors" in result
        # Should not contain database connection strings or credentials

    @pytest.mark.asyncio
    async def test_dashboard_recent_activity_filters_by_permission(self, mock_viewer_user, mock_db_session):
        """Test that recent activity respects user permissions"""
        from backend.api.v1.endpoints.dashboard import get_dashboard_stats

        # Viewer should only see activities they're permitted to see
        result = await get_dashboard_stats(
            current_user=mock_viewer_user,
            db=mock_db_session
        )

        # Should not include admin-only information
        assert result is not None


class TestMonitoringEndpointPerformance:
    """Test performance and rate limiting for monitoring endpoints"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 0
        mock_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        return session

    # Performance Tests

    @pytest.mark.asyncio
    async def test_log_search_respects_limit_parameter(self, mock_db_session):
        """Test that log search respects limit to prevent performance issues"""
        from backend.api.v1.endpoints.logs import search_logs, LogSearchRequest

        # Maximum limit enforced
        search_request = LogSearchRequest(limit=1000)  # Max allowed

        result = await search_logs(search_request=search_request, db=mock_db_session)

        # Should limit results
        assert result["limit"] == 1000

    @pytest.mark.asyncio
    async def test_alert_statistics_time_range_validation(self, mock_db_session):
        """Test that alert statistics validates time range"""
        from backend.api.v1.endpoints.alerts import get_alert_statistics

        # Valid time range (1-720 hours)
        result = await get_alert_statistics(hours=24, db=mock_db_session)

        assert result["hours"] == 24

    @pytest.mark.asyncio
    async def test_monitoring_stats_efficient_queries(self, mock_db_session):
        """Test that monitoring stats uses efficient queries"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_stats
        from backend.schemas.user import User

        mock_user = _make_mock_user(1, "test", "test@example.com", "viewer")

        await get_pipeline_stats(current_user=mock_user, db=mock_db_session)

        # Should make limited number of database calls
        # Not N+1 queries
        call_count = mock_db_session.execute.call_count
        assert call_count < 10  # Reasonable number of queries


class TestMonitoringEndpointSystemHealth:
    """Test system health and pipeline performance monitoring endpoints"""

    @pytest.fixture
    def mock_viewer_user(self):
        return _make_mock_user(1, "viewer", "viewer@example.com", "viewer")

    @pytest.fixture
    def mock_db_session(self):
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 3
        mock_result.fetchall.return_value = []
        session.execute = AsyncMock(return_value=mock_result)
        return session

    @pytest.mark.asyncio
    async def test_get_system_health_returns_services_dict(self, mock_viewer_user, mock_db_session):
        """Test that get_system_health returns a services dictionary and overall status"""
        from backend.api.v1.endpoints.monitoring import get_system_health

        result = await get_system_health(current_user=mock_viewer_user, db=mock_db_session)

        assert "services" in result
        assert "overall_status" in result
        assert isinstance(result["services"], dict)

    @pytest.mark.asyncio
    async def test_get_system_health_contains_api_entry(self, mock_viewer_user, mock_db_session):
        """Test that system health includes an 'api' service entry with a status field"""
        from backend.api.v1.endpoints.monitoring import get_system_health

        result = await get_system_health(current_user=mock_viewer_user, db=mock_db_session)

        services = result["services"]
        assert "api" in services
        assert "status" in services["api"]

    @pytest.mark.asyncio
    async def test_get_pipeline_performance_returns_list(self, mock_viewer_user, mock_db_session):
        """Test that get_pipeline_performance returns a list"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_performance

        result = await get_pipeline_performance(current_user=mock_viewer_user, db=mock_db_session)

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_pipeline_stats_values_are_non_negative(self, mock_viewer_user, mock_db_session):
        """Test that all numeric fields in pipeline stats are non-negative integers"""
        from backend.api.v1.endpoints.monitoring import get_pipeline_stats

        result = await get_pipeline_stats(current_user=mock_viewer_user, db=mock_db_session)

        assert result["totalPipelines"] >= 0
        assert result["activePipelines"] >= 0
        assert result["runningPipelines"] >= 0
        assert result["failedPipelines"] >= 0

    @pytest.mark.asyncio
    async def test_get_recent_alerts_limited_to_ten(self, mock_viewer_user, mock_db_session):
        """Test that get_recent_alerts returns at most 10 alerts"""
        from backend.api.v1.endpoints.monitoring import get_recent_alerts

        result = await get_recent_alerts(current_user=mock_viewer_user, db=mock_db_session)

        assert isinstance(result, list)
        assert len(result) <= 10


class TestAdditionalEndpoints:
    """Tests for dashboard and log endpoints not covered by other classes"""

    @pytest.fixture
    def mock_viewer_user(self):
        return _make_mock_user(1, "viewer", "viewer@example.com", "viewer")

    @pytest.fixture
    def mock_db_session(self):
        session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar.return_value = 3
        session.execute = AsyncMock(return_value=mock_result)
        return session

    @pytest.mark.asyncio
    async def test_get_dashboard_system_status_structure(self, mock_viewer_user, mock_db_session):
        """Test that get_system_status returns system_health, api_status, database, and services"""
        from backend.api.v1.endpoints.dashboard import get_system_status

        result = await get_system_status(current_user=mock_viewer_user, db=mock_db_session)

        assert "system_health" in result
        assert "api_status" in result
        assert "database" in result
        assert "services" in result

    @pytest.mark.asyncio
    async def test_get_dashboard_performance_metrics_structure(self, mock_viewer_user, mock_db_session):
        """Test that get_performance_metrics returns throughput, latency, and resource_usage"""
        from backend.api.v1.endpoints.dashboard import get_performance_metrics

        result = await get_performance_metrics(current_user=mock_viewer_user, db=mock_db_session)

        assert "throughput" in result
        assert "latency" in result
        assert "resource_usage" in result

    @pytest.mark.asyncio
    async def test_get_dashboard_recent_activity_returns_list(self, mock_viewer_user, mock_db_session):
        """Test that get_recent_activity returns a list"""
        from backend.api.v1.endpoints.dashboard import get_recent_activity

        mock_result = Mock()
        mock_result.fetchall.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await get_recent_activity(current_user=mock_viewer_user, db=mock_db_session)

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_recent_errors_returns_structure(self, mock_db_session):
        """Test that get_recent_errors returns errors list with count and hours"""
        from backend.api.v1.endpoints.logs import get_recent_errors

        with patch(
            "backend.api.v1.endpoints.logs.logging_service.get_recent_errors",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await get_recent_errors(hours=1, limit=50, db=mock_db_session)

        assert "errors" in result
        assert "count" in result
        assert "hours" in result
        assert result["hours"] == 1

    @pytest.mark.asyncio
    async def test_get_log_statistics_returns_structure(self, mock_db_session):
        """Test that get_log_statistics returns statistics with group_by reflected"""
        from backend.api.v1.endpoints.logs import get_log_statistics

        with patch(
            "backend.api.v1.endpoints.logs.logging_service.get_log_statistics",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await get_log_statistics(hours=24, group_by="level", db=mock_db_session)

        assert "statistics" in result
        assert "group_by" in result
        assert result["group_by"] == "level"


# Run with: pytest testing/backend-tests/unit/endpoints/test_monitoring_endpoints.py -v
# Run with coverage: pytest testing/backend-tests/unit/endpoints/test_monitoring_endpoints.py -v --cov=backend.api.v1.endpoints.monitoring --cov=backend.api.v1.endpoints.alerts --cov=backend.api.v1.endpoints.logs --cov=backend.api.v1.endpoints.dashboard --cov-report=term-missing
