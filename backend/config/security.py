"""
Security Configuration
Centralized security settings
"""

import os
from typing import List


class SecurityConfig:
    """
    Security configuration settings
    """

    # Password requirements
    MIN_PASSWORD_LENGTH = 8
    MAX_PASSWORD_LENGTH = 128
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL_CHAR = False

    # Session settings
    SESSION_TIMEOUT_MINUTES = 30
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15

    # Token settings
    JWT_ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    # Rate limiting (requests per minute)
    RATE_LIMIT_LOGIN = 5
    RATE_LIMIT_REGISTER = 3
    RATE_LIMIT_API = 100
    RATE_LIMIT_FILE_UPLOAD = 10

    # File upload settings
    MAX_FILE_SIZE_MB = 100
    ALLOWED_FILE_EXTENSIONS = [
        '.csv', '.json', '.xlsx', '.xls', '.txt',
        '.xml', '.parquet', '.avro'
    ]
    SCAN_UPLOADED_FILES = True

    # SQL Injection protection
    ENABLE_SQL_INJECTION_DETECTION = True
    BLOCK_DANGEROUS_SQL_PATTERNS = True

    # XSS protection
    ENABLE_XSS_DETECTION = True
    HTML_ESCAPE_USER_INPUT = True

    # CSRF protection
    ENABLE_CSRF_PROTECTION = True
    CSRF_TOKEN_EXPIRE_MINUTES = 60

    @classmethod
    def get_secret_key(cls) -> str:
        """Get JWT secret key from environment"""
        secret = os.getenv('JWT_SECRET_KEY')
        if not secret:
            if os.getenv('ENVIRONMENT') == 'production':
                raise ValueError("JWT_SECRET_KEY must be set in production")
            secret = 'dev-secret-key-change-in-production'
        return secret

    @classmethod
    def get_trusted_hosts(cls) -> List[str]:
        """Get list of trusted hosts"""
        environment = os.getenv('ENVIRONMENT', 'development')

        if environment == 'production':
            return [
                'yourdomain.com',
                'www.yourdomain.com',
                'api.yourdomain.com',
            ]
        elif environment == 'staging':
            return [
                'staging.yourdomain.com',
                'staging-api.yourdomain.com',
            ]
        else:
            return [
                'localhost',
                '127.0.0.1',
            ]

    @classmethod
    def validate_password(cls, password: str) -> tuple[bool, str]:
        """
        Validate password against security requirements

        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < cls.MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {cls.MIN_PASSWORD_LENGTH} characters"

        if len(password) > cls.MAX_PASSWORD_LENGTH:
            return False, f"Password must not exceed {cls.MAX_PASSWORD_LENGTH} characters"

        if cls.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"

        if cls.REQUIRE_LOWERCASE and not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"

        if cls.REQUIRE_DIGIT and not any(c.isdigit() for c in password):
            return False, "Password must contain at least one digit"

        if cls.REQUIRE_SPECIAL_CHAR:
            special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            if not any(c in special_chars for c in password):
                return False, "Password must contain at least one special character"

        return True, ""
