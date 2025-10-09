"""
Rate Limiting Middleware
Implements request rate limiting using Redis
"""

from fastapi import Request, HTTPException
from typing import Callable
import time
from redis import Redis
from functools import wraps


class RateLimiter:
    """
    Rate limiting implementation using Redis
    """

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, dict]:
        """
        Check if request is within rate limit

        Args:
            key: Unique identifier for the client (e.g., IP address, user ID)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_allowed, info_dict)
        """
        current_time = int(time.time())
        window_start = current_time - window_seconds

        # Redis key for this rate limit
        redis_key = f"rate_limit:{key}"

        try:
            # Remove old entries outside the window
            self.redis.zremrangebyscore(redis_key, 0, window_start)

            # Count requests in current window
            request_count = self.redis.zcard(redis_key)

            if request_count >= max_requests:
                # Get oldest request time to calculate retry_after
                oldest_request = self.redis.zrange(redis_key, 0, 0, withscores=True)
                if oldest_request:
                    retry_after = int(oldest_request[0][1]) + window_seconds - current_time
                else:
                    retry_after = window_seconds

                return False, {
                    'limit': max_requests,
                    'remaining': 0,
                    'reset': current_time + retry_after,
                    'retry_after': retry_after
                }

            # Add current request
            self.redis.zadd(redis_key, {str(current_time): current_time})

            # Set expiry on the key
            self.redis.expire(redis_key, window_seconds)

            return True, {
                'limit': max_requests,
                'remaining': max_requests - request_count - 1,
                'reset': current_time + window_seconds
            }

        except Exception as e:
            # Log error but allow request if Redis fails
            print(f"Rate limiting error: {str(e)}")
            return True, {
                'limit': max_requests,
                'remaining': max_requests,
                'reset': current_time + window_seconds
            }


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to requests
    """
    # Get Redis client from app state
    redis_client = request.app.state.redis

    rate_limiter = RateLimiter(redis_client)

    # Different rate limits for different endpoints
    rate_limits = {
        '/api/auth/login': (5, 60),  # 5 requests per minute
        '/api/auth/register': (3, 60),  # 3 requests per minute
        '/api/': (100, 60),  # 100 requests per minute for API endpoints
    }

    # Get client identifier (IP address or user ID)
    client_id = request.client.host if request.client else 'unknown'

    # Check if user is authenticated and use user ID instead
    if hasattr(request.state, 'user') and request.state.user:
        client_id = f"user:{request.state.user.id}"

    # Find applicable rate limit
    max_requests, window_seconds = (100, 60)  # Default rate limit

    for path, limits in rate_limits.items():
        if request.url.path.startswith(path):
            max_requests, window_seconds = limits
            break

    # Check rate limit
    is_allowed, info = rate_limiter.check_rate_limit(
        f"{client_id}:{request.url.path}",
        max_requests,
        window_seconds
    )

    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
            headers={
                'X-RateLimit-Limit': str(info['limit']),
                'X-RateLimit-Remaining': str(info['remaining']),
                'X-RateLimit-Reset': str(info['reset']),
                'Retry-After': str(info.get('retry_after', window_seconds))
            }
        )

    # Add rate limit headers to response
    response = await call_next(request)

    response.headers['X-RateLimit-Limit'] = str(info['limit'])
    response.headers['X-RateLimit-Remaining'] = str(info['remaining'])
    response.headers['X-RateLimit-Reset'] = str(info['reset'])

    return response


def rate_limit(max_requests: int, window_seconds: int):
    """
    Decorator for endpoint-specific rate limiting
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This would need access to request object
            # Implementation depends on FastAPI's dependency injection
            return await func(*args, **kwargs)
        return wrapper
    return decorator
