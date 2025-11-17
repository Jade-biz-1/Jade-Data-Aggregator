# Grafana Dashboards for Data Aggregator Platform

This directory contains Grafana dashboard definitions for monitoring the Data Aggregator Platform.

## Available Dashboards

### 1. System Overview (`system-overview.json`)
**Purpose:** High-level system health and performance monitoring

**Panels:**
- CPU Usage (Gauge)
- Memory Usage (Gauge)
- HTTP Request Rate (Time Series)
- HTTP Response Time p95/p99 (Time Series)
- Error Rate 5xx (Time Series)

**Refresh:** 10 seconds
**Time Range:** Last 1 hour

---

### 2. Application Metrics Dashboard

**Key Metrics:**
- HTTP request rate by endpoint
- Response time distribution (p50, p95, p99)
- Error rate by endpoint and status code
- Requests in progress
- Active sessions

**Queries:**
```promql
# Request rate
rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Active sessions
active_sessions
```

---

### 3. Database Metrics Dashboard

**Key Metrics:**
- Database connection pool usage
- Query duration (p95, p99)
- Query rate by operation (SELECT, INSERT, UPDATE, DELETE)
- Database error rate
- Slow query detection

**Queries:**
```promql
# Connection pool usage
db_connections_active / (db_connections_active + db_connections_idle)

# Query duration
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))

# Query rate
rate(db_queries_total[5m])

# Error rate
rate(db_queries_total{status="error"}[5m]) / rate(db_queries_total[5m])
```

---

### 4. Pipeline Metrics Dashboard

**Key Metrics:**
- Total pipelines by status (active/inactive/failed)
- Pipeline execution rate
- Pipeline execution duration (p95, p99)
- Pipeline failure rate
- Records processed per pipeline
- Pipeline errors by type

**Queries:**
```promql
# Pipeline count by status
pipelines_total

# Execution rate
rate(pipeline_executions_total[10m])

# Execution duration
histogram_quantile(0.95, rate(pipeline_execution_duration_seconds_bucket[10m]))

# Failure rate
rate(pipeline_executions_total{status="failed"}[10m]) / rate(pipeline_executions_total[10m])

# Records processed
rate(pipeline_records_processed[10m])
```

---

### 5. Connector Metrics Dashboard

**Key Metrics:**
- Total connectors by type and status
- Connector request rate
- Connector response time (p95, p99)
- Connector failure rate
- Data fetched (bytes) by connector

**Queries:**
```promql
# Connector count
connectors_total

# Request rate
rate(connector_requests_total[10m])

# Response time
histogram_quantile(0.95, rate(connector_response_time_seconds_bucket[10m]))

# Failure rate
rate(connector_requests_total{status="failed"}[10m]) / rate(connector_requests_total[10m])

# Data volume
rate(data_fetched_bytes[10m])
```

---

### 6. Authentication Metrics Dashboard

**Key Metrics:**
- Authentication attempts (success/failed)
- Authentication duration
- Active sessions
- Failed login rate (potential attacks)

**Queries:**
```promql
# Auth attempts
rate(auth_attempts_total[5m])

# Success rate
rate(auth_attempts_total{result="success"}[5m]) / rate(auth_attempts_total[5m])

# Failed login detection
rate(auth_attempts_total{result="failed"}[1m]) > 10

# Active sessions
active_sessions
```

---

### 7. Cache Performance Dashboard

**Key Metrics:**
- Cache hit rate
- Cache miss rate
- Cache size (bytes)

**Queries:**
```promql
# Hit rate
rate(cache_hits_total[10m]) / (rate(cache_hits_total[10m]) + rate(cache_misses_total[10m]))

# Cache size
cache_size_bytes
```

---

### 8. Business Metrics Dashboard

**Key Metrics:**
- Total users by role
- Daily active users
- API calls by user
- Data volume processed by source type

**Queries:**
```promql
# Users by role
users_total

# Daily active users
users_active_daily

# Data volume processed
rate(data_volume_processed_bytes[1h])
```

---

### 9. WebSocket Metrics Dashboard

**Key Metrics:**
- Active WebSocket connections
- Messages sent/received rate
- WebSocket error rate

**Queries:**
```promql
# Active connections
websocket_connections_active

# Message rate
rate(websocket_messages_sent[5m])
rate(websocket_messages_received[5m])

# Error rate
rate(websocket_errors_total[5m])
```

---

### 10. Alerts Dashboard

**Purpose:** View active alerts and alert history

**Panels:**
- Active alerts (Table)
- Alert firing rate
- Alert resolution time
- Alerts by severity

---

## Dashboard Creation

### Option 1: Import via Grafana UI
1. Login to Grafana (http://localhost:3001)
2. Go to Dashboards → Import
3. Upload the JSON file
4. Select Prometheus as data source

### Option 2: Automatic Provisioning
Dashboards in this directory are automatically provisioned when Grafana starts (configured in `provisioning/dashboards/default.yml`).

---

## Dashboard Variables

### Common Variables

**Environment:**
```
label_values(app_info, environment)
```

**Endpoint:**
```
label_values(http_requests_total, endpoint)
```

**Pipeline:**
```
label_values(pipeline_executions_total, pipeline_id)
```

**Connector:**
```
label_values(connector_requests_total, connector_id)
```

---

## Alert Annotations

Dashboards can display alert annotations from Alertmanager. To enable:

1. Add Alertmanager as annotation source
2. Configure annotation query:
```
{job="alertmanager"}
```

---

## Best Practices

1. **Use Template Variables:** Filter data by environment, endpoint, etc.
2. **Set Appropriate Time Ranges:** Use 1h for real-time, 24h for trends
3. **Add Threshold Lines:** Visual indicators for SLOs
4. **Group Related Panels:** Organize by component (auth, pipeline, etc.)
5. **Use Consistent Colors:** Red for errors, green for success, yellow for warnings
6. **Add Panel Descriptions:** Help users understand metrics

---

## Custom Dashboard Creation

### Step 1: Choose Visualization Type
- **Gauge:** Current value with thresholds (CPU, memory)
- **Time Series:** Trends over time (request rate, response time)
- **Bar Chart:** Comparisons (requests by endpoint)
- **Stat:** Single numeric value (total users, active pipelines)
- **Table:** Detailed data (slow queries, recent errors)
- **Heatmap:** Distribution (response time distribution)

### Step 2: Write PromQL Query
```promql
# Example: Average response time per endpoint
avg(rate(http_request_duration_seconds_sum[5m])) by (endpoint) /
avg(rate(http_request_duration_seconds_count[5m])) by (endpoint)
```

### Step 3: Configure Visualization
- Set units (seconds, bytes, percent)
- Add thresholds (green < 80, yellow < 90, red >= 90)
- Configure legend and tooltip

### Step 4: Save and Organize
- Add to appropriate folder
- Set refresh rate
- Add to dashboard links

---

## Monitoring SLOs

### Availability SLO: 99.9%
```promql
# Success rate
(sum(rate(http_requests_total{status!~"5.."}[30d])) /
 sum(rate(http_requests_total[30d]))) * 100
```

### Latency SLO: 95% under 200ms
```promql
# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Budget
```promql
# Remaining error budget (0.1% allowed)
1 - (sum(rate(http_requests_total{status=~"5.."}[30d])) /
     sum(rate(http_requests_total[30d]))) / 0.001
```

---

## Troubleshooting

**No Data Showing:**
1. Check Prometheus is scraping metrics (`/metrics` endpoint)
2. Verify data source configuration
3. Check time range and query

**Slow Dashboard:**
1. Reduce query interval
2. Limit number of panels
3. Use recording rules for complex queries

**Missing Metrics:**
1. Ensure Prometheus middleware is enabled
2. Check metric registration in `prometheus.py`
3. Verify scrape configuration

---

## Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/best-practices-for-creating-dashboards/)

---

**Last Updated:** October 7, 2025
**Version:** 1.0.0
