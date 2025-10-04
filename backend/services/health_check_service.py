"""
Health Check Service

Provides health check endpoints for monitoring system status.
Part of Phase 6: Production Readiness
"""

import os
import psutil
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from backend.models.pipeline import Pipeline
from backend.models.user import User
from backend.services.cache_service import cache_service


class HealthCheckService:
    """Service for system health checks"""

    async def get_health_status(
        self,
        db: AsyncSession,
        include_details: bool = False
    ) -> Dict[str, Any]:
        """
        Get comprehensive health status

        Args:
            db: Database session
            include_details: Include detailed metrics

        Returns:
            Health status dict
        """
        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {}
        }

        # Database health
        db_health = await self.check_database(db)
        status["checks"]["database"] = db_health

        # Cache health
        cache_health = await self.check_cache()
        status["checks"]["cache"] = cache_health

        # System resources
        if include_details:
            status["checks"]["system"] = await self.check_system_resources()

        # Application metrics
        if include_details:
            status["checks"]["application"] = await self.check_application_metrics(db)

        # Determine overall status
        failed_checks = [
            name for name, check in status["checks"].items()
            if not check.get("healthy", False)
        ]

        if failed_checks:
            status["status"] = "unhealthy"
            status["failed_checks"] = failed_checks
        elif any(
            check.get("status") == "degraded"
            for check in status["checks"].values()
        ):
            status["status"] = "degraded"

        return status

    async def check_database(self, db: AsyncSession) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        try:
            start_time = datetime.utcnow()

            # Simple query to test connectivity
            await db.execute(text("SELECT 1"))

            # Calculate response time
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Get connection pool stats
            pool = db.get_bind().pool
            pool_size = pool.size()
            checked_out = pool.checkedout()
            overflow = pool.overflow()

            return {
                "healthy": True,
                "response_time_ms": round(response_time, 2),
                "pool_size": pool_size,
                "connections_in_use": checked_out,
                "overflow_connections": overflow,
                "status": "degraded" if checked_out > pool_size * 0.8 else "healthy"
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "unhealthy"
            }

    async def check_cache(self) -> Dict[str, Any]:
        """Check cache (Redis) connectivity"""
        try:
            stats = await cache_service.get_stats()

            if stats.get("connected"):
                return {
                    "healthy": True,
                    "used_memory": stats.get("used_memory"),
                    "total_keys": stats.get("total_keys"),
                    "uptime_seconds": stats.get("uptime_seconds"),
                    "hit_rate": round(stats.get("hit_rate", 0), 2),
                    "status": "healthy"
                }
            else:
                return {
                    "healthy": False,
                    "error": stats.get("error", "Cache not connected"),
                    "status": "unhealthy"
                }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "unhealthy"
            }

    async def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_gb = memory.available / (1024 ** 3)

            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free_gb = disk.free / (1024 ** 3)

            # Determine status
            status = "healthy"
            if cpu_percent > 80 or memory_percent > 85 or disk_percent > 90:
                status = "degraded"
            if cpu_percent > 95 or memory_percent > 95 or disk_percent > 95:
                status = "critical"

            return {
                "healthy": status != "critical",
                "cpu_percent": round(cpu_percent, 1),
                "memory_percent": round(memory_percent, 1),
                "memory_available_gb": round(memory_available_gb, 2),
                "disk_percent": round(disk_percent, 1),
                "disk_free_gb": round(disk_free_gb, 2),
                "status": status
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "unknown"
            }

    async def check_application_metrics(
        self,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Check application-specific metrics"""
        try:
            # Count active pipelines
            result = await db.execute(
                select(Pipeline).where(Pipeline.is_active == True)
            )
            active_pipelines = len(result.scalars().all())

            # Count total users
            result = await db.execute(select(User))
            total_users = len(result.scalars().all())

            # Count active users
            result = await db.execute(
                select(User).where(User.is_active == True)
            )
            active_users = len(result.scalars().all())

            return {
                "healthy": True,
                "active_pipelines": active_pipelines,
                "total_users": total_users,
                "active_users": active_users,
                "status": "healthy"
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "unhealthy"
            }

    async def get_readiness(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Check if application is ready to serve traffic

        Args:
            db: Database session

        Returns:
            Readiness status dict
        """
        ready = True
        checks = {}

        # Check database
        db_check = await self.check_database(db)
        checks["database"] = db_check["healthy"]
        ready = ready and db_check["healthy"]

        # Check cache
        cache_check = await self.check_cache()
        checks["cache"] = cache_check["healthy"]
        # Cache is optional, don't fail readiness if cache is down

        return {
            "ready": ready,
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def get_liveness(self) -> Dict[str, Any]:
        """
        Check if application is alive (lightweight check)

        Returns:
            Liveness status dict
        """
        return {
            "alive": True,
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": self._get_uptime()
        }

    def _get_uptime(self) -> float:
        """Get application uptime in seconds"""
        try:
            return psutil.Process(os.getpid()).create_time()
        except:
            return 0.0

    async def get_metrics(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get Prometheus-compatible metrics

        Args:
            db: Database session

        Returns:
            Metrics dict
        """
        metrics = {}

        # System metrics
        system = await self.check_system_resources()
        metrics["cpu_usage_percent"] = system.get("cpu_percent", 0)
        metrics["memory_usage_percent"] = system.get("memory_percent", 0)
        metrics["disk_usage_percent"] = system.get("disk_percent", 0)

        # Database metrics
        db_check = await self.check_database(db)
        metrics["database_response_time_ms"] = db_check.get("response_time_ms", 0)
        metrics["database_connections_active"] = db_check.get("connections_in_use", 0)
        metrics["database_pool_size"] = db_check.get("pool_size", 0)

        # Cache metrics
        cache_check = await self.check_cache()
        metrics["cache_hit_rate"] = cache_check.get("hit_rate", 0)
        metrics["cache_total_keys"] = cache_check.get("total_keys", 0)

        # Application metrics
        app_metrics = await self.check_application_metrics(db)
        metrics["active_pipelines"] = app_metrics.get("active_pipelines", 0)
        metrics["total_users"] = app_metrics.get("total_users", 0)
        metrics["active_users"] = app_metrics.get("active_users", 0)

        return {
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }


# Global health check service instance
health_check_service = HealthCheckService()
