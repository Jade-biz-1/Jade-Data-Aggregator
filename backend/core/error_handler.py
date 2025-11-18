"""
Centralized Error Handling Utility
Prevents information leakage in error responses
Part of Phase 11A - SEC-002
"""

import logging
from uuid import uuid4
from typing import Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


# Configure logging
logger = logging.getLogger(__name__)


class SafeHTTPException(HTTPException):
    """
    HTTPException that logs detailed errors but returns safe messages to users
    """

    def __init__(
        self,
        status_code: int,
        detail: str,
        internal_detail: Optional[str] = None,
        error_id: Optional[str] = None,
        headers: Optional[dict] = None
    ):
        """
        Create a safe HTTP exception

        Args:
            status_code: HTTP status code
            detail: User-facing error message (safe, generic)
            internal_detail: Detailed error for logging (may contain sensitive info)
            error_id: Optional error correlation ID
            headers: Optional response headers
        """
        self.error_id = error_id or str(uuid4())
        self.internal_detail = internal_detail

        # Log detailed error server-side
        if internal_detail:
            logger.error(
                f"Error ID {self.error_id}: {internal_detail}",
                exc_info=True,
                extra={"error_id": self.error_id, "status_code": status_code}
            )

        # Build user-facing message with error ID
        user_message = f"{detail} (Error ID: {self.error_id})"

        # Add error ID to headers for support debugging
        if headers is None:
            headers = {}
        headers["X-Error-ID"] = self.error_id

        super().__init__(status_code=status_code, detail=user_message, headers=headers)


def safe_error_response(
    status_code: int,
    user_message: str,
    internal_error: Optional[Exception] = None,
    error_id: Optional[str] = None
) -> SafeHTTPException:
    """
    Create a safe error response that logs details but shows generic message

    Args:
        status_code: HTTP status code
        user_message: User-friendly error message
        internal_error: The actual exception (for logging)
        error_id: Optional error correlation ID

    Returns:
        SafeHTTPException with safe user message

    Example:
        try:
            result = risky_operation()
        except Exception as e:
            raise safe_error_response(
                500,
                "Unable to process request",
                internal_error=e
            )
    """
    error_id = error_id or str(uuid4())
    internal_detail = str(internal_error) if internal_error else None

    return SafeHTTPException(
        status_code=status_code,
        detail=user_message,
        internal_detail=internal_detail,
        error_id=error_id
    )


# Pre-defined safe error responses

def database_error(internal_error: Optional[Exception] = None) -> SafeHTTPException:
    """Database operation failed"""
    return safe_error_response(
        500,
        "A database error occurred. Please try again later.",
        internal_error=internal_error
    )


def validation_error(field: str, internal_error: Optional[Exception] = None) -> SafeHTTPException:
    """Data validation failed"""
    return safe_error_response(
        400,
        f"Invalid data for field: {field}",
        internal_error=internal_error
    )


def not_found_error(resource: str, resource_id: Optional[str] = None) -> SafeHTTPException:
    """Resource not found"""
    detail = f"{resource} not found"
    if resource_id:
        detail += f" (ID: {resource_id})"
    return safe_error_response(404, detail)


def permission_denied_error(action: str) -> SafeHTTPException:
    """Permission denied"""
    return safe_error_response(
        403,
        f"You do not have permission to {action}"
    )


def external_service_error(service: str, internal_error: Optional[Exception] = None) -> SafeHTTPException:
    """External service call failed"""
    return safe_error_response(
        502,
        f"Unable to connect to {service}. Please try again later.",
        internal_error=internal_error
    )


def file_operation_error(operation: str, internal_error: Optional[Exception] = None) -> SafeHTTPException:
    """File operation failed"""
    return safe_error_response(
        500,
        f"File {operation} failed. Please try again.",
        internal_error=internal_error
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for unhandled exceptions
    Ensures no sensitive information leaks in responses
    """
    error_id = str(uuid4())

    # Log the full exception server-side
    logger.error(
        f"Unhandled exception - Error ID {error_id}: {str(exc)}",
        exc_info=True,
        extra={
            "error_id": error_id,
            "path": request.url.path,
            "method": request.method
        }
    )

    # Return generic message to user
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Our team has been notified. (Error ID: " + error_id + ")",
            "error_id": error_id
        },
        headers={"X-Error-ID": error_id}
    )


# Common error messages (safe for users)
ERROR_MESSAGES = {
    "CREATE_FAILED": "Unable to create resource. Please check your input and try again.",
    "UPDATE_FAILED": "Unable to update resource. Please try again.",
    "DELETE_FAILED": "Unable to delete resource. Please try again.",
    "FETCH_FAILED": "Unable to retrieve data. Please try again.",
    "INVALID_INPUT": "Invalid input data. Please check your request.",
    "RESOURCE_NOT_FOUND": "The requested resource was not found.",
    "UNAUTHORIZED": "You must be authenticated to access this resource.",
    "FORBIDDEN": "You do not have permission to perform this action.",
    "CONFLICT": "This action conflicts with existing data.",
    "RATE_LIMITED": "Too many requests. Please try again later.",
    "SERVICE_UNAVAILABLE": "Service temporarily unavailable. Please try again later."
}


def get_safe_error_message(error_key: str, default: str = "An error occurred") -> str:
    """Get a safe, pre-defined error message"""
    return ERROR_MESSAGES.get(error_key, default)
