"""
Sentry Integration for Error Tracking
Comprehensive error monitoring and reporting
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os
import logging


def init_sentry():
    """
    Initialize Sentry error tracking
    """
    # Get Sentry DSN from environment
    sentry_dsn = os.getenv('SENTRY_DSN')

    if not sentry_dsn:
        logging.warning("SENTRY_DSN not configured - Sentry error tracking disabled")
        return

    # Get environment
    environment = os.getenv('ENVIRONMENT', 'development')

    # Get release version
    release = os.getenv('APP_VERSION', '1.0.0')

    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,  # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors as events
    )

    # Initialize Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=f"data-aggregator@{release}",

        # Integrations
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            logging_integration,
        ],

        # Performance monitoring
        traces_sample_rate=get_traces_sample_rate(environment),

        # Error sampling
        sample_rate=1.0,  # Capture all errors

        # Send PII (Personally Identifiable Information)
        send_default_pii=False,  # Don't send PII by default

        # Debug mode
        debug=environment == 'development',

        # Attach stack trace for messages
        attach_stacktrace=True,

        # Request bodies
        max_request_body_size='medium',  # small, medium, large, always

        # Before send hook
        before_send=before_send_hook,

        # Before breadcrumb hook
        before_breadcrumb=before_breadcrumb_hook,
    )

    logging.info(f"Sentry initialized for environment: {environment}, release: {release}")


def get_traces_sample_rate(environment: str) -> float:
    """
    Get sample rate for performance traces based on environment
    """
    if environment == 'production':
        return 0.1  # 10% of transactions
    elif environment == 'staging':
        return 0.5  # 50% of transactions
    else:
        return 1.0  # 100% of transactions in development


def before_send_hook(event, hint):
    """
    Hook called before sending event to Sentry
    Use this to filter, modify, or drop events
    """
    # Drop events in development if needed
    if os.getenv('ENVIRONMENT') == 'development' and os.getenv('SENTRY_DEV_ENABLED') != 'true':
        return None

    # Add custom context
    event.setdefault('contexts', {})
    event['contexts']['custom'] = {
        'app_name': 'Data Aggregator Platform',
        'component': 'backend',
    }

    # Filter sensitive data
    if 'request' in event:
        request = event['request']

        # Remove sensitive headers
        if 'headers' in request:
            sensitive_headers = ['Authorization', 'Cookie', 'X-API-Key']
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[REDACTED]'

        # Remove sensitive data from body
        if 'data' in request and isinstance(request['data'], dict):
            sensitive_fields = ['password', 'token', 'secret', 'api_key']
            for field in sensitive_fields:
                if field in request['data']:
                    request['data'][field] = '[REDACTED]'

    return event


def before_breadcrumb_hook(crumb, hint):
    """
    Hook called before adding breadcrumb
    Use this to filter or modify breadcrumbs
    """
    # Don't log HTTP breadcrumbs for health checks
    if crumb.get('category') == 'httplib' and crumb.get('data', {}).get('url', '').endswith('/health'):
        return None

    # Filter sensitive data from breadcrumbs
    if crumb.get('category') == 'query':
        if 'data' in crumb and isinstance(crumb['data'], dict):
            if 'query' in crumb['data']:
                # Redact sensitive SQL queries
                query = crumb['data']['query'].lower()
                if any(word in query for word in ['password', 'token', 'secret']):
                    crumb['data']['query'] = '[REDACTED]'

    return crumb


def capture_exception(exception: Exception, **kwargs):
    """
    Manually capture exception with additional context
    """
    with sentry_sdk.push_scope() as scope:
        # Add custom context
        for key, value in kwargs.items():
            scope.set_context(key, value)

        # Capture exception
        sentry_sdk.capture_exception(exception)


def capture_message(message: str, level: str = 'info', **kwargs):
    """
    Manually capture message with additional context
    """
    with sentry_sdk.push_scope() as scope:
        # Add custom context
        for key, value in kwargs.items():
            scope.set_context(key, value)

        # Capture message
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: str = None, username: str = None):
    """
    Set user context for error tracking
    """
    sentry_sdk.set_user({
        'id': user_id,
        'email': email,
        'username': username,
    })


def set_request_context(request_id: str, endpoint: str, method: str):
    """
    Set request context for error tracking
    """
    sentry_sdk.set_context('request', {
        'request_id': request_id,
        'endpoint': endpoint,
        'method': method,
    })


def add_breadcrumb(message: str, category: str, level: str = 'info', data: dict = None):
    """
    Add breadcrumb for error context
    """
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {}
    )


def configure_scope(tags: dict = None, extras: dict = None):
    """
    Configure Sentry scope with tags and extras
    """
    scope = sentry_sdk.configure_scope()

    if tags:
        for key, value in tags.items():
            scope.set_tag(key, value)

    if extras:
        for key, value in extras.items():
            scope.set_extra(key, value)


# ==========================================================================
# FastAPI Middleware Integration
# ==========================================================================

async def sentry_middleware(request, call_next):
    """
    Middleware to add request context to Sentry
    """
    from fastapi import Request

    # Get request details
    request_id = request.headers.get('X-Request-ID', 'unknown')
    endpoint = request.url.path
    method = request.method

    # Set request context
    set_request_context(request_id, endpoint, method)

    # Add breadcrumb
    add_breadcrumb(
        message=f"{method} {endpoint}",
        category='request',
        level='info',
        data={
            'request_id': request_id,
            'method': method,
            'endpoint': endpoint,
        }
    )

    try:
        response = await call_next(request)
        return response
    except Exception as e:
        # Exception will be automatically captured by Sentry integration
        raise


# ==========================================================================
# Performance Monitoring
# ==========================================================================

def start_transaction(name: str, op: str):
    """
    Start Sentry performance transaction
    """
    return sentry_sdk.start_transaction(name=name, op=op)


def start_span(op: str, description: str = None):
    """
    Start Sentry performance span
    """
    return sentry_sdk.start_span(op=op, description=description)


# ==========================================================================
# Context Managers
# ==========================================================================

class SentryContext:
    """
    Context manager for Sentry scope
    """

    def __init__(self, tags: dict = None, extras: dict = None):
        self.tags = tags or {}
        self.extras = extras or {}
        self.scope = None

    def __enter__(self):
        self.scope = sentry_sdk.push_scope()
        self.scope.__enter__()

        # Set tags
        for key, value in self.tags.items():
            self.scope.set_tag(key, value)

        # Set extras
        for key, value in self.extras.items():
            self.scope.set_extra(key, value)

        return self.scope

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.scope:
            self.scope.__exit__(exc_type, exc_val, exc_tb)


# ==========================================================================
# Decorators
# ==========================================================================

def track_errors(operation_name: str):
    """
    Decorator to track errors in function
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with SentryContext(tags={'operation': operation_name}):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    capture_exception(e, operation=operation_name)
                    raise
        return wrapper
    return decorator


async def async_track_errors(operation_name: str):
    """
    Decorator to track errors in async function
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            with SentryContext(tags={'operation': operation_name}):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    capture_exception(e, operation=operation_name)
                    raise
        return wrapper
    return decorator
