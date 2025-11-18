"""
Alert Management API Endpoints

API endpoints for alert rules, alerts, and escalation policies.
Part of Sub-Phase 5B: Advanced Monitoring
Updated: Phase 11A - SEC-002 (Fixed error message leakage)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from backend.core.database import get_db
from backend.core.error_handler import safe_error_response
from backend.services.alert_management_service import AlertManagementService
from backend.models.monitoring import AlertSeverity, AlertStatus


router = APIRouter(prefix="/alerts", tags=["alerts"])
alert_service = AlertManagementService()


# Pydantic models
class AlertRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str = Field(..., pattern="^(threshold|anomaly|error_rate)$")
    metric_name: str
    condition: str = Field(..., pattern="^(gt|gte|lt|lte|eq)$")
    threshold_value: float
    severity: AlertSeverity = AlertSeverity.MEDIUM
    time_window_minutes: int = Field(default=5, ge=1, le=1440)
    notification_channels: Optional[List[str]] = ["email"]
    notification_config: Optional[Dict[str, Any]] = None
    cooldown_minutes: int = Field(default=15, ge=1, le=1440)
    escalation_policy_id: Optional[int] = None
    auto_escalate_after_minutes: Optional[int] = None
    query_config: Optional[Dict[str, Any]] = None


class AlertRuleEvaluate(BaseModel):
    current_value: float
    context: Optional[Dict[str, Any]] = None


class AlertAcknowledge(BaseModel):
    note: Optional[str] = None


class AlertResolve(BaseModel):
    note: Optional[str] = None


class EscalationPolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    escalation_levels: List[Dict[str, Any]]


# Alert Rule Endpoints

@router.post("/rules", status_code=201)
async def create_alert_rule(
    rule: AlertRuleCreate,
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new alert rule"""
    try:
        alert_rule = await alert_service.create_alert_rule(
            db=db,
            name=rule.name,
            description=rule.description,
            rule_type=rule.rule_type,
            metric_name=rule.metric_name,
            condition=rule.condition,
            threshold_value=rule.threshold_value,
            severity=rule.severity,
            time_window_minutes=rule.time_window_minutes,
            notification_channels=rule.notification_channels,
            notification_config=rule.notification_config,
            cooldown_minutes=rule.cooldown_minutes,
            escalation_policy_id=rule.escalation_policy_id,
            auto_escalate_after_minutes=rule.auto_escalate_after_minutes,
            query_config=rule.query_config,
            created_by=user_id
        )

        return {
            "id": alert_rule.id,
            "name": alert_rule.name,
            "rule_type": alert_rule.rule_type,
            "metric_name": alert_rule.metric_name,
            "condition": alert_rule.condition,
            "threshold_value": alert_rule.threshold_value,
            "severity": alert_rule.severity.value,
            "is_active": alert_rule.is_active,
            "created_at": alert_rule.created_at
        }
    except Exception as e:
        raise safe_error_response(500, "Unable to create alert rule", internal_error=e)


@router.post("/rules/{rule_id}/evaluate")
async def evaluate_alert_rule(
    rule_id: int,
    evaluation: AlertRuleEvaluate,
    db: AsyncSession = Depends(get_db)
):
    """Evaluate an alert rule"""
    try:
        alert = await alert_service.evaluate_rule(
            db=db,
            rule_id=rule_id,
            current_value=evaluation.current_value,
            context=evaluation.context
        )

        if alert:
            return {
                "triggered": True,
                "alert": {
                    "id": alert.id,
                    "title": alert.title,
                    "severity": alert.severity.value,
                    "status": alert.status.value,
                    "triggered_value": alert.triggered_value,
                    "threshold_value": alert.threshold_value,
                    "triggered_at": alert.triggered_at
                }
            }
        else:
            return {
                "triggered": False,
                "alert": None,
                "message": "Rule not triggered or in cooldown"
            }
    except Exception as e:
        raise safe_error_response(500, "Unable to evaluate alert rule", internal_error=e)


# Alert Endpoints

@router.get("/")
async def get_active_alerts(
    severity: Optional[AlertSeverity] = None,
    pipeline_id: Optional[int] = None,
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Get active alerts"""
    try:
        alerts = await alert_service.get_active_alerts(
            db=db,
            severity=severity,
            pipeline_id=pipeline_id,
            limit=limit
        )

        return {
            "alerts": [
                {
                    "id": alert.id,
                    "title": alert.title,
                    "description": alert.description,
                    "severity": alert.severity.value,
                    "status": alert.status.value,
                    "triggered_value": alert.triggered_value,
                    "threshold_value": alert.threshold_value,
                    "metric_name": alert.metric_name,
                    "pipeline_id": alert.pipeline_id,
                    "component": alert.component,
                    "triggered_at": alert.triggered_at,
                    "acknowledged_at": alert.acknowledged_at,
                    "current_escalation_level": alert.current_escalation_level
                }
                for alert in alerts
            ],
            "count": len(alerts)
        }
    except Exception as e:
        raise safe_error_response(500, "Unable to fetch alerts", internal_error=e)


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    ack: AlertAcknowledge,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge an alert"""
    try:
        alert = await alert_service.acknowledge_alert(
            db=db,
            alert_id=alert_id,
            user_id=user_id,
            note=ack.note
        )

        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "id": alert.id,
            "status": alert.status.value,
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledgment_note": alert.acknowledgment_note
        }
    except HTTPException:
        raise
    except Exception as e:
        raise safe_error_response(500, "Unable to acknowledge alert", internal_error=e)


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    resolution: AlertResolve,
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Resolve an alert"""
    try:
        alert = await alert_service.resolve_alert(
            db=db,
            alert_id=alert_id,
            user_id=user_id,
            note=resolution.note,
            auto_resolved=user_id is None
        )

        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "id": alert.id,
            "status": alert.status.value,
            "resolved_at": alert.resolved_at,
            "resolved_by": alert.resolved_by,
            "resolution_note": alert.resolution_note,
            "auto_resolved": alert.auto_resolved
        }
    except HTTPException:
        raise
    except Exception as e:
        raise safe_error_response(500, "Unable to resolve alert", internal_error=e)


@router.post("/{alert_id}/escalate")
async def escalate_alert(
    alert_id: int,
    escalation_level: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Escalate an alert"""
    try:
        alert = await alert_service.escalate_alert(
            db=db,
            alert_id=alert_id,
            escalation_level=escalation_level
        )

        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        return {
            "id": alert.id,
            "current_escalation_level": alert.current_escalation_level,
            "escalated_at": alert.escalated_at,
            "escalation_history": alert.escalation_history
        }
    except HTTPException:
        raise
    except Exception as e:
        raise safe_error_response(500, "Unable to escalate alert", internal_error=e)


@router.get("/{alert_id}/history")
async def get_alert_history(
    alert_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get alert action history"""
    try:
        history = await alert_service.get_alert_history(db, alert_id)

        return {
            "alert_id": alert_id,
            "actions": [
                {
                    "id": action.id,
                    "action_type": action.action_type,
                    "action_description": action.action_description,
                    "performed_by": action.performed_by,
                    "automated": action.automated,
                    "performed_at": action.performed_at,
                    "action_data": action.action_data
                }
                for action in history
            ],
            "count": len(history)
        }
    except Exception as e:
        raise safe_error_response(500, "Unable to fetch alert history", internal_error=e)


@router.get("/statistics")
async def get_alert_statistics(
    hours: int = Query(default=24, ge=1, le=720),
    db: AsyncSession = Depends(get_db)
):
    """Get alert statistics"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        stats = await alert_service.get_alert_statistics(
            db, start_time, end_time
        )

        return {
            "statistics": stats,
            "start_time": start_time,
            "end_time": end_time,
            "hours": hours
        }
    except Exception as e:
        raise safe_error_response(500, "Unable to fetch alert statistics", internal_error=e)


# Escalation Policy Endpoints

@router.post("/escalation-policies", status_code=201)
async def create_escalation_policy(
    policy: EscalationPolicyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create an escalation policy"""
    try:
        escalation_policy = await alert_service.create_escalation_policy(
            db=db,
            name=policy.name,
            description=policy.description,
            escalation_levels=policy.escalation_levels
        )

        return {
            "id": escalation_policy.id,
            "name": escalation_policy.name,
            "description": escalation_policy.description,
            "escalation_levels": escalation_policy.escalation_levels,
            "is_active": escalation_policy.is_active,
            "created_at": escalation_policy.created_at
        }
    except Exception as e:
        raise safe_error_response(500, "Unable to create escalation policy", internal_error=e)
