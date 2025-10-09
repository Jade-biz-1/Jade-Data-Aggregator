# Security Middleware Documentation

This directory contains security middleware implementations for the Data Aggregator Platform.

## Implemented Security Features

### 1. Input Validation (`input_validation.py`)

**Purpose:** Comprehensive input validation and sanitization to prevent injection attacks.

**Features:**
- SQL injection detection and prevention
- XSS (Cross-Site Scripting) detection
- HTML sanitization
- Email validation with RFC compliance
- URL validation with protocol whitelisting
- JSON field validation with depth limits
- String length limits
- Pagination parameter validation

**Usage:**
```python
from backend.middleware.input_validation import InputValidator

# Validate email
email = InputValidator.validate_email("user@example.com")

# Sanitize string input
safe_string = InputValidator.sanitize_string(user_input)

# Check for SQL injection
if InputValidator.check_sql_injection(query):
    raise ValueError("Dangerous SQL pattern detected")

# Check for XSS
if InputValidator.check_xss(content):
    raise ValueError("Dangerous XSS pattern detected")
```

**Validation Limits:**
- Max string length: 10,000 characters
- Max email length: 255 characters
- Max name length: 255 characters
- Max description: 5,000 characters
- Max URL length: 2,048 characters
- Max JSON depth: 10 levels
- Max JSON array size: 10,000 items

**Detected Patterns:**

*SQL Injection:*
- UNION SELECT statements
- INSERT INTO statements
- UPDATE SET statements
- DELETE FROM statements
- DROP TABLE statements
- SQL comments (--)
- Boolean-based injections (OR 1=1, AND 1=1)

*XSS:*
- `<script>` tags
- `javascript:` protocol
- Event handlers (onclick, onload, etc.)
- `<iframe>`, `<object>`, `<embed>` tags

---

### 2. Rate Limiting (`rate_limiting.py`)

**Purpose:** Prevent abuse and DDoS attacks by limiting request rates.

**Features:**
- Redis-based distributed rate limiting
- Sliding window algorithm
- Per-endpoint rate limits
- Per-user and per-IP rate limiting
- Automatic retry-after headers
- Graceful degradation if Redis is unavailable

**Rate Limits:**
- Login endpoint: 5 requests/minute
- Registration: 3 requests/minute
- API endpoints: 100 requests/minute
- File uploads: 10 requests/minute (configurable)

**Usage:**
```python
from backend.middleware.rate_limiting import RateLimiter

rate_limiter = RateLimiter(redis_client)

is_allowed, info = rate_limiter.check_rate_limit(
    key=f"user:{user_id}",
    max_requests=100,
    window_seconds=60
)

if not is_allowed:
    raise HTTPException(
        status_code=429,
        detail="Too many requests",
        headers={'Retry-After': str(info['retry_after'])}
    )
```

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retry (when limited)

---

### 3. Security Headers (`security_headers.py`)

**Purpose:** Add security headers to all HTTP responses.

**Headers Added:**

**Content Security Policy (CSP):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

**XSS Protection:**
- `X-XSS-Protection: 1; mode=block`

**MIME Sniffing Prevention:**
- `X-Content-Type-Options: nosniff`

**Clickjacking Protection:**
- `X-Frame-Options: DENY`

**HTTPS Enforcement:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

**Referrer Policy:**
- `Referrer-Policy: strict-origin-when-cross-origin`

**Permissions Policy:**
```
geolocation=(), microphone=(), camera=(), payment=(),
usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

**Usage:**
```python
from backend.middleware.security_headers import add_security_headers

# Add to FastAPI application
app.middleware("http")(add_security_headers)
```

---

## Configuration Files

### 1. CORS Configuration (`config/cors.py`)

**Environment-based CORS settings:**

**Production:**
- Specific whitelisted domains only
- Credentials allowed
- 10-minute max age

**Staging:**
- Staging domains only
- Credentials allowed
- 5-minute max age

**Development:**
- Localhost on all common ports
- Credentials allowed
- 5-minute max age

**Usage:**
```python
from backend.config.cors import CORSConfig
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    **CORSConfig.get_cors_config()
)
```

---

### 2. Security Configuration (`config/security.py`)

**Centralized security settings:**

**Password Requirements:**
- Minimum length: 8 characters
- Maximum length: 128 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain digit
- Optional: Special character

**Session Settings:**
- Timeout: 30 minutes
- Max login attempts: 5
- Lockout duration: 15 minutes

**Token Settings:**
- Algorithm: HS256
- Access token expiry: 30 minutes
- Refresh token expiry: 7 days

**File Upload Settings:**
- Max file size: 100 MB
- Allowed extensions: .csv, .json, .xlsx, .xls, .txt, .xml, .parquet, .avro
- Virus scanning: Enabled

**Usage:**
```python
from backend.config.security import SecurityConfig

# Validate password
is_valid, error = SecurityConfig.validate_password(password)
if not is_valid:
    raise ValueError(error)

# Get secret key
secret_key = SecurityConfig.get_secret_key()

# Get trusted hosts
trusted_hosts = SecurityConfig.get_trusted_hosts()
```

---

## Integration with FastAPI

**main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.middleware.rate_limiting import rate_limit_middleware
from backend.middleware.security_headers import add_security_headers
from backend.config.cors import CORSConfig

app = FastAPI()

# Add CORS
app.add_middleware(
    CORSMiddleware,
    **CORSConfig.get_cors_config()
)

# Add security headers
app.middleware("http")(add_security_headers)

# Add rate limiting
app.middleware("http")(rate_limit_middleware)
```

---

## Testing

**Test rate limiting:**
```bash
# Test login rate limit (should block after 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -v
done
```

**Test security headers:**
```bash
curl -I http://localhost:8001/api/health
# Check for security headers in response
```

**Test input validation:**
```bash
# Test SQL injection detection
curl -X POST http://localhost:8001/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"name":"test'; DROP TABLE users;--"}' \
  -v
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Rotate JWT secrets regularly**
3. **Monitor rate limit violations**
4. **Review and update CSP regularly**
5. **Keep dependencies updated**
6. **Enable Redis persistence for rate limiting**
7. **Use environment variables for secrets**
8. **Implement request logging**
9. **Set up intrusion detection**
10. **Regular security audits**

---

## Environment Variables

Required for production:

```bash
# Security
JWT_SECRET_KEY=your-secret-key-change-me
ENVIRONMENT=production

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Monitoring

**Metrics to monitor:**
- Rate limit violations per endpoint
- Failed authentication attempts
- SQL injection attempts blocked
- XSS attempts blocked
- Unusual request patterns
- Response times (rate limiting overhead)

**Alerts to set up:**
- Multiple rate limit violations from same IP
- Repeated SQL injection attempts
- Failed login attempts > threshold
- Unusual traffic patterns

---

## Maintenance

**Regular tasks:**
- Review rate limit logs
- Update security patterns
- Audit CORS origins
- Review CSP violations
- Update allowed file extensions
- Test security headers
- Review authentication logs

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Rate Limiting Algorithms](https://en.wikipedia.org/wiki/Rate_limiting)

---

**Last Updated:** October 7, 2025
**Version:** 1.0.0
**Status:** Production Ready
