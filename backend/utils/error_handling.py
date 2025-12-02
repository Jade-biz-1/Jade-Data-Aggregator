# backend/utils/error_handling.py

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError
import logging

from backend.core.config import get_settings

# --- Logger Setup ---
logger = logging.getLogger(__name__)

# --- Custom Exception Classes ---

class AppBaseException(Exception):
    """Base exception for the application."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.detail)

class NotFoundException(AppBaseException):
    """Exception for resources that are not found."""
    def __init__(self, resource: str):
        super().__init__(status_code=404, detail=f"{resource} not found.")

class UnauthorizedException(AppBaseException):
    """Exception for unauthorized access attempts."""
    def __init__(self, detail: str = "Not authorized to perform this action."):
        super().__init__(status_code=403, detail=detail)

class BadRequestException(AppBaseException):
    """Exception for invalid client requests."""
    def __init__(self, detail: str = "Invalid request."):
        super().__init__(status_code=400, detail=detail)

# --- Exception Handlers ---

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Global handler for Starlette's HTTPException.
    Ensures consistent error response format.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def app_base_exception_handler(request: Request, exc: AppBaseException):
    """
    Handler for custom application exceptions.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    """
    Handler for Pydantic's ValidationError.
    Provides more detailed information about validation failures.
    """
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": exc.errors()},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """
    Generic handler for all other unhandled exceptions.
    Logs the error and returns a sanitized 500 response.
    """
    logger.error(f"Unhandled exception for request {request.method} {request.url}: {exc}", exc_info=True)
    
    # In production, do not expose internal error details
    if get_settings().environment == "production":
        detail = "An internal server error occurred."
    else:
        detail = f"An internal server error occurred: {str(exc)}"

    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )

def add_exception_handlers(app):
    """
    Adds all custom exception handlers to the FastAPI application instance.
    """
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(AppBaseException, app_base_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    # This should be the last one to catch any remaining exceptions
    app.add_exception_handler(Exception, generic_exception_handler)
