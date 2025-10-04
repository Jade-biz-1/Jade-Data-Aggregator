"""
Live Metrics Streaming Service
Broadcasts system and pipeline performance metrics in real-time
"""

import asyncio
import psutil
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from backend.core.websocket import connection_manager

logger = logging.getLogger(__name__)


class MetricsStreamingService:
    """
    Service for streaming real-time system and pipeline metrics
    """

    def __init__(self):
        self.streaming_task: Optional[asyncio.Task] = None
        self.is_streaming = False
        self.update_interval = 5.0  # seconds

    async def broadcast_system_metrics(self):
        """
        Broadcast current system metrics to all connected clients
        """
        try:
            # Collect system metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            metrics = {
                "type": "system_metrics",
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "percent": round(cpu_percent, 2),
                    "count": psutil.cpu_count()
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "used_gb": round(memory.used / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "percent": round(memory.percent, 2)
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "percent": round(disk.percent, 2)
                }
            }

            await connection_manager.broadcast(metrics)

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

    async def broadcast_pipeline_metrics(
        self,
        pipeline_id: int,
        metrics: Dict[str, Any]
    ):
        """
        Broadcast pipeline-specific performance metrics
        """
        message = {
            "type": "pipeline_metrics",
            "pipeline_id": pipeline_id,
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

    async def broadcast_aggregated_pipeline_metrics(
        self,
        metrics: Dict[str, Any]
    ):
        """
        Broadcast aggregated metrics for all pipelines
        """
        message = {
            "type": "aggregated_pipeline_metrics",
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics
        }

        await connection_manager.broadcast(message)

    async def start_streaming(self, interval: float = 5.0):
        """
        Start continuous metrics streaming
        """
        if self.is_streaming:
            logger.warning("Metrics streaming already active")
            return

        self.update_interval = interval
        self.is_streaming = True
        self.streaming_task = asyncio.create_task(self._stream_metrics())
        logger.info(f"Started metrics streaming with {interval}s interval")

    async def stop_streaming(self):
        """
        Stop metrics streaming
        """
        if not self.is_streaming:
            return

        self.is_streaming = False
        if self.streaming_task:
            self.streaming_task.cancel()
            self.streaming_task = None

        logger.info("Stopped metrics streaming")

    async def _stream_metrics(self):
        """
        Internal method to continuously stream metrics
        """
        try:
            while self.is_streaming:
                # Only stream if there are active connections
                if connection_manager.get_connection_count() > 0:
                    await self.broadcast_system_metrics()

                await asyncio.sleep(self.update_interval)

        except asyncio.CancelledError:
            logger.info("Metrics streaming cancelled")
        except Exception as e:
            logger.error(f"Error in metrics streaming: {e}")
            self.is_streaming = False

    async def get_current_metrics(self) -> Dict[str, Any]:
        """
        Get current system metrics snapshot
        """
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "timestamp": datetime.now().isoformat(),
                "cpu_percent": round(cpu_percent, 2),
                "memory_percent": round(memory.percent, 2),
                "disk_percent": round(disk.percent, 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "memory_available_gb": round(memory.available / (1024**3), 2)
            }

        except Exception as e:
            logger.error(f"Error getting metrics snapshot: {e}")
            return {}

    async def broadcast_alert(
        self,
        alert_type: str,
        message: str,
        severity: str = "info",
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast system alert to all connected clients
        """
        alert = {
            "type": "system_alert",
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }

        await connection_manager.broadcast(alert)
        logger.info(f"Broadcasted alert: {alert_type} - {message}")


# Global service instance
metrics_streaming_service = MetricsStreamingService()
