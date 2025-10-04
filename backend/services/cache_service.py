"""
Cache Service

Provides Redis-based caching for API responses and query results.
Part of Phase 6: Performance Optimization (T035)
"""

import os
import json
import hashlib
from typing import Optional, Any, Dict, List
from datetime import timedelta
import redis.asyncio as redis


class CacheService:
    """Service for caching API responses and database query results"""

    def __init__(self):
        """Initialize Redis connection"""
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.default_ttl = int(os.getenv("CACHE_DEFAULT_TTL", 300))  # 5 minutes
        self._redis_client: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Get or create Redis client"""
        if self._redis_client is None:
            self._redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self._redis_client

    async def close(self):
        """Close Redis connection"""
        if self._redis_client:
            await self._redis_client.close()
            self._redis_client = None

    def _generate_cache_key(self, prefix: str, **kwargs) -> str:
        """
        Generate cache key from prefix and parameters

        Args:
            prefix: Cache key prefix
            **kwargs: Key-value pairs to include in cache key

        Returns:
            Generated cache key
        """
        # Sort kwargs for consistent key generation
        params = sorted(kwargs.items())
        params_str = json.dumps(params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()
        return f"{prefix}:{params_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        try:
            redis_client = await self.get_redis()
            value = await redis_client.get(key)

            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for default)

        Returns:
            True if successful
        """
        try:
            redis_client = await self.get_redis()
            ttl = ttl or self.default_ttl

            serialized_value = json.dumps(value, default=str)
            await redis_client.setex(
                key,
                timedelta(seconds=ttl),
                serialized_value
            )
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache

        Args:
            key: Cache key

        Returns:
            True if successful
        """
        try:
            redis_client = await self.get_redis()
            await redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern

        Args:
            pattern: Key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        try:
            redis_client = await self.get_redis()
            keys = []

            async for key in redis_client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache

        Args:
            key: Cache key

        Returns:
            True if exists
        """
        try:
            redis_client = await self.get_redis()
            return await redis_client.exists(key) > 0
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False

    async def get_ttl(self, key: str) -> Optional[int]:
        """
        Get remaining TTL for key

        Args:
            key: Cache key

        Returns:
            TTL in seconds or None
        """
        try:
            redis_client = await self.get_redis()
            ttl = await redis_client.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            print(f"Cache get TTL error: {e}")
            return None

    # Specialized caching methods

    async def cache_query_result(
        self,
        query_name: str,
        result: Any,
        ttl: Optional[int] = None,
        **params
    ) -> bool:
        """
        Cache database query result

        Args:
            query_name: Query identifier
            result: Query result to cache
            ttl: Cache TTL
            **params: Query parameters

        Returns:
            True if successful
        """
        key = self._generate_cache_key(f"query:{query_name}", **params)
        return await self.set(key, result, ttl)

    async def get_cached_query(
        self,
        query_name: str,
        **params
    ) -> Optional[Any]:
        """
        Get cached query result

        Args:
            query_name: Query identifier
            **params: Query parameters

        Returns:
            Cached result or None
        """
        key = self._generate_cache_key(f"query:{query_name}", **params)
        return await self.get(key)

    async def invalidate_query_cache(
        self,
        query_name: Optional[str] = None
    ) -> int:
        """
        Invalidate query cache

        Args:
            query_name: Specific query to invalidate (None for all)

        Returns:
            Number of keys deleted
        """
        if query_name:
            pattern = f"query:{query_name}:*"
        else:
            pattern = "query:*"

        return await self.delete_pattern(pattern)

    async def cache_api_response(
        self,
        endpoint: str,
        response: Any,
        ttl: Optional[int] = None,
        **params
    ) -> bool:
        """
        Cache API response

        Args:
            endpoint: API endpoint
            response: Response data
            ttl: Cache TTL
            **params: Request parameters

        Returns:
            True if successful
        """
        key = self._generate_cache_key(f"api:{endpoint}", **params)
        return await self.set(key, response, ttl)

    async def get_cached_response(
        self,
        endpoint: str,
        **params
    ) -> Optional[Any]:
        """
        Get cached API response

        Args:
            endpoint: API endpoint
            **params: Request parameters

        Returns:
            Cached response or None
        """
        key = self._generate_cache_key(f"api:{endpoint}", **params)
        return await self.get(key)

    async def invalidate_api_cache(
        self,
        endpoint: Optional[str] = None
    ) -> int:
        """
        Invalidate API response cache

        Args:
            endpoint: Specific endpoint to invalidate (None for all)

        Returns:
            Number of keys deleted
        """
        if endpoint:
            pattern = f"api:{endpoint}:*"
        else:
            pattern = "api:*"

        return await self.delete_pattern(pattern)

    async def cache_user_session(
        self,
        user_id: int,
        session_data: Dict[str, Any],
        ttl: int = 3600
    ) -> bool:
        """
        Cache user session data

        Args:
            user_id: User ID
            session_data: Session data
            ttl: Session TTL (default 1 hour)

        Returns:
            True if successful
        """
        key = f"session:user:{user_id}"
        return await self.set(key, session_data, ttl)

    async def get_user_session(
        self,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get user session data

        Args:
            user_id: User ID

        Returns:
            Session data or None
        """
        key = f"session:user:{user_id}"
        return await self.get(key)

    async def clear_user_session(
        self,
        user_id: int
    ) -> bool:
        """
        Clear user session

        Args:
            user_id: User ID

        Returns:
            True if successful
        """
        key = f"session:user:{user_id}"
        return await self.delete(key)

    async def increment_counter(
        self,
        key: str,
        amount: int = 1
    ) -> int:
        """
        Increment a counter

        Args:
            key: Counter key
            amount: Amount to increment

        Returns:
            New counter value
        """
        try:
            redis_client = await self.get_redis()
            return await redis_client.incrby(key, amount)
        except Exception as e:
            print(f"Cache increment error: {e}")
            return 0

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics

        Returns:
            Cache statistics dict
        """
        try:
            redis_client = await self.get_redis()
            info = await redis_client.info()

            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "total_keys": await redis_client.dbsize(),
                "uptime_seconds": info.get("uptime_in_seconds", 0),
                "hit_rate": info.get("keyspace_hits", 0) / max(
                    info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1), 1
                )
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }


# Global cache service instance
cache_service = CacheService()
