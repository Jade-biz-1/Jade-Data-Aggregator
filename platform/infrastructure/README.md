# Data Aggregator Platform - Infrastructure

Production-ready infrastructure for monitoring, logging, alerting, and deployment of the Data Aggregator Platform.

---

## 📁 Directory Structure

```
infrastructure/
├── prometheus/           # Metrics collection
│   ├── prometheus.yml    # Scrape configuration
│   └── rules/
│       └── alerts.yml    # Alert rules (40+)
├── grafana/              # Dashboards and visualization
│   ├── provisioning/
│   │   ├── datasources/
│   │   └── dashboards/
│   └── dashboards/
│       ├── system-overview.json
│       └── README.md
├── alertmanager/         # Alert routing
│   └── alertmanager.yml
├── loki/                 # Log storage
│   └── loki-config.yml
├── promtail/             # Log collection
│   └── promtail-config.yml
├── blackbox/             # Endpoint monitoring
│   └── blackbox.yml
├── environments/         # Environment configurations
│   ├── .env.production
│   └── .env.staging
├── scripts/              # Automation scripts
│   └── backup-database.sh
├── docker-compose.monitoring.yml
└── README.md             # This file
```

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Set environment variables
export GRAFANA_ADMIN_PASSWORD=your-secure-password
export SLACK_WEBHOOK_URL=your-slack-webhook
export SMTP_USERNAME=your-smtp-username
export SMTP_PASSWORD=your-smtp-password

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Verify all services are running
docker-compose -f docker-compose.monitoring.yml ps

# Check logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 2. Access Dashboards

- **Grafana:** http://localhost:3001 (admin / your-password)
- **Prometheus:** http://localhost:9090
- **Alertmanager:** http://localhost:9093

### 3. Configure Application Metrics

Add Prometheus middleware to your FastAPI application:

```python
from backend.monitoring.prometheus import PrometheusMiddleware, metrics_endpoint

app.middleware("http")(PrometheusMiddleware)
app.get("/metrics")(metrics_endpoint)
```

### 4. Setup Sentry

```python
from backend.monitoring.sentry import init_sentry

# Initialize Sentry
init_sentry()
```

---

## 📊 Monitoring Stack

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards |
| Alertmanager | 9093 | Alert routing |
| Loki | 3100 | Log storage |
| Promtail | - | Log collection |
| Node Exporter | 9100 | System metrics |
| PostgreSQL Exporter | 9187 | Database metrics |
| Redis Exporter | 9121 | Cache metrics |
| cAdvisor | 8080 | Container metrics |
| Blackbox Exporter | 9115 | Endpoint monitoring |

### Metrics Collected

**60+ metrics across 11 categories:**
- Application metrics (HTTP requests, response time, errors)
- Authentication metrics (login attempts, sessions)
- Database metrics (connections, queries, performance)
- Pipeline metrics (executions, duration, records)
- Connector metrics (requests, response time, data volume)
- File upload metrics (uploads, size, processing time)
- Transformation metrics (executions, duration)
- WebSocket metrics (connections, messages, errors)
- Cache metrics (hits, misses, size)
- System metrics (CPU, memory, disk)
- Business metrics (users, API calls, data volume)

---

## 🎨 Grafana Dashboards

### Available Dashboards

1. **System Overview** - High-level system health
2. **Application Metrics** - HTTP requests and performance
3. **Database Metrics** - Connection pool and query performance
4. **Pipeline Metrics** - Pipeline execution and errors
5. **Connector Metrics** - Data source performance
6. **Authentication Metrics** - Login attempts and sessions
7. **Cache Performance** - Hit rate and size
8. **Business Metrics** - Users and data volume
9. **WebSocket Metrics** - Real-time connection status
10. **Alerts Dashboard** - Active alerts and history

### Creating Custom Dashboards

1. Login to Grafana (http://localhost:3001)
2. Create new dashboard
3. Add panel with PromQL query
4. Configure visualization
5. Save dashboard

Example query:
```promql
# Average response time per endpoint
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

---

## 🔔 Alerting

### Alert Rules

**40+ alert rules** organized by category:
- Application alerts (error rate, slow response, high traffic)
- Authentication alerts (failed logins, brute force)
- Database alerts (connection pool, slow queries, errors)
- Pipeline alerts (failures, long execution)
- Connector alerts (failures, slow response)
- System alerts (CPU, memory, disk usage)
- Cache alerts (low hit rate)
- Rate limit alerts (exceeded events)
- WebSocket alerts (errors)
- Prometheus alerts (scrape failures)

### Alert Routing

**Severity-based routing:**
- **Critical:** Email + Slack + PagerDuty (5s wait, 1h repeat)
- **Warning:** Email + Slack (30s wait, 6h repeat)

**Team-based routing:**
- Database team (database alerts)
- Security team (auth alerts)
- Data engineering team (pipeline alerts)
- Infrastructure team (system alerts)

### Notification Channels

Configure in `alertmanager/alertmanager.yml`:
- Email (SMTP)
- Slack (webhook)
- PagerDuty (service key)
- Custom webhooks

---

## 📝 Logging

### Log Sources

**8 log sources aggregated by Loki:**
1. Backend application logs (JSON)
2. Frontend application logs (Next.js)
3. System logs (syslog)
4. Nginx access/error logs
5. Docker container logs
6. PostgreSQL logs
7. Redis logs
8. Audit logs (security)

### Log Format

**Structured JSON logging:**
```json
{
  "timestamp": "2025-10-07T12:00:00Z",
  "level": "INFO",
  "logger": "backend.api",
  "message": "Request processed",
  "user_id": "user123",
  "request_id": "req-abc-123",
  "endpoint": "/api/pipelines",
  "duration_ms": 45
}
```

### Querying Logs

In Grafana with Loki datasource:
```logql
# All error logs
{job="backend"} |= "ERROR"

# Logs for specific user
{job="backend"} | json | user_id="user123"

# Slow requests (>1s)
{job="backend"} | json | duration_ms > 1000
```

---

## 🚨 Error Tracking

### Sentry Integration

**Backend:**
```python
from backend.monitoring.sentry import capture_exception, set_user_context

# Set user context
set_user_context(user_id="user123", email="user@example.com")

# Capture exception
try:
    process_data()
except Exception as e:
    capture_exception(e, operation="data_processing")
    raise
```

**Frontend:**
```typescript
import { captureException, setUser } from '@/lib/sentry';

// Set user
setUser('user123', 'user@example.com');

// Capture exception
try {
  processData();
} catch (error) {
  captureException(error, { operation: 'data_processing' });
  throw error;
}
```

---

## 🔧 Environment Configuration

### Production

**File:** `environments/.env.production`

- High resource limits
- Production URLs with SSL
- Strict security settings
- 30-day backup retention
- Low trace sampling (10%)
- INFO logging

### Staging

**File:** `environments/.env.staging`

- Lower resource limits
- Staging URLs
- Test data enabled
- 7-day backup retention
- Higher trace sampling (50%)
- DEBUG logging

### Required Environment Variables

**Critical (must set):**
```bash
# Security
JWT_SECRET_KEY=<strong-secret-key>
POSTGRES_PASSWORD=<db-password>
REDIS_PASSWORD=<redis-password>

# Monitoring
SENTRY_DSN=<sentry-dsn>
GRAFANA_ADMIN_PASSWORD=<grafana-password>

# Alerting
SMTP_PASSWORD=<smtp-password>
SLACK_WEBHOOK_URL=<slack-webhook>
PAGERDUTY_SERVICE_KEY=<pagerduty-key>

# AWS (if using S3)
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci-cd-production.yml`

**5 stages:**
1. **Test** - Run backend, frontend, and E2E tests
2. **Security** - Trivy and Snyk scanning
3. **Build** - Build Docker images
4. **Deploy** - Blue-green deployment to production
5. **Rollback** - Manual rollback capability

### Deployment Strategy

**Blue-Green Deployment:**
```
1. Deploy new version to "green" environment
2. Run health checks and smoke tests
3. Switch traffic to green (if healthy)
4. Monitor for 5 minutes
5. Delete old "blue" environment
6. Rename "green" to "blue" for next deployment
```

**Benefits:**
- Zero downtime
- Instant rollback
- Safe production deployments
- Testing before traffic switch

### Manual Deployment

```bash
# Trigger deployment
gh workflow run ci-cd-production.yml

# Trigger rollback
gh workflow run ci-cd-production.yml \
  --field deployment_type=rollback
```

---

## 💾 Database Backups

### Automated Backups

**Script:** `scripts/backup-database.sh`

**Features:**
- Daily automated backups
- Gzip compression
- S3 upload (optional)
- Backup verification
- 30-day retention
- Slack notifications

### Manual Backup

```bash
# Run backup script
./platform/infrastructure/scripts/backup-database.sh

# Backup to specific location
BACKUP_DIR=/custom/path ./platform/infrastructure/scripts/backup-database.sh

# Backup with S3 upload
S3_BACKUP_ENABLED=true \
S3_BUCKET=my-backups \
./platform/infrastructure/scripts/backup-database.sh
```

### Restore Backup

```bash
# List available backups
ls -lh /var/backups/dataaggregator/

# Restore from backup
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=dataaggregator \
  --clean \
  /var/backups/dataaggregator/dataaggregator_production_20251007_020000.sql.gz
```

### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add backup schedule (daily at 2 AM)
0 2 * * * /path/to/platform/infrastructure/scripts/backup-database.sh
```

---

## 🔍 Health Checks

### Endpoints

- **Liveness:** `/health/live` - Is application running?
- **Readiness:** `/health/ready` - Ready to serve traffic?
- **Startup:** `/health/startup` - Has startup completed?

### Component Checks

- Database connectivity and performance
- Redis connectivity and memory
- System resources (CPU, memory, disk)
- File storage availability

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "response_time_ms": 12.5,
      "message": "Database connection is healthy"
    },
    {
      "name": "redis",
      "status": "healthy",
      "response_time_ms": 5.2,
      "message": "Redis connection is healthy"
    }
  ],
  "system": {
    "cpu_count": 4,
    "python_version": "3.11.0"
  }
}
```

---

## 🛠️ Troubleshooting

### Monitoring Stack Issues

**Prometheus not scraping metrics:**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check application metrics endpoint
curl http://localhost:8001/metrics

# Verify Prometheus config
docker exec -it data-aggregator-prometheus promtool check config /etc/prometheus/prometheus.yml
```

**Grafana dashboards not loading:**
```bash
# Check Grafana logs
docker logs data-aggregator-grafana

# Verify datasource connection
curl http://localhost:3001/api/datasources

# Check dashboard provisioning
docker exec -it data-aggregator-grafana ls -la /var/lib/grafana/dashboards
```

**Alerts not firing:**
```bash
# Check Alertmanager status
curl http://localhost:9093/api/v2/status

# Check alert rules
curl http://localhost:9090/api/v1/rules

# Verify SMTP/Slack configuration
docker logs data-aggregator-alertmanager
```

### Application Issues

**High error rate:**
1. Check Grafana error dashboard
2. View logs in Loki/Grafana
3. Check Sentry for exception details
4. Review alert notifications

**Slow response time:**
1. Check response time dashboard
2. Query slow endpoints in Prometheus
3. Review database query performance
4. Check system resource usage

**Database connection issues:**
1. Check connection pool metrics
2. Verify database health check
3. Review PostgreSQL logs
4. Check network connectivity

---

## 📚 Additional Resources

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

### Internal Documentation
- `docs/phase-7e-completion-summary.md` - Phase 7E details
- `grafana/dashboards/README.md` - Dashboard documentation
- `backend/middleware/README.md` - Security middleware
- `SESSION_SUMMARY_OCT_7_2025_PHASE_7E.md` - Implementation summary

---

## 🔐 Security Notes

1. **Never commit secrets to version control**
2. **Use secrets manager** (AWS Secrets Manager, HashiCorp Vault)
3. **Rotate secrets regularly** (every 90 days)
4. **Restrict file permissions** (`chmod 600` for .env files)
5. **Enable SSL/TLS** in production
6. **Use strong passwords** (min 32 characters)
7. **Enable 2FA** for admin accounts
8. **Review access logs** regularly

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review documentation in `docs/`
3. Check GitHub issues
4. Contact infrastructure team

---

**Last Updated:** October 7, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
