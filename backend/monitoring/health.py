"""
Health Check Endpoints
Comprehensive health monitoring for all system components
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime
import psutil
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ============================================================================
# Models
# ============================================================================

class HealthStatus(BaseModel):
    """Health status model"""
    status: str  # healthy, degraded, unhealthy
    timestamp: datetime
    version: str
    environment: str


class ComponentHealth(BaseModel):
    """Individual component health"""
    name: str
    status: str  # healthy, degraded, unhealthy
    response_time_ms: Optional[float] = None
    message: Optional[str] = None
    details: Optional[Dict] = None


class DetailedHealthResponse(BaseModel):
    """Detailed health check response"""
    status: str
    timestamp: datetime
    version: str
    environment: str
    components: List[ComponentHealth]
    system: Dict


# ============================================================================
# Health Check Functions
# ============================================================================

async def check_database_health(db: AsyncSession) -> ComponentHealth:
    """Check database connectivity and performance"""
    start_time = asyncio.get_event_loop().time()

    try:
        # Simple query to test connection
        result = await db.execute(text("SELECT 1"))
        await result.fetchone()

        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        # Check if response time is acceptable
        if response_time > 1000:  # 1 second
            status = "degraded"
            message = "Database response time is high"
        elif response_time > 5000:  # 5 seconds
            status = "unhealthy"
            message = "Database response time is critical"
        else:
            status = "healthy"
            message = "Database connection is healthy"

        return ComponentHealth(
            name="database",
            status=status,
            response_time_ms=response_time,
            message=message,
            details={
                "connection": "active",
                "response_time_ms": round(response_time, 2)
            }
        )
    except Exception as e:
        return ComponentHealth(
            name="database",
            status="unhealthy",
            response_time_ms=None,
            message=f"Database connection failed: {str(e)}",
            details={"error": str(e)}
        )


async def check_redis_health(redis_client) -> ComponentHealth:
    """Check Redis connectivity and performance"""
    start_time = asyncio.get_event_loop().time()

    try:
        # Test Redis connection
        await redis_client.ping()

        response_time = (asyncio.get_event_loop().time() - start_time) * 1000

        # Get Redis info
        info = await redis_client.info()

        # Check memory usage
        used_memory_mb = info.get('used_memory', 0) / (1024 * 1024)
        max_memory_mb = info.get('maxmemory', 0) / (1024 * 1024)

        if max_memory_mb > 0:
            memory_usage_percent = (used_memory_mb / max_memory_mb) * 100
        else:
            memory_usage_percent = 0

        # Determine health status based on memory usage
        if memory_usage_percent > 90:
            status = "degraded"
            message = "Redis memory usage is high"
        elif memory_usage_percent > 95:
            status = "unhealthy"
            message = "Redis memory usage is critical"
        else:
            status = "healthy"
            message = "Redis connection is healthy"

        return ComponentHealth(
            name="redis",
            status=status,
            response_time_ms=response_time,
            message=message,
            details={
                "connection": "active",
                "used_memory_mb": round(used_memory_mb, 2),
                "memory_usage_percent": round(memory_usage_percent, 2),
                "connected_clients": info.get('connected_clients', 0)
            }
        )
    except Exception as e:
        return ComponentHealth(
            name="redis",
            status="unhealthy",
            response_time_ms=None,
            message=f"Redis connection failed: {str(e)}",
            details={"error": str(e)}
        )


def check_system_resources() -> ComponentHealth:
    """Check system resource usage"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        # Disk usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent

        # Determine health status
        if cpu_percent > 90 or memory_percent > 90 or disk_percent > 90:
            status = "degraded"
            message = "System resources are high"
        elif cpu_percent > 95 or memory_percent > 95 or disk_percent > 95:
            status = "unhealthy"
            message = "System resources are critical"
        else:
            status = "healthy"
            message = "System resources are healthy"

        return ComponentHealth(
            name="system",
            status=status,
            message=message,
            details={
                "cpu_percent": round(cpu_percent, 2),
                "memory_percent": round(memory_percent, 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "disk_percent": round(disk_percent, 2),
                "disk_used_gb": round(disk.used / (1024**3), 2),
                "disk_total_gb": round(disk.total / (1024**3), 2)
            }
        )
    except Exception as e:
        return ComponentHealth(
            name="system",
            status="unhealthy",
            message=f"Failed to check system resources: {str(e)}",
            details={"error": str(e)}
        )


async def check_file_storage() -> ComponentHealth:
    """Check file storage health"""
    try:
        import os

        # Check if upload directory exists and is writable
        upload_dir = os.getenv('UPLOAD_DIR', '/tmp/uploads')

        if not os.path.exists(upload_dir):
            return ComponentHealth(
                name="file_storage",
                status="unhealthy",
                message="Upload directory does not exist",
                details={"upload_dir": upload_dir}
            )

        if not os.access(upload_dir, os.W_OK):
            return ComponentHealth(
                name="file_storage",
                status="unhealthy",
                message="Upload directory is not writable",
                details={"upload_dir": upload_dir}
            )

        # Check disk space
        disk = psutil.disk_usage(upload_dir)
        free_space_gb = disk.free / (1024**3)

        if free_space_gb < 1:  # Less than 1 GB
            status = "unhealthy"
            message = "File storage space is critical"
        elif free_space_gb < 5:  # Less than 5 GB
            status = "degraded"
            message = "File storage space is low"
        else:
            status = "healthy"
            message = "File storage is healthy"

        return ComponentHealth(
            name="file_storage",
            status=status,
            message=message,
            details={
                "upload_dir": upload_dir,
                "free_space_gb": round(free_space_gb, 2),
                "total_space_gb": round(disk.total / (1024**3), 2)
            }
        )
    except Exception as e:
        return ComponentHealth(
            name="file_storage",
            status="unhealthy",
            message=f"Failed to check file storage: {str(e)}",
            details={"error": str(e)}
        )


# ============================================================================
# Health Check Endpoints
# ============================================================================

def get_overall_status(components: List[ComponentHealth]) -> str:
    """Determine overall health status from components"""
    if any(c.status == "unhealthy" for c in components):
        return "unhealthy"
    elif any(c.status == "degraded" for c in components):
        return "degraded"
    else:
        return "healthy"


async def liveness_probe() -> HealthStatus:
    """
    Liveness probe - checks if application is running
    Used by Kubernetes/container orchestration for restart decisions
    """
    import os

    return HealthStatus(
        status="healthy",
        timestamp=datetime.utcnow(),
        version=os.getenv('APP_VERSION', '1.0.0'),
        environment=os.getenv('ENVIRONMENT', 'development')
    )


async def readiness_probe(
    db: AsyncSession,
    redis_client
) -> DetailedHealthResponse:
    """
    Readiness probe - checks if application is ready to serve traffic
    Used by Kubernetes/load balancers for routing decisions
    """
    import os

    # Check all critical components
    components = []

    # Database check
    db_health = await check_database_health(db)
    components.append(db_health)

    # Redis check (optional - can degrade gracefully)
    try:
        redis_health = await check_redis_health(redis_client)
        components.append(redis_health)
    except Exception:
        pass  # Redis is optional

    # System resources check
    system_health = check_system_resources()
    components.append(system_health)

    # File storage check
    storage_health = await check_file_storage()
    components.append(storage_health)

    # Determine overall status
    overall_status = get_overall_status(components)

    # Get system information
    system_info = {
        "cpu_count": psutil.cpu_count(),
        "python_version": os.sys.version.split()[0],
        "platform": os.sys.platform
    }

    return DetailedHealthResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version=os.getenv('APP_VERSION', '1.0.0'),
        environment=os.getenv('ENVIRONMENT', 'development'),
        components=components,
        system=system_info
    )


async def startup_probe(
    db: AsyncSession,
    redis_client
) -> DetailedHealthResponse:
    """
    Startup probe - checks if application has started successfully
    Used by Kubernetes for slow-starting applications
    """
    # Same as readiness but may have different thresholds
    return await readiness_probe(db, redis_client)


# ============================================================================
# Router
# ============================================================================

def create_health_router(get_db, get_redis) -> APIRouter:
    """Create health check router"""
    router = APIRouter(prefix="/health", tags=["health"])

    @router.get("/live", response_model=HealthStatus)
    async def liveness():
        """Liveness probe endpoint"""
        return await liveness_probe()

    @router.get("/ready", response_model=DetailedHealthResponse)
    async def readiness(
        db: AsyncSession = get_db,
        redis = get_redis
    ):
        """Readiness probe endpoint"""
        result = await readiness_probe(db, redis)

        # Return 503 if unhealthy
        if result.status == "unhealthy":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service is unhealthy"
            )

        return result

    @router.get("/startup", response_model=DetailedHealthResponse)
    async def startup(
        db: AsyncSession = get_db,
        redis = get_redis
    ):
        """Startup probe endpoint"""
        result = await startup_probe(db, redis)

        # Return 503 if not ready
        if result.status == "unhealthy":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service is not ready"
            )

        return result

    return router
