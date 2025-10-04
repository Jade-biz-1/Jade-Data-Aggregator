"""
Health Check API Endpoints

API endpoints for system health monitoring.
Part of Phase 6: Production Readiness
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.services.health_check_service import health_check_service


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check(
    details: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Comprehensive health check

    Returns overall system health status with optional detailed metrics.
    """
    status = await health_check_service.get_health_status(
        db=db,
        include_details=details
    )
    return status


@router.get("/live")
async def liveness_check():
    """
    Liveness check (lightweight)

    Returns simple alive status. Used by container orchestrators (K8s).
    """
    return await health_check_service.get_liveness()


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Readiness check

    Returns whether the application is ready to serve traffic.
    Used by load balancers and container orchestrators.
    """
    return await health_check_service.get_readiness(db=db)


@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    """
    Get Prometheus-compatible metrics

    Returns system and application metrics for monitoring.
    """
    return await health_check_service.get_metrics(db=db)


@router.get("/database")
async def check_database(db: AsyncSession = Depends(get_db)):
    """Check database connectivity and performance"""
    return await health_check_service.check_database(db=db)


@router.get("/cache")
async def check_cache():
    """Check cache (Redis) connectivity and stats"""
    return await health_check_service.check_cache()


@router.get("/system")
async def check_system():
    """Check system resource usage"""
    return await health_check_service.check_system_resources()
