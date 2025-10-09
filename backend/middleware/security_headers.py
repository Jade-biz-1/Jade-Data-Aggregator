"""
Security Headers Middleware
Adds security headers to all responses
"""

from fastapi import Request
from fastapi.responses import Response


async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all responses
    """
    response: Response = await call_next(request)

    # Content Security Policy
    csp_directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ]
    response.headers['Content-Security-Policy'] = "; ".join(csp_directives)

    # XSS Protection
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # Clickjacking protection
    response.headers['X-Frame-Options'] = 'DENY'

    # Force HTTPS
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Permissions Policy (formerly Feature-Policy)
    permissions_policy = [
        "geolocation=()",
        "microphone=()",
        "camera=()",
        "payment=()",
        "usb=()",
        "magnetometer=()",
        "gyroscope=()",
        "accelerometer=()"
    ]
    response.headers['Permissions-Policy'] = ", ".join(permissions_policy)

    # Remove server header
    if 'Server' in response.headers:
        del response.headers['Server']

    # Remove X-Powered-By header
    if 'X-Powered-By' in response.headers:
        del response.headers['X-Powered-By']

    return response
