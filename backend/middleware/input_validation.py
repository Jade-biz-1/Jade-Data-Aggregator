"""
Input Validation Middleware
Provides comprehensive input validation and sanitization for all API endpoints
"""

from fastapi import Request, HTTPException
from typing import Any, Dict
import re
import html
from pydantic import BaseModel, validator


class InputValidator:
    """
    Input validation and sanitization utilities
    """

    # Maximum lengths for common fields
    MAX_STRING_LENGTH = 10000
    MAX_EMAIL_LENGTH = 255
    MAX_NAME_LENGTH = 255
    MAX_DESCRIPTION_LENGTH = 5000
    MAX_URL_LENGTH = 2048

    # Patterns
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    URL_PATTERN = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )

    # Dangerous patterns for SQL injection
    SQL_INJECTION_PATTERNS = [
        r'(\bunion\b.*\bselect\b)',
        r'(\bselect\b.*\bfrom\b)',
        r'(\binsert\b.*\binto\b)',
        r'(\bupdate\b.*\bset\b)',
        r'(\bdelete\b.*\bfrom\b)',
        r'(\bdrop\b.*\btable\b)',
        r'(--)',
        r'(;)',
        r'(\bor\b\s+\d+\s*=\s*\d+)',
        r'(\band\b\s+\d+\s*=\s*\d+)',
    ]

    # XSS patterns
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',  # event handlers like onclick=
        r'<iframe',
        r'<object',
        r'<embed',
    ]

    @classmethod
    def sanitize_string(cls, value: str, max_length: int = MAX_STRING_LENGTH) -> str:
        """
        Sanitize string input by removing HTML and limiting length
        """
        if not value:
            return value

        # HTML escape
        sanitized = html.escape(value)

        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]

        return sanitized

    @classmethod
    def validate_email(cls, email: str) -> str:
        """
        Validate email format
        """
        if not email:
            raise ValueError("Email cannot be empty")

        if len(email) > cls.MAX_EMAIL_LENGTH:
            raise ValueError(f"Email too long (max {cls.MAX_EMAIL_LENGTH} characters)")

        if not cls.EMAIL_PATTERN.match(email):
            raise ValueError("Invalid email format")

        return email.lower()

    @classmethod
    def validate_url(cls, url: str) -> str:
        """
        Validate URL format
        """
        if not url:
            raise ValueError("URL cannot be empty")

        if len(url) > cls.MAX_URL_LENGTH:
            raise ValueError(f"URL too long (max {cls.MAX_URL_LENGTH} characters)")

        if not cls.URL_PATTERN.match(url):
            raise ValueError("Invalid URL format")

        # Only allow http and https
        if not url.startswith(('http://', 'https://')):
            raise ValueError("URL must start with http:// or https://")

        return url

    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """
        Check for SQL injection patterns
        Returns True if suspicious pattern found
        """
        if not value:
            return False

        value_lower = value.lower()

        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True

        return False

    @classmethod
    def check_xss(cls, value: str) -> bool:
        """
        Check for XSS patterns
        Returns True if suspicious pattern found
        """
        if not value:
            return False

        value_lower = value.lower()

        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True

        return False

    @classmethod
    def validate_json_field(cls, value: Dict[str, Any], max_depth: int = 10) -> Dict[str, Any]:
        """
        Validate JSON field for safety
        """
        def check_depth(obj: Any, current_depth: int = 0):
            if current_depth > max_depth:
                raise ValueError(f"JSON too deeply nested (max depth: {max_depth})")

            if isinstance(obj, dict):
                for key, val in obj.items():
                    # Check key
                    if not isinstance(key, str):
                        raise ValueError("JSON keys must be strings")
                    if len(key) > 255:
                        raise ValueError(f"JSON key too long: {key[:50]}...")

                    check_depth(val, current_depth + 1)
            elif isinstance(obj, list):
                if len(obj) > 10000:
                    raise ValueError("JSON array too large (max 10000 items)")
                for item in obj:
                    check_depth(item, current_depth + 1)

        check_depth(value)
        return value

    @classmethod
    def validate_pagination(cls, skip: int, limit: int, max_limit: int = 1000) -> tuple:
        """
        Validate pagination parameters
        """
        if skip < 0:
            raise ValueError("Skip must be non-negative")

        if limit < 1:
            raise ValueError("Limit must be at least 1")

        if limit > max_limit:
            raise ValueError(f"Limit too large (max {max_limit})")

        return skip, limit


async def validate_request_data(request: Request, call_next):
    """
    Middleware to validate request data
    """
    try:
        # Get request body if present
        if request.method in ["POST", "PUT", "PATCH"]:
            # Note: We can't easily read the body here without consuming it
            # Individual endpoints should use Pydantic models for validation
            pass

        response = await call_next(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the error but don't expose details
        print(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid request data")


# Base models with validation
class ValidatedStringField(BaseModel):
    """Base model for validated string fields"""

    @validator('*', pre=True)
    def validate_strings(cls, v):
        if isinstance(v, str):
            # Check for SQL injection
            if InputValidator.check_sql_injection(v):
                raise ValueError("Input contains potentially dangerous SQL patterns")

            # Check for XSS
            if InputValidator.check_xss(v):
                raise ValueError("Input contains potentially dangerous XSS patterns")

            # Sanitize
            v = InputValidator.sanitize_string(v)

        return v