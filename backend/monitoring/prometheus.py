"""
Prometheus Metrics Collection
Comprehensive application and business metrics
"""

from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
import time
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware


# ============================================================================
# Application Metrics
# ============================================================================

# HTTP Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests in progress',
    ['method', 'endpoint']
)

# Authentication metrics
auth_attempts_total = Counter(
    'auth_attempts_total',
    'Total authentication attempts',
    ['result']  # success, failed, invalid
)

auth_login_duration_seconds = Histogram(
    'auth_login_duration_seconds',
    'Authentication login duration in seconds',
    buckets=[0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0]
)

active_sessions = Gauge(
    'active_sessions',
    'Number of active user sessions'
)

# ============================================================================
# Database Metrics
# ============================================================================

db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

db_connections_idle = Gauge(
    'db_connections_idle',
    'Number of idle database connections'
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],  # select, insert, update, delete
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 1.0]
)

db_queries_total = Counter(
    'db_queries_total',
    'Total database queries',
    ['operation', 'status']  # success, error
)

# ============================================================================
# Pipeline Metrics
# ============================================================================

pipelines_total = Gauge(
    'pipelines_total',
    'Total number of pipelines',
    ['status']  # active, inactive, failed
)

pipeline_executions_total = Counter(
    'pipeline_executions_total',
    'Total pipeline executions',
    ['pipeline_id', 'status']  # success, failed, cancelled
)

pipeline_execution_duration_seconds = Histogram(
    'pipeline_execution_duration_seconds',
    'Pipeline execution duration in seconds',
    ['pipeline_id'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600]
)

pipeline_records_processed = Counter(
    'pipeline_records_processed',
    'Total records processed by pipelines',
    ['pipeline_id']
)

pipeline_errors_total = Counter(
    'pipeline_errors_total',
    'Total pipeline errors',
    ['pipeline_id', 'error_type']
)

# ============================================================================
# Data Source Metrics
# ============================================================================

connectors_total = Gauge(
    'connectors_total',
    'Total number of connectors',
    ['type', 'status']  # api, database, file, stream | active, inactive
)

connector_requests_total = Counter(
    'connector_requests_total',
    'Total connector requests',
    ['connector_id', 'status']  # success, failed
)

connector_response_time_seconds = Histogram(
    'connector_response_time_seconds',
    'Connector response time in seconds',
    ['connector_id'],
    buckets=[0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
)

data_fetched_bytes = Counter(
    'data_fetched_bytes',
    'Total bytes fetched from connectors',
    ['connector_id']
)

# ============================================================================
# File Upload Metrics
# ============================================================================

file_uploads_total = Counter(
    'file_uploads_total',
    'Total file uploads',
    ['status']  # success, failed
)

file_upload_size_bytes = Histogram(
    'file_upload_size_bytes',
    'File upload size in bytes',
    buckets=[1024, 10240, 102400, 1048576, 10485760, 104857600]  # 1KB to 100MB
)

file_processing_duration_seconds = Histogram(
    'file_processing_duration_seconds',
    'File processing duration in seconds',
    ['file_type'],
    buckets=[0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0]
)

# ============================================================================
# Transformation Metrics
# ============================================================================

transformations_total = Counter(
    'transformations_total',
    'Total transformations executed',
    ['transformation_type', 'status']
)

transformation_duration_seconds = Histogram(
    'transformation_duration_seconds',
    'Transformation execution duration in seconds',
    ['transformation_type'],
    buckets=[0.001, 0.01, 0.1, 0.5, 1.0, 5.0]
)

transformation_records_processed = Counter(
    'transformation_records_processed',
    'Total records processed by transformations',
    ['transformation_type']
)

# ============================================================================
# WebSocket Metrics
# ============================================================================

websocket_connections_active = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections',
    ['endpoint']
)

websocket_messages_sent = Counter(
    'websocket_messages_sent',
    'Total WebSocket messages sent',
    ['endpoint', 'message_type']
)

websocket_messages_received = Counter(
    'websocket_messages_received',
    'Total WebSocket messages received',
    ['endpoint', 'message_type']
)

websocket_errors_total = Counter(
    'websocket_errors_total',
    'Total WebSocket errors',
    ['endpoint', 'error_type']
)

# ============================================================================
# Cache Metrics
# ============================================================================

cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type']  # redis, memory
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type']
)

cache_size_bytes = Gauge(
    'cache_size_bytes',
    'Cache size in bytes',
    ['cache_type']
)

# ============================================================================
# Business Metrics
# ============================================================================

users_total = Gauge(
    'users_total',
    'Total number of users',
    ['role']  # admin, editor, viewer
)

users_active_daily = Gauge(
    'users_active_daily',
    'Number of daily active users'
)

api_calls_by_user = Counter(
    'api_calls_by_user',
    'Total API calls by user',
    ['user_id', 'endpoint']
)

data_volume_processed_bytes = Counter(
    'data_volume_processed_bytes',
    'Total data volume processed in bytes',
    ['source_type']
)

# ============================================================================
# System Metrics
# ============================================================================

app_info = Info(
    'app',
    'Application information'
)

system_cpu_usage_percent = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage'
)

system_memory_usage_bytes = Gauge(
    'system_memory_usage_bytes',
    'System memory usage in bytes',
    ['type']  # used, free, cached
)

system_disk_usage_bytes = Gauge(
    'system_disk_usage_bytes',
    'System disk usage in bytes',
    ['type']  # used, free
)

# ============================================================================
# Rate Limiting Metrics
# ============================================================================

rate_limit_exceeded_total = Counter(
    'rate_limit_exceeded_total',
    'Total rate limit exceeded events',
    ['endpoint', 'user_id']
)

# ============================================================================
# Error Metrics
# ============================================================================

errors_total = Counter(
    'errors_total',
    'Total application errors',
    ['error_type', 'endpoint']
)

exceptions_unhandled_total = Counter(
    'exceptions_unhandled_total',
    'Total unhandled exceptions',
    ['exception_type']
)

# ============================================================================
# Middleware for automatic HTTP metrics
# ============================================================================

class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically collect HTTP request metrics
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        endpoint = request.url.path

        # Track in-progress requests
        http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()

        # Track request duration
        start_time = time.time()

        try:
            response = await call_next(request)
            status = response.status_code
        except Exception as e:
            # Track errors
            errors_total.labels(
                error_type=type(e).__name__,
                endpoint=endpoint
            ).inc()
            raise
        finally:
            # Calculate duration
            duration = time.time() - start_time

            # Record metrics
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

            http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()

        return response


# ============================================================================
# Metrics endpoint
# ============================================================================

async def metrics_endpoint() -> FastAPIResponse:
    """
    Endpoint to expose Prometheus metrics
    """
    return FastAPIResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# ============================================================================
# Utility functions
# ============================================================================

def set_app_info(version: str, environment: str, build_date: str):
    """Set application information"""
    app_info.info({
        'version': version,
        'environment': environment,
        'build_date': build_date
    })


def track_db_connection(active: int, idle: int):
    """Track database connection pool metrics"""
    db_connections_active.set(active)
    db_connections_idle.set(idle)


def track_user_count(admins: int, editors: int, viewers: int):
    """Track user count by role"""
    users_total.labels(role='admin').set(admins)
    users_total.labels(role='editor').set(editors)
    users_total.labels(role='viewer').set(viewers)


def track_pipeline_count(active: int, inactive: int, failed: int):
    """Track pipeline count by status"""
    pipelines_total.labels(status='active').set(active)
    pipelines_total.labels(status='inactive').set(inactive)
    pipelines_total.labels(status='failed').set(failed)


def track_connector_count(connector_type: str, active: int, inactive: int):
    """Track connector count by type and status"""
    connectors_total.labels(type=connector_type, status='active').set(active)
    connectors_total.labels(type=connector_type, status='inactive').set(inactive)
