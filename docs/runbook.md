# Data Aggregator Platform - Production Runbook

**Operational procedures and on-call guide for production environments**

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [On-Call Procedures](#on-call-procedures)
- [Incident Response](#incident-response)
- [Common Operations](#common-operations)
- [Monitoring & Alerts](#monitoring--alerts)
- [Deployment Procedures](#deployment-procedures)
- [Backup & Recovery](#backup--recovery)
- [Performance Tuning](#performance-tuning)
- [Security Procedures](#security-procedures)
- [Emergency Contacts](#emergency-contacts)

---

## Overview

### Purpose

This runbook provides operational procedures for maintaining the Data Aggregator Platform in production environments. It is intended for on-call engineers, DevOps teams, and operations staff.

### Production Environments

| Environment | Purpose | URL | Deployment |
|-------------|---------|-----|------------|
| **Production** | Live customer traffic | https://app.dataaggregator.com | AWS/Azure/GCP |
| **Staging** | Pre-production testing | https://staging.dataaggregator.com | AWS/Azure/GCP |
| **Development** | Development testing | https://dev.dataaggregator.com | Docker/Cloud |

### Service Level Objectives (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Availability** | 99.9% | Monthly uptime |
| **API Latency (p95)** | < 500ms | API response time |
| **API Latency (p99)** | < 2s | API response time |
| **Error Rate** | < 0.1% | Failed requests / total |
| **Pipeline Success Rate** | > 99% | Successful pipeline runs |

---

## System Architecture

### Infrastructure Overview

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (ALB/AppGW)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼────────┐          ┌────────▼────────┐
    │    Frontend      │          │    Backend      │
    │  (Next.js/Node)  │          │   (FastAPI)     │
    │   Port: 3000     │          │   Port: 8001    │
    └──────────────────┘          └────────┬────────┘
                                           │
                    ┌──────────────────────┼────────────────────┐
                    │                      │                    │
          ┌─────────▼────────┐   ┌────────▼────────┐  ┌───────▼────────┐
          │   PostgreSQL     │   │      Redis      │  │  Kafka/Pub/Sub │
          │   (Database)     │   │    (Cache)      │  │   (Messaging)  │
          │   Port: 5432     │   │   Port: 6379    │  │   Port: 9092   │
          └──────────────────┘   └─────────────────┘  └────────────────┘
```

### Key Components

1. **Frontend**: Next.js application serving UI
2. **Backend**: FastAPI application providing REST APIs
3. **Database**: PostgreSQL for persistent data
4. **Cache**: Redis for session and query caching
5. **Messaging**: Kafka/Event Hubs/Pub/Sub for async processing
6. **Monitoring**: Prometheus/Grafana/CloudWatch/Application Insights

### Critical Dependencies

- **Database**: System cannot function without database
- **Redis**: Degrades gracefully, sessions lost on restart
- **Messaging**: Async operations queued, retried later
- **External APIs**: Connector-specific failures

---

## On-Call Procedures

### Alert Response Process

```
1. Alert Received
   ↓
2. Acknowledge Alert (< 5 min)
   ↓
3. Assess Severity
   ↓
4. Follow Incident Response Plan
   ↓
5. Resolve or Escalate
   ↓
6. Document in Postmortem
```

### Alert Severity Levels

#### 🔴 Critical (P0)

**Definition**: Complete service outage or data loss

**Response Time**: Immediate (< 15 minutes)

**Examples**:
- All services down
- Database unreachable
- Data corruption detected
- Security breach

**Actions**:
1. Page on-call engineer immediately
2. Create incident channel (#incident-YYYY-MM-DD-description)
3. Notify management (if > 30 min outage)
4. Activate disaster recovery if needed

---

#### 🟠 High (P1)

**Definition**: Major functionality impaired, affecting multiple users

**Response Time**: < 2 hours

**Examples**:
- API error rate > 5%
- Pipeline execution failures
- Authentication issues
- Performance degradation (p95 > 2s)

**Actions**:
1. Acknowledge alert
2. Investigate and diagnose
3. Apply fix or workaround
4. Monitor for stability

---

#### 🟡 Medium (P2)

**Definition**: Minor functionality affected, workaround available

**Response Time**: < 1 business day

**Examples**:
- Non-critical feature broken
- Isolated connector issues
- Email delivery delays
- UI cosmetic issues

**Actions**:
1. Acknowledge alert
2. Schedule fix in next deployment
3. Document workaround

---

#### 🟢 Low (P3)

**Definition**: Minimal impact, cosmetic issues

**Response Time**: < 1 week

**Examples**:
- Documentation typos
- Minor UI inconsistencies
- Feature requests

**Actions**:
1. Create backlog ticket
2. Prioritize in sprint planning

---

## Incident Response

### Step 1: Assess & Triage (< 5 minutes)

```bash
# Check overall system health
curl https://api.dataaggregator.com/health/live
curl https://api.dataaggregator.com/health/ready

# Check service status (cloud platforms)
# AWS
aws ecs describe-services --cluster dataaggregator --services backend frontend

# Azure
az containerapp show --name backend --resource-group rg-dataaggregator-prod

# GCP
gcloud run services describe backend --region us-central1

# Check database
# Docker
docker-compose exec postgres pg_isready

# Cloud
aws rds describe-db-instances --db-instance-identifier dataaggregator-db
az postgres flexible-server show --name dataaggregator-db --resource-group rg-dataaggregator
gcloud sql instances describe dataaggregator-db
```

### Step 2: Gather Information (< 10 minutes)

```bash
# View recent logs
# Docker
docker-compose logs --tail=200 backend

# AWS CloudWatch
aws logs tail /aws/ecs/dataaggregator-backend --follow

# Azure
az containerapp logs show --name backend --resource-group rg-dataaggregator-prod --tail 200

# GCP
gcloud run services logs read backend --region us-central1 --limit 200

# Check error rate
# Query monitoring system for recent errors

# Check affected users
# Query access logs or analytics
```

### Step 3: Communicate (< 15 minutes)

```bash
# 1. Acknowledge alert in PagerDuty/Opsgenie
# 2. Create incident channel
# Slack: Create #incident-2025-10-09-api-outage

# 3. Post initial status
# Message template:
# 🚨 INCIDENT: [Brief description]
# Impact: [What's affected]
# Status: Investigating
# ETA: Unknown
# Owner: @oncall-engineer

# 4. Update status page (if available)
# StatusPage, Atlassian StatusPage, etc.
```

### Step 4: Mitigate (Variable)

#### Database Issues

```bash
# Scenario: Database connection pool exhausted

# 1. Check active connections
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;
"

# 2. Kill idle connections (if safe)
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '10 minutes';
"

# 3. Increase connection pool (temporary)
# Update environment variable and restart
docker-compose exec backend bash -c "
  export DB_POOL_SIZE=50
  supervisorctl restart all
"

# 4. Scale database (cloud)
# AWS
aws rds modify-db-instance --db-instance-identifier dataaggregator-db \
  --db-instance-class db.t3.large --apply-immediately

# Azure
az postgres flexible-server update --name dataaggregator-db \
  --resource-group rg-dataaggregator --sku-name Standard_D4s_v3

# GCP
gcloud sql instances patch dataaggregator-db --tier=db-n1-standard-2
```

#### High Error Rate

```bash
# Scenario: API error rate > 5%

# 1. Identify failing endpoints
# Query logs or monitoring for 5xx responses

# 2. Check recent deployments
git log --oneline -10

# 3. Rollback if recent deployment
# AWS ECS
aws ecs update-service --cluster dataaggregator \
  --service backend \
  --task-definition dataaggregator-backend:PREVIOUS_VERSION

# Azure
az containerapp revision list --name backend --resource-group rg-dataaggregator-prod
az containerapp revision activate --name backend --resource-group rg-dataaggregator-prod \
  --revision <previous-revision>

# GCP
gcloud run services update-traffic backend \
  --to-revisions=<previous-revision>=100 \
  --region us-central1

# 4. Monitor recovery
watch -n 5 'curl -s https://api.dataaggregator.com/health/ready'
```

#### Performance Degradation

```bash
# Scenario: API latency p95 > 2s

# 1. Check resource utilization
# CPU, memory, disk, network

# 2. Identify slow queries
docker-compose exec postgres psql -U postgres -d dataaggregator -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC LIMIT 10;
"

# 3. Clear cache (if stale)
docker-compose exec redis redis-cli FLUSHDB

# 4. Scale horizontally (cloud)
# AWS ECS: Increase desired count
aws ecs update-service --cluster dataaggregator --service backend --desired-count 6

# Azure: Scale Container App
az containerapp update --name backend --resource-group rg-dataaggregator-prod \
  --min-replicas 3 --max-replicas 10

# GCP: Increase max instances
gcloud run services update backend --max-instances=20 --region us-central1
```

### Step 5: Resolve & Document

```bash
# 1. Verify resolution
# Run smoke tests
# Check metrics return to normal

# 2. Update incident channel
# 🎉 RESOLVED: [Brief description]
# Root cause: [What happened]
# Fix applied: [What was done]
# Duration: [Time to resolve]
# Follow-up: [Postmortem link]

# 3. Write postmortem (within 48 hours)
# See template: docs/postmortem-template.md

# 4. Create follow-up tasks
# Preventive measures
# Monitoring improvements
# Documentation updates
```

---

## Common Operations

### Deploy New Version

```bash
# 1. Pre-deployment checks
# - Verify staging deployment successful
# - Review changes (git diff)
# - Check for breaking changes
# - Notify team in #deployments

# 2. Backup database (if schema changes)
docker-compose exec postgres pg_dump -U postgres dataaggregator > backup-$(date +%Y%m%d-%H%M).sql

# 3. Deploy backend
# AWS
aws ecs update-service --cluster dataaggregator --service backend --force-new-deployment

# Azure
az containerapp update --name backend --resource-group rg-dataaggregator-prod \
  --image dataaggregatoracr.azurecr.io/backend:latest

# GCP
gcloud run deploy backend \
  --image us-central1-docker.pkg.dev/dataaggregator-prod/backend:latest \
  --region us-central1

# 4. Run database migrations (if needed)
# Wait for new version to be healthy, then:
docker-compose exec backend alembic upgrade head

# 5. Deploy frontend
# Same process as backend

# 6. Monitor for issues (30 minutes)
# Watch error rates, latency, user reports

# 7. Rollback if issues (see Incident Response)
```

### Scale Services

```bash
# Horizontal Scaling (add more instances)

# AWS ECS
aws ecs update-service --cluster dataaggregator --service backend --desired-count 4

# Azure Container Apps
az containerapp update --name backend --resource-group rg-dataaggregator-prod \
  --min-replicas 2 --max-replicas 10

# GCP Cloud Run
gcloud run services update backend \
  --min-instances=2 --max-instances=20 \
  --region us-central1

# Vertical Scaling (increase resources)

# AWS ECS (update task definition)
aws ecs register-task-definition --cli-input-json file://task-definition-large.json
aws ecs update-service --cluster dataaggregator --service backend \
  --task-definition dataaggregator-backend:NEW_VERSION

# Azure Container Apps
az containerapp update --name backend --resource-group rg-dataaggregator-prod \
  --cpu 2 --memory 4Gi

# GCP Cloud Run
gcloud run services update backend \
  --cpu=2 --memory=2Gi \
  --region us-central1
```

### Update Configuration

```bash
# 1. Update environment variables

# AWS (update task definition or Parameter Store)
aws ssm put-parameter --name /dataaggregator/api-key --value "new-value" --overwrite

# Azure (update Key Vault)
az keyvault secret set --vault-name dataaggregator-kv --name api-key --value "new-value"

# GCP (update Secret Manager)
echo -n "new-value" | gcloud secrets versions add api-key --data-file=-

# 2. Restart service to pick up changes
# AWS
aws ecs update-service --cluster dataaggregator --service backend --force-new-deployment

# Azure
az containerapp revision restart --name backend --resource-group rg-dataaggregator-prod

# GCP
gcloud run services update backend --update-env-vars API_KEY=new-value --region us-central1
```

### Clear Cache

```bash
# Redis cache

# Clear all (use cautiously)
docker-compose exec redis redis-cli FLUSHDB

# Clear specific key pattern
docker-compose exec redis redis-cli --scan --pattern "cache:pipeline:*" | \
  xargs docker-compose exec redis redis-cli DEL

# Clear rate limits for user (emergency)
docker-compose exec redis redis-cli DEL "rate_limit:user:USER_ID"

# Verify cache cleared
docker-compose exec redis redis-cli DBSIZE
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Metrics**:
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users
- Pipeline execution rate
- Pipeline success rate

**Infrastructure Metrics**:
- CPU utilization (%)
- Memory utilization (%)
- Disk usage (%)
- Network I/O (MB/s)
- Database connections
- Cache hit rate (%)

**Business Metrics**:
- Active pipelines
- Data volume processed (GB)
- API calls per customer
- User registrations

### Alert Thresholds

```yaml
# Prometheus alert rules example
groups:
  - name: dataaggregator_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        severity: critical

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
        severity: warning

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        severity: critical

      - alert: HighCPU
        expr: container_cpu_usage_seconds_total > 0.8
        for: 15m
        severity: warning
```

### Dashboard URLs

**Production**:
- Grafana: https://grafana.dataaggregator.com
- Prometheus: https://prometheus.dataaggregator.com
- Sentry: https://sentry.io/dataaggregator
- AWS CloudWatch: [Console Link]
- Azure Monitor: [Console Link]
- GCP Monitoring: [Console Link]

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, E2E)
- [ ] Staging deployment successful
- [ ] Database migrations tested
- [ ] Breaking changes documented
- [ ] Rollback plan prepared
- [ ] Team notified (#deployments channel)
- [ ] Deployment window scheduled (if required)

### Deployment Steps

See [Deploy New Version](#deploy-new-version) above.

### Post-Deployment Checklist

- [ ] Services healthy (all health checks passing)
- [ ] No errors in logs (< 0.1% error rate)
- [ ] Performance normal (p95 < 500ms)
- [ ] Database migrations completed
- [ ] Smoke tests passed
- [ ] Monitoring dashboards showing normal metrics
- [ ] User acceptance validated (sample testing)
- [ ] Deployment marked as successful in #deployments

---

## Backup & Recovery

### Database Backups

**Automated Backups**:
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days (production), 7 days (staging)
- **Location**: S3/Azure Blob/Cloud Storage

**Manual Backup**:

```bash
# Full backup
docker-compose exec postgres pg_dump -U postgres dataaggregator > backup-$(date +%Y%m%d-%H%M).sql

# Compressed backup
docker-compose exec postgres pg_dump -U postgres dataaggregator | gzip > backup-$(date +%Y%m%d-%H%M).sql.gz

# Cloud-specific
# AWS
aws rds create-db-snapshot --db-instance-identifier dataaggregator-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d-%H%M)

# Azure
az postgres flexible-server backup create --name dataaggregator-db \
  --resource-group rg-dataaggregator --backup-name manual-backup-$(date +%Y%m%d-%H%M)

# GCP
gcloud sql backups create --instance=dataaggregator-db
```

### Database Recovery

```bash
# Restore from backup file
docker-compose exec -T postgres psql -U postgres dataaggregator < backup-20251009-1200.sql

# Restore from cloud backup
# AWS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier dataaggregator-db-restored \
  --db-snapshot-identifier manual-backup-20251009-1200

# Azure
az postgres flexible-server restore --source-server dataaggregator-db \
  --name dataaggregator-db-restored \
  --resource-group rg-dataaggregator \
  --restore-time "2025-10-09T12:00:00Z"

# GCP (point-in-time recovery)
gcloud sql backups restore BACKUP_ID \
  --backup-instance=dataaggregator-db \
  --restore-instance=dataaggregator-db-restored
```

### Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours

**Procedure**:

1. **Assess Disaster Scope** (< 30 min)
   - Data loss extent
   - Infrastructure damage
   - Affected services

2. **Activate DR Plan** (< 1 hour)
   - Notify stakeholders
   - Provision new infrastructure (if needed)
   - Restore from backups

3. **Restore Services** (< 2 hours)
   - Deploy application to new infrastructure
   - Restore database from latest backup
   - Validate data integrity

4. **Cutover** (< 30 min)
   - Update DNS to point to new infrastructure
   - Verify services operational
   - Monitor for issues

5. **Post-Recovery** (< 4 hours)
   - Assess data loss (if any)
   - Communicate to users
   - Begin postmortem

---

## Performance Tuning

### Database Optimization

```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_pipelines_owner_id ON pipelines(owner_id);
CREATE INDEX CONCURRENTLY idx_pipeline_runs_created_at ON pipeline_runs(created_at DESC);

-- Vacuum and analyze
VACUUM ANALYZE;

-- Update statistics
ANALYZE;

-- Check for bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Cache Optimization

```bash
# Monitor cache hit rate
docker-compose exec redis redis-cli INFO stats | grep keyspace

# Set cache TTL appropriately
# Short TTL for frequently changing data: 60s
# Long TTL for static data: 3600s (1 hour)

# Use cache invalidation on updates
# backend/services/pipeline_service.py
def update_pipeline(pipeline_id, data):
    result = db.update(pipeline_id, data)
    redis.delete(f"cache:pipeline:{pipeline_id}")
    return result
```

### Application Optimization

```python
# Use async database queries
async def get_pipelines(user_id: str):
    async with get_session() as session:
        result = await session.execute(
            select(Pipeline).where(Pipeline.owner_id == user_id)
        )
        return result.scalars().all()

# Pagination for large result sets
@router.get("/pipelines")
async def list_pipelines(skip: int = 0, limit: int = 100):
    return await pipeline_service.list(skip=skip, limit=limit)

# Use connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)
```

---

## Security Procedures

### Rotate Secrets

```bash
# 1. Generate new secret
new_secret=$(openssl rand -hex 32)

# 2. Update in secret manager
# AWS
aws secretsmanager update-secret --secret-id dataaggregator/secret-key \
  --secret-string "$new_secret"

# Azure
az keyvault secret set --vault-name dataaggregator-kv \
  --name secret-key --value "$new_secret"

# GCP
echo -n "$new_secret" | gcloud secrets versions add secret-key --data-file=-

# 3. Update application to use new secret
# 4. Restart services
# 5. Verify services healthy
# 6. Delete old secret version (after validation period)
```

### Respond to Security Incident

```bash
# 1. Assess scope
# - What data was accessed?
# - How was access gained?
# - When did it occur?

# 2. Contain
# - Revoke compromised credentials
# - Block malicious IPs
# - Isolate affected systems

# 3. Investigate
# - Review audit logs
# - Check access patterns
# - Identify vulnerabilities

# 4. Remediate
# - Patch vulnerabilities
# - Rotate all secrets
# - Update security policies

# 5. Notify
# - Inform affected users
# - Report to authorities (if required)
# - Update security team

# 6. Prevent
# - Update security procedures
# - Add monitoring/alerts
# - Conduct security training
```

---

## Emergency Contacts

### On-Call Rotation

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| **Primary On-Call** | See PagerDuty | See PagerDuty | oncall@dataaggregator.com | See PagerDuty |
| **Engineering Lead** | [Name] | [Phone] | lead@dataaggregator.com | - |
| **DevOps Lead** | [Name] | [Phone] | devops@dataaggregator.com | - |
| **CTO** | [Name] | [Phone] | cto@dataaggregator.com | - |

### External Contacts

| Vendor | Contact | Purpose | SLA |
|--------|---------|---------|-----|
| **AWS Support** | Enterprise Support Portal | Infrastructure issues | 15 min (critical) |
| **Azure Support** | Azure Portal | Infrastructure issues | 15 min (critical) |
| **GCP Support** | Cloud Console | Infrastructure issues | 15 min (critical) |
| **Database Vendor** | [Contact] | Database issues | 1 hour |
| **Security Team** | security@dataaggregator.com | Security incidents | Immediate |

### Escalation Path

```
Level 1: On-Call Engineer (PagerDuty)
   ↓ (if unresolved in 30 min)
Level 2: Engineering Lead
   ↓ (if unresolved in 1 hour)
Level 3: CTO
   ↓ (if data loss/security breach)
Level 4: CEO + Legal
```

---

## Runbook Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2025-10-09 | Platform Team | Initial version |

---

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Next Review**: Monthly or after major incidents

**See Also**:
- [Deployment Guide](./deployment-guide.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Security Documentation](./security.md)
- [Architecture Documentation](./architecture.md)
