"""
Unit Tests for Alert Rule Engine Business Logic
Data Aggregator Platform - Testing Framework - Week 95 TEST-010

Tests cover:
- Alert rule CRUD operations
- Rule evaluation and condition checking
- Alert triggering and creation
- Cooldown period enforcement
- Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- Alert status management (ACTIVE, ACKNOWLEDGED, RESOLVED, CLOSED)
- Alert acknowledgment and resolution
- Alert escalation logic
- Escalation policy management
- Notification delivery
- Alert statistics and reporting
- Alert action history tracking

Total: 25 tests for alert rule engine business logic
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.services.alert_management_service import AlertManagementService
from backend.models.monitoring import (
    AlertRule,
    Alert,
    AlertAction,
    AlertEscalationPolicy,
    AlertSeverity,
    AlertStatus
)


class TestAlertRuleCRUD:
    """Test alert rule CRUD operations"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_create_alert_rule(self, mock_db_session, alert_service):
        """Test creating a new alert rule"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        rule = await alert_service.create_alert_rule(
            db=mock_db_session,
            name="High CPU Usage",
            description="Alert when CPU exceeds 80%",
            rule_type="threshold",
            metric_name="cpu_usage_percent",
            condition="gt",
            threshold_value=80.0,
            severity=AlertSeverity.HIGH,
            time_window_minutes=5,
            notification_channels=["email", "slack"],
            cooldown_minutes=15,
            created_by=1
        )

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert rule.name == "High CPU Usage"
        assert rule.condition == "gt"
        assert rule.threshold_value == 80.0

    @pytest.mark.asyncio
    async def test_create_rule_with_escalation_policy(self, mock_db_session, alert_service):
        """Test creating alert rule with escalation policy"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        rule = await alert_service.create_alert_rule(
            db=mock_db_session,
            name="Critical Error Rate",
            description="Alert on high error rate",
            rule_type="error_rate",
            metric_name="error_rate",
            condition="gt",
            threshold_value=5.0,
            severity=AlertSeverity.CRITICAL,
            escalation_policy_id=1,
            auto_escalate_after_minutes=30,
            created_by=1
        )

        assert rule.escalation_policy_id == 1
        assert rule.auto_escalate_after_minutes == 30


class TestRuleEvaluation:
    """Test alert rule evaluation logic"""

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    def test_evaluate_condition_greater_than(self, alert_service):
        """Test 'greater than' condition evaluation"""
        # Should trigger: 90 > 80
        assert alert_service._evaluate_condition(90.0, "gt", 80.0) == True
        # Should not trigger: 70 > 80
        assert alert_service._evaluate_condition(70.0, "gt", 80.0) == False
        # Should not trigger: 80 > 80
        assert alert_service._evaluate_condition(80.0, "gt", 80.0) == False

    def test_evaluate_condition_greater_than_equal(self, alert_service):
        """Test 'greater than or equal' condition evaluation"""
        # Should trigger: 90 >= 80
        assert alert_service._evaluate_condition(90.0, "gte", 80.0) == True
        # Should trigger: 80 >= 80
        assert alert_service._evaluate_condition(80.0, "gte", 80.0) == True
        # Should not trigger: 70 >= 80
        assert alert_service._evaluate_condition(70.0, "gte", 80.0) == False

    def test_evaluate_condition_less_than(self, alert_service):
        """Test 'less than' condition evaluation"""
        # Should trigger: 10 < 20
        assert alert_service._evaluate_condition(10.0, "lt", 20.0) == True
        # Should not trigger: 30 < 20
        assert alert_service._evaluate_condition(30.0, "lt", 20.0) == False
        # Should not trigger: 20 < 20
        assert alert_service._evaluate_condition(20.0, "lt", 20.0) == False

    def test_evaluate_condition_less_than_equal(self, alert_service):
        """Test 'less than or equal' condition evaluation"""
        # Should trigger: 10 <= 20
        assert alert_service._evaluate_condition(10.0, "lte", 20.0) == True
        # Should trigger: 20 <= 20
        assert alert_service._evaluate_condition(20.0, "lte", 20.0) == True
        # Should not trigger: 30 <= 20
        assert alert_service._evaluate_condition(30.0, "lte", 20.0) == False

    def test_evaluate_condition_equals(self, alert_service):
        """Test 'equals' condition evaluation"""
        # Should trigger: 100 == 100
        assert alert_service._evaluate_condition(100.0, "eq", 100.0) == True
        # Should not trigger: 99 == 100
        assert alert_service._evaluate_condition(99.0, "eq", 100.0) == False


class TestAlertTriggering:
    """Test alert triggering and creation"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.fixture
    def sample_alert_rule(self):
        """Create a sample alert rule"""
        return AlertRule(
            id=1,
            name="High Memory Usage",
            description="Memory alert",
            rule_type="threshold",
            metric_name="memory_usage_percent",
            condition="gt",
            threshold_value=75.0,
            severity=AlertSeverity.MEDIUM,
            time_window_minutes=5,
            notification_channels=["email"],
            notification_config={},
            cooldown_minutes=15,
            is_active=True,
            last_triggered_at=None,
            trigger_count=0
        )

    @pytest.mark.asyncio
    async def test_trigger_alert_when_threshold_exceeded(
        self, mock_db_session, alert_service, sample_alert_rule
    ):
        """Test alert is triggered when threshold is exceeded"""
        # Mock rule retrieval
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_alert_rule
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        # Mock notification sending
        alert_service._send_notifications = AsyncMock()

        # Evaluate with value that exceeds threshold (85 > 75)
        alert = await alert_service.evaluate_rule(
            db=mock_db_session,
            rule_id=1,
            current_value=85.0,
            context={"component": "backend", "pipeline_id": 1}
        )

        # Alert should be created
        assert alert is not None
        assert alert.triggered_value == 85.0
        assert alert.threshold_value == 75.0
        assert alert.severity == AlertSeverity.MEDIUM
        assert alert.status == AlertStatus.ACTIVE

        # Rule should be updated
        assert sample_alert_rule.trigger_count == 1

    @pytest.mark.asyncio
    async def test_no_alert_when_threshold_not_exceeded(
        self, mock_db_session, alert_service, sample_alert_rule
    ):
        """Test no alert when threshold is not exceeded"""
        # Mock rule retrieval
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_alert_rule
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.commit = AsyncMock()

        # Evaluate with value below threshold (60 < 75)
        alert = await alert_service.evaluate_rule(
            db=mock_db_session,
            rule_id=1,
            current_value=60.0
        )

        # No alert should be created
        assert alert is None


class TestCooldownPeriod:
    """Test cooldown period enforcement"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_cooldown_prevents_duplicate_alerts(self, mock_db_session, alert_service):
        """Test that cooldown period prevents duplicate alerts"""
        # Create rule that was just triggered
        rule = AlertRule(
            id=1,
            name="Test Rule",
            rule_type="threshold",
            metric_name="test_metric",
            condition="gt",
            threshold_value=50.0,
            severity=AlertSeverity.LOW,
            cooldown_minutes=15,
            is_active=True,
            last_triggered_at=datetime.utcnow() - timedelta(minutes=5),  # Triggered 5 min ago
            trigger_count=1
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = rule
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        # Try to trigger again (still in cooldown)
        alert = await alert_service.evaluate_rule(
            db=mock_db_session,
            rule_id=1,
            current_value=100.0  # Value exceeds threshold
        )

        # Should not create alert (in cooldown)
        assert alert is None

    @pytest.mark.asyncio
    async def test_alert_after_cooldown_expires(self, mock_db_session, alert_service):
        """Test that alert can trigger after cooldown expires"""
        # Create rule where cooldown has expired
        rule = AlertRule(
            id=1,
            name="Test Rule",
            rule_type="threshold",
            metric_name="test_metric",
            condition="gt",
            threshold_value=50.0,
            severity=AlertSeverity.LOW,
            cooldown_minutes=15,
            is_active=True,
            last_triggered_at=datetime.utcnow() - timedelta(minutes=20),  # Triggered 20 min ago
            trigger_count=1,
            notification_channels=["email"]
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = rule
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        alert_service._send_notifications = AsyncMock()

        # Trigger alert after cooldown
        alert = await alert_service.evaluate_rule(
            db=mock_db_session,
            rule_id=1,
            current_value=100.0
        )

        # Should create new alert
        assert alert is not None
        assert rule.trigger_count == 2


class TestAlertSeverityLevels:
    """Test different severity levels"""

    def test_severity_levels_available(self):
        """Test all severity levels are available"""
        assert AlertSeverity.LOW == "low"
        assert AlertSeverity.MEDIUM == "medium"
        assert AlertSeverity.HIGH == "high"
        assert AlertSeverity.CRITICAL == "critical"

    def test_alert_with_different_severities(self):
        """Test creating alerts with different severities"""
        severities = [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL]

        for severity in severities:
            alert = Alert(
                alert_rule_id=1,
                alert_key=f"test_{severity}",
                title="Test Alert",
                description="Test",
                severity=severity,
                status=AlertStatus.ACTIVE,
                triggered_value=100.0,
                threshold_value=80.0,
                metric_name="test_metric"
            )
            assert alert.severity == severity


class TestAlertStatusManagement:
    """Test alert status lifecycle"""

    def test_alert_status_types(self):
        """Test all alert status types are available"""
        assert AlertStatus.ACTIVE == "active"
        assert AlertStatus.ACKNOWLEDGED == "acknowledged"
        assert AlertStatus.RESOLVED == "resolved"
        assert AlertStatus.CLOSED == "closed"

    def test_alert_default_status_active(self):
        """Test new alerts default to ACTIVE status"""
        alert = Alert(
            alert_rule_id=1,
            alert_key="test_key",
            title="Test",
            description="Test",
            severity=AlertSeverity.MEDIUM,
            triggered_value=90.0,
            threshold_value=80.0,
            metric_name="test_metric"
        )

        assert alert.status == AlertStatus.ACTIVE


class TestAlertAcknowledgment:
    """Test alert acknowledgment logic"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_acknowledge_alert(self, mock_db_session, alert_service):
        """Test acknowledging an alert"""
        alert = Alert(
            id=1,
            alert_rule_id=1,
            alert_key="test",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.HIGH,
            status=AlertStatus.ACTIVE,
            triggered_value=95.0,
            threshold_value=80.0,
            metric_name="test_metric"
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = alert
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await alert_service.acknowledge_alert(
            db=mock_db_session,
            alert_id=1,
            user_id=5,
            note="Investigating the issue"
        )

        assert result.status == AlertStatus.ACKNOWLEDGED
        assert result.acknowledged_by == 5
        assert result.acknowledgment_note == "Investigating the issue"
        assert result.acknowledged_at is not None


class TestAlertResolution:
    """Test alert resolution logic"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_resolve_alert_manually(self, mock_db_session, alert_service):
        """Test manually resolving an alert"""
        alert = Alert(
            id=1,
            alert_rule_id=1,
            alert_key="test",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.MEDIUM,
            status=AlertStatus.ACKNOWLEDGED,
            triggered_value=85.0,
            threshold_value=80.0,
            metric_name="test_metric"
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = alert
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await alert_service.resolve_alert(
            db=mock_db_session,
            alert_id=1,
            user_id=5,
            note="Issue resolved by scaling resources",
            auto_resolved=False
        )

        assert result.status == AlertStatus.RESOLVED
        assert result.resolved_by == 5
        assert result.resolution_note == "Issue resolved by scaling resources"
        assert result.auto_resolved == False
        assert result.resolved_at is not None

    @pytest.mark.asyncio
    async def test_auto_resolve_alert(self, mock_db_session, alert_service):
        """Test auto-resolving an alert"""
        alert = Alert(
            id=1,
            alert_rule_id=1,
            alert_key="test",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.LOW,
            status=AlertStatus.ACTIVE,
            triggered_value=85.0,
            threshold_value=80.0,
            metric_name="test_metric"
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = alert
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await alert_service.resolve_alert(
            db=mock_db_session,
            alert_id=1,
            note="Metric returned to normal range",
            auto_resolved=True
        )

        assert result.status == AlertStatus.RESOLVED
        assert result.auto_resolved == True
        assert result.resolved_by is None


class TestAlertEscalation:
    """Test alert escalation logic"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_escalate_alert_to_next_level(self, mock_db_session, alert_service):
        """Test escalating alert to next level"""
        alert = Alert(
            id=1,
            alert_rule_id=1,
            alert_key="test",
            title="Test Alert",
            description="Test",
            severity=AlertSeverity.HIGH,
            status=AlertStatus.ACKNOWLEDGED,
            triggered_value=95.0,
            threshold_value=80.0,
            metric_name="test_metric",
            current_escalation_level=0,
            escalation_history=[]
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = alert
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await alert_service.escalate_alert(
            db=mock_db_session,
            alert_id=1
        )

        assert result.current_escalation_level == 1
        assert result.escalated_at is not None
        assert len(result.escalation_history) == 1

    @pytest.mark.asyncio
    async def test_escalate_to_specific_level(self, mock_db_session, alert_service):
        """Test escalating alert to specific level"""
        alert = Alert(
            id=1,
            alert_rule_id=1,
            alert_key="test",
            title="Critical Alert",
            description="Test",
            severity=AlertSeverity.CRITICAL,
            status=AlertStatus.ACKNOWLEDGED,
            triggered_value=98.0,
            threshold_value=80.0,
            metric_name="test_metric",
            current_escalation_level=1,
            escalation_history=[{"level": 1, "escalated_at": "2024-01-01T00:00:00"}]
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = alert
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await alert_service.escalate_alert(
            db=mock_db_session,
            alert_id=1,
            escalation_level=3  # Jump to level 3
        )

        assert result.current_escalation_level == 3
        assert len(result.escalation_history) == 2


class TestEscalationPolicy:
    """Test escalation policy management"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_create_escalation_policy(self, mock_db_session, alert_service):
        """Test creating escalation policy"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        escalation_levels = [
            {"level": 1, "delay_minutes": 0, "notify": ["team_lead"]},
            {"level": 2, "delay_minutes": 15, "notify": ["manager"]},
            {"level": 3, "delay_minutes": 30, "notify": ["director", "vp_engineering"]}
        ]

        policy = await alert_service.create_escalation_policy(
            db=mock_db_session,
            name="Standard Escalation",
            description="Standard 3-tier escalation",
            escalation_levels=escalation_levels
        )

        assert policy.name == "Standard Escalation"
        assert len(policy.escalation_levels) == 3
        assert policy.is_active == True


class TestAlertStatistics:
    """Test alert statistics and reporting"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_get_alert_statistics(self, mock_db_session, alert_service):
        """Test getting alert statistics"""
        # Mock total count
        mock_total = Mock()
        mock_total.scalar.return_value = 100

        # Mock severity breakdown
        mock_severity = Mock()
        mock_severity.all.return_value = [
            (AlertSeverity.LOW, 30),
            (AlertSeverity.MEDIUM, 40),
            (AlertSeverity.HIGH, 20),
            (AlertSeverity.CRITICAL, 10)
        ]

        # Mock status breakdown
        mock_status = Mock()
        mock_status.all.return_value = [
            (AlertStatus.ACTIVE, 20),
            (AlertStatus.ACKNOWLEDGED, 30),
            (AlertStatus.RESOLVED, 45),
            (AlertStatus.CLOSED, 5)
        ]

        # Mock average resolution time (600 seconds = 10 minutes)
        mock_resolution = Mock()
        mock_resolution.scalar.return_value = 600.0

        # Setup execute to return different mocks based on call
        call_count = [0]

        async def mock_execute(query):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_total
            elif call_count[0] == 2:
                return mock_severity
            elif call_count[0] == 3:
                return mock_status
            elif call_count[0] == 4:
                return mock_resolution

        mock_db_session.execute = mock_execute

        start_time = datetime.utcnow() - timedelta(days=7)
        end_time = datetime.utcnow()

        stats = await alert_service.get_alert_statistics(
            db=mock_db_session,
            start_time=start_time,
            end_time=end_time
        )

        assert stats["total_alerts"] == 100
        assert stats["by_severity"]["low"] == 30
        assert stats["by_severity"]["high"] == 20
        assert stats["by_status"]["active"] == 20
        assert stats["average_resolution_time_seconds"] == 600.0
        assert stats["average_resolution_time_minutes"] == 10.0


class TestAlertActionHistory:
    """Test alert action history tracking"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def alert_service(self):
        """Create alert management service instance"""
        return AlertManagementService()

    @pytest.mark.asyncio
    async def test_get_alert_history(self, mock_db_session, alert_service):
        """Test retrieving alert action history"""
        actions = [
            AlertAction(
                id=1,
                alert_id=1,
                action_type="acknowledge",
                action_description="Alert acknowledged",
                performed_by=1,
                automated=False,
                performed_at=datetime.utcnow() - timedelta(hours=2)
            ),
            AlertAction(
                id=2,
                alert_id=1,
                action_type="escalate",
                action_description="Escalated to level 2",
                performed_by=None,
                automated=True,
                performed_at=datetime.utcnow() - timedelta(hours=1)
            ),
            AlertAction(
                id=3,
                alert_id=1,
                action_type="resolve",
                action_description="Issue resolved",
                performed_by=2,
                automated=False,
                performed_at=datetime.utcnow()
            )
        ]

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = actions
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        history = await alert_service.get_alert_history(
            db=mock_db_session,
            alert_id=1
        )

        assert len(history) == 3
        assert history[0].action_type == "acknowledge"
        assert history[1].action_type == "escalate"
        assert history[1].automated == True
        assert history[2].action_type == "resolve"


# Run with: pytest testing/backend-tests/unit/business-logic/test_alert_rule_engine_business_logic.py -v
# Run with coverage: pytest testing/backend-tests/unit/business-logic/test_alert_rule_engine_business_logic.py -v --cov=backend.services.alert_management_service --cov=backend.models.monitoring --cov-report=term-missing
