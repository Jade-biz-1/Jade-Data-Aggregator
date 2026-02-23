"""
Correlation ID middleware
Adds/propagates X-Correlation-ID for request tracing
"""

from uuid import uuid4
from fastapi import Request
from fastapi.responses import Response


CORRELATION_ID_HEADER = "X-Correlation-ID"


def _normalize_correlation_id(value: str | None) -> str:
    if not value:
        return uuid4().hex

    value = value.strip()
    if not value:
        return uuid4().hex

    # Keep IDs reasonably bounded to prevent header abuse.
    if len(value) > 128:
        return uuid4().hex

    return value


async def correlation_id_middleware(request: Request, call_next):
    correlation_id = _normalize_correlation_id(request.headers.get(CORRELATION_ID_HEADER))
    request.state.correlation_id = correlation_id

    response: Response = await call_next(request)
    response.headers[CORRELATION_ID_HEADER] = correlation_id
    return response
