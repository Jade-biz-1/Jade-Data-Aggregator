"""
Alert Management Service

Handles alert rules, thresholds, escalation, and notification delivery.
Part of Sub-Phase 5B: Advanced Monitoring (B017)
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc

from backend.models.monitoring import (
    AlertRule,
    Alert,
    AlertAction,
    AlertEscalationPolicy,
    AlertSeverity,
    AlertStatus
)


class AlertManagementService:
    """Service for managing alerts, rules, and escalation policies"""

    async def create_alert_rule(
        self,
        db: AsyncSession,
        name: str,
        description: Optional[str],
        rule_type: str,
        metric_name: str,
        condition: str,
        threshold_value: float,
        severity: AlertSeverity = AlertSeverity.MEDIUM,
        time_window_minutes: int = 5,
        notification_channels: Optional[List[str]] = None,
        notification_config: Optional[Dict[str, Any]] = None,
        cooldown_minutes: int = 15,
        escalation_policy_id: Optional[int] = None,
        auto_escalate_after_minutes: Optional[int] = None,
        query_config: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> AlertRule:
        """
        Create a new alert rule

        Args:
            db: Database session
            name: Rule name (must be unique)
            description: Rule description
            rule_type: Type of rule ("threshold", "anomaly", "error_rate")
            metric_name: Metric to monitor
            condition: Condition operator ("gt", "lt", "eq", "gte", "lte")
            threshold_value: Threshold value
            severity: Alert severity
            time_window_minutes: Evaluation time window
            notification_channels: List of notification channels
            notification_config: Channel-specific configuration
            cooldown_minutes: Cooldown period between alerts
            escalation_policy_id: Escalation policy ID
            auto_escalate_after_minutes: Auto-escalation delay
            query_config: Additional query parameters
            created_by: User ID who created the rule

        Returns:
            Created AlertRule
        """
        alert_rule = AlertRule(
            name=name,
            description=description,
            rule_type=rule_type,
            metric_name=metric_name,
            condition=condition,
            threshold_value=threshold_value,
            severity=severity,
            time_window_minutes=time_window_minutes,
            notification_channels=notification_channels or ["email"],
            notification_config=notification_config or {},
            cooldown_minutes=cooldown_minutes,
            escalation_policy_id=escalation_policy_id,
            auto_escalate_after_minutes=auto_escalate_after_minutes,
            query_config=query_config or {},
            created_by=created_by,
            is_active=True
        )

        db.add(alert_rule)
        await db.commit()
        await db.refresh(alert_rule)

        return alert_rule

    async def evaluate_rule(
        self,
        db: AsyncSession,
        rule_id: int,
        current_value: float,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[Alert]:
        """
        Evaluate an alert rule and create alert if threshold is exceeded

        Args:
            db: Database session
            rule_id: Alert rule ID
            current_value: Current metric value
            context: Additional context for the alert

        Returns:
            Created Alert if rule triggered, None otherwise
        """
        # Get rule
        result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
        rule = result.scalar_one_or_none()

        if not rule or not rule.is_active:
            return None

        # Check cooldown
        if rule.last_triggered_at:
            cooldown_end = rule.last_triggered_at + timedelta(minutes=rule.cooldown_minutes)
            if datetime.utcnow() < cooldown_end:
                return None  # Still in cooldown

        # Evaluate condition
        triggered = self._evaluate_condition(
            current_value,
            rule.condition,
            rule.threshold_value
        )

        if not triggered:
            # Update last evaluated timestamp
            rule.last_evaluated_at = datetime.utcnow()
            await db.commit()
            return None

        # Create alert
        alert_key = f"{rule.name}_{rule.metric_name}"

        alert = Alert(
            alert_rule_id=rule.id,
            alert_key=alert_key,
            title=f"{rule.name} - Threshold Exceeded",
            description=f"{rule.metric_name} is {current_value}, threshold is {rule.threshold_value}",
            severity=rule.severity,
            status=AlertStatus.ACTIVE,
            triggered_value=current_value,
            threshold_value=rule.threshold_value,
            metric_name=rule.metric_name,
            component=context.get("component") if context else None,
            pipeline_id=context.get("pipeline_id") if context else None,
            resource_type=context.get("resource_type") if context else None,
            resource_id=context.get("resource_id") if context else None,
            alert_data=context or {},
            evaluation_data={"current_value": current_value, "threshold": rule.threshold_value},
            notifications_sent=[]
        )

        db.add(alert)

        # Update rule
        rule.last_triggered_at = datetime.utcnow()
        rule.last_evaluated_at = datetime.utcnow()
        rule.trigger_count += 1

        await db.commit()
        await db.refresh(alert)

        # Send notifications
        await self._send_notifications(db, alert, rule)

        return alert

    def _evaluate_condition(
        self,
        current_value: float,
        condition: str,
        threshold: float
    ) -> bool:
        """Evaluate alert condition"""
        if condition == "gt":
            return current_value > threshold
        elif condition == "gte":
            return current_value >= threshold
        elif condition == "lt":
            return current_value < threshold
        elif condition == "lte":
            return current_value <= threshold
        elif condition == "eq":
            return current_value == threshold
        return False

    async def _send_notifications(
        self,
        db: AsyncSession,
        alert: Alert,
        rule: AlertRule
    ):
        """Send alert notifications"""
        notifications_sent = []

        for channel in rule.notification_channels or []:
            try:
                if channel == "email":
                    # Email notification logic
                    success = await self._send_email_notification(alert, rule)
                elif channel == "slack":
                    # Slack notification logic
                    success = await self._send_slack_notification(alert, rule)
                elif channel == "webhook":
                    # Webhook notification logic
                    success = await self._send_webhook_notification(alert, rule)
                else:
                    success = False

                notifications_sent.append({
                    "channel": channel,
                    "sent_at": datetime.utcnow().isoformat(),
                    "success": success
                })
            except Exception as e:
                notifications_sent.append({
                    "channel": channel,
                    "sent_at": datetime.utcnow().isoformat(),
                    "success": False,
                    "error": str(e)
                })

        alert.notifications_sent = notifications_sent
        alert.last_notification_at = datetime.utcnow()
        await db.commit()

    async def _send_email_notification(
        self,
        alert: Alert,
        rule: AlertRule
    ) -> bool:
        """Send email notification (placeholder)"""
        # TODO: Integrate with email service
        return True

    async def _send_slack_notification(
        self,
        alert: Alert,
        rule: AlertRule
    ) -> bool:
        """Send Slack notification (placeholder)"""
        # TODO: Integrate with Slack API
        return True

    async def _send_webhook_notification(
        self,
        alert: Alert,
        rule: AlertRule
    ) -> bool:
        """Send webhook notification (placeholder)"""
        # TODO: Send HTTP POST to webhook URL
        return True

    async def acknowledge_alert(
        self,
        db: AsyncSession,
        alert_id: int,
        user_id: int,
        note: Optional[str] = None
    ) -> Optional[Alert]:
        """
        Acknowledge an alert

        Args:
            db: Database session
            alert_id: Alert ID
            user_id: User acknowledging the alert
            note: Acknowledgment note

        Returns:
            Updated Alert
        """
        result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by = user_id
        alert.acknowledgment_note = note

        # Create action record
        action = AlertAction(
            alert_id=alert.id,
            action_type="acknowledge",
            action_description=note or "Alert acknowledged",
            performed_by=user_id,
            automated=False
        )
        db.add(action)

        await db.commit()
        await db.refresh(alert)

        return alert

    async def resolve_alert(
        self,
        db: AsyncSession,
        alert_id: int,
        user_id: Optional[int] = None,
        note: Optional[str] = None,
        auto_resolved: bool = False
    ) -> Optional[Alert]:
        """
        Resolve an alert

        Args:
            db: Database session
            alert_id: Alert ID
            user_id: User resolving the alert
            note: Resolution note
            auto_resolved: Whether alert was auto-resolved

        Returns:
            Updated Alert
        """
        result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = user_id
        alert.resolution_note = note
        alert.auto_resolved = auto_resolved

        # Create action record
        action = AlertAction(
            alert_id=alert.id,
            action_type="resolve",
            action_description=note or "Alert resolved",
            performed_by=user_id,
            automated=auto_resolved
        )
        db.add(action)

        await db.commit()
        await db.refresh(alert)

        return alert

    async def escalate_alert(
        self,
        db: AsyncSession,
        alert_id: int,
        escalation_level: Optional[int] = None
    ) -> Optional[Alert]:
        """
        Escalate an alert to next level

        Args:
            db: Database session
            alert_id: Alert ID
            escalation_level: Target escalation level (None for next level)

        Returns:
            Updated Alert
        """
        result = await db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()

        if not alert:
            return None

        # Determine target escalation level
        if escalation_level is None:
            escalation_level = alert.current_escalation_level + 1

        alert.current_escalation_level = escalation_level
        alert.escalated_at = datetime.utcnow()

        # Update escalation history
        history = alert.escalation_history or []
        history.append({
            "level": escalation_level,
            "escalated_at": datetime.utcnow().isoformat()
        })
        alert.escalation_history = history

        # Create action record
        action = AlertAction(
            alert_id=alert.id,
            action_type="escalate",
            action_description=f"Alert escalated to level {escalation_level}",
            automated=True
        )
        db.add(action)

        await db.commit()
        await db.refresh(alert)

        # TODO: Send escalation notifications

        return alert

    async def get_active_alerts(
        self,
        db: AsyncSession,
        severity: Optional[AlertSeverity] = None,
        pipeline_id: Optional[int] = None,
        limit: int = 100
    ) -> List[Alert]:
        """Get active alerts"""
        query = select(Alert).where(
            Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED])
        )

        if severity:
            query = query.where(Alert.severity == severity)
        if pipeline_id is not None:
            query = query.where(Alert.pipeline_id == pipeline_id)

        query = query.order_by(Alert.triggered_at.desc()).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_alert_statistics(
        self,
        db: AsyncSession,
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, Any]:
        """
        Get alert statistics for time period

        Args:
            db: Database session
            start_time: Start time
            end_time: End time

        Returns:
            Statistics dict
        """
        # Total alerts
        total_result = await db.execute(
            select(func.count(Alert.id)).where(
                and_(
                    Alert.triggered_at >= start_time,
                    Alert.triggered_at <= end_time
                )
            )
        )
        total_alerts = total_result.scalar()

        # Alerts by severity
        severity_result = await db.execute(
            select(
                Alert.severity,
                func.count(Alert.id).label('count')
            ).where(
                and_(
                    Alert.triggered_at >= start_time,
                    Alert.triggered_at <= end_time
                )
            ).group_by(Alert.severity)
        )
        by_severity = {row[0].value: row[1] for row in severity_result.all()}

        # Alerts by status
        status_result = await db.execute(
            select(
                Alert.status,
                func.count(Alert.id).label('count')
            ).where(
                and_(
                    Alert.triggered_at >= start_time,
                    Alert.triggered_at <= end_time
                )
            ).group_by(Alert.status)
        )
        by_status = {row[0].value: row[1] for row in status_result.all()}

        # Average resolution time
        resolution_result = await db.execute(
            select(
                func.avg(
                    func.extract('epoch', Alert.resolved_at - Alert.triggered_at)
                )
            ).where(
                and_(
                    Alert.triggered_at >= start_time,
                    Alert.triggered_at <= end_time,
                    Alert.resolved_at.isnot(None)
                )
            )
        )
        avg_resolution_seconds = resolution_result.scalar() or 0

        return {
            "total_alerts": total_alerts,
            "by_severity": by_severity,
            "by_status": by_status,
            "average_resolution_time_seconds": avg_resolution_seconds,
            "average_resolution_time_minutes": avg_resolution_seconds / 60 if avg_resolution_seconds else 0
        }

    async def create_escalation_policy(
        self,
        db: AsyncSession,
        name: str,
        description: Optional[str],
        escalation_levels: List[Dict[str, Any]]
    ) -> AlertEscalationPolicy:
        """
        Create an escalation policy

        Args:
            db: Database session
            name: Policy name
            description: Policy description
            escalation_levels: List of escalation level configurations

        Returns:
            Created AlertEscalationPolicy
        """
        policy = AlertEscalationPolicy(
            name=name,
            description=description,
            escalation_levels=escalation_levels,
            is_active=True
        )

        db.add(policy)
        await db.commit()
        await db.refresh(policy)

        return policy

    async def get_alert_history(
        self,
        db: AsyncSession,
        alert_id: int
    ) -> List[AlertAction]:
        """Get complete action history for an alert"""
        result = await db.execute(
            select(AlertAction).where(
                AlertAction.alert_id == alert_id
            ).order_by(AlertAction.performed_at.asc())
        )
        return list(result.scalars().all())
