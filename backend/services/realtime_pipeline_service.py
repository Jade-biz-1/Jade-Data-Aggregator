"""
Real-time Pipeline Status Service
Handles broadcasting pipeline status updates via WebSocket
"""

from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import logging

from backend.core.websocket import connection_manager

logger = logging.getLogger(__name__)


class RealtimePipelineService:
    """
    Service for broadcasting real-time pipeline status updates
    """

    def __init__(self):
        self.active_pipeline_tasks: Dict[int, asyncio.Task] = {}

    async def broadcast_pipeline_status(
        self,
        pipeline_id: int,
        status: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast pipeline status update to all subscribers
        """
        message = {
            "type": "pipeline_status",
            "pipeline_id": pipeline_id,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

        logger.info(f"Broadcasted pipeline {pipeline_id} status: {status}")

    async def broadcast_pipeline_progress(
        self,
        pipeline_id: int,
        progress_percent: float,
        current_step: str,
        total_steps: int,
        current_step_number: int,
        records_processed: int = 0
    ):
        """
        Broadcast pipeline execution progress
        """
        message = {
            "type": "pipeline_progress",
            "pipeline_id": pipeline_id,
            "progress_percent": round(progress_percent, 2),
            "current_step": current_step,
            "current_step_number": current_step_number,
            "total_steps": total_steps,
            "records_processed": records_processed,
            "timestamp": datetime.now().isoformat()
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

    async def broadcast_pipeline_log(
        self,
        pipeline_id: int,
        log_level: str,
        message_text: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast pipeline log message
        """
        message = {
            "type": "pipeline_log",
            "pipeline_id": pipeline_id,
            "log_level": log_level,
            "message": message_text,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

    async def broadcast_pipeline_error(
        self,
        pipeline_id: int,
        error_message: str,
        error_type: str,
        stack_trace: Optional[str] = None
    ):
        """
        Broadcast pipeline error
        """
        message = {
            "type": "pipeline_error",
            "pipeline_id": pipeline_id,
            "error_message": error_message,
            "error_type": error_type,
            "stack_trace": stack_trace,
            "timestamp": datetime.now().isoformat()
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

        logger.error(f"Pipeline {pipeline_id} error: {error_message}")

    async def broadcast_pipeline_completed(
        self,
        pipeline_id: int,
        success: bool,
        duration_seconds: float,
        records_processed: int,
        summary: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast pipeline completion
        """
        message = {
            "type": "pipeline_completed",
            "pipeline_id": pipeline_id,
            "success": success,
            "duration_seconds": round(duration_seconds, 2),
            "records_processed": records_processed,
            "summary": summary or {},
            "timestamp": datetime.now().isoformat()
        }

        await connection_manager.broadcast_to_pipeline_subscribers(
            message,
            pipeline_id
        )

        logger.info(
            f"Pipeline {pipeline_id} completed. "
            f"Success: {success}, Duration: {duration_seconds}s, "
            f"Records: {records_processed}"
        )

    async def start_pipeline_monitoring(
        self,
        pipeline_id: int,
        update_interval: float = 1.0
    ):
        """
        Start continuous monitoring and broadcasting of pipeline status
        This would integrate with actual pipeline execution
        """
        if pipeline_id in self.active_pipeline_tasks:
            logger.warning(f"Pipeline {pipeline_id} monitoring already active")
            return

        task = asyncio.create_task(
            self._monitor_pipeline(pipeline_id, update_interval)
        )
        self.active_pipeline_tasks[pipeline_id] = task

    async def stop_pipeline_monitoring(self, pipeline_id: int):
        """
        Stop monitoring a pipeline
        """
        if pipeline_id in self.active_pipeline_tasks:
            task = self.active_pipeline_tasks[pipeline_id]
            task.cancel()
            del self.active_pipeline_tasks[pipeline_id]
            logger.info(f"Stopped monitoring pipeline {pipeline_id}")

    async def _monitor_pipeline(
        self,
        pipeline_id: int,
        update_interval: float
    ):
        """
        Internal method to continuously monitor pipeline
        In production, this would read from actual pipeline execution state
        """
        try:
            # Simulate pipeline execution monitoring
            total_steps = 5
            steps = [
                "Initializing",
                "Fetching data",
                "Transforming data",
                "Validating results",
                "Storing results"
            ]

            for i, step in enumerate(steps):
                progress = ((i + 1) / total_steps) * 100

                await self.broadcast_pipeline_progress(
                    pipeline_id=pipeline_id,
                    progress_percent=progress,
                    current_step=step,
                    total_steps=total_steps,
                    current_step_number=i + 1,
                    records_processed=(i + 1) * 1000
                )

                await asyncio.sleep(update_interval)

        except asyncio.CancelledError:
            logger.info(f"Pipeline {pipeline_id} monitoring cancelled")
        except Exception as e:
            logger.error(f"Error monitoring pipeline {pipeline_id}: {e}")
            await self.broadcast_pipeline_error(
                pipeline_id=pipeline_id,
                error_message=str(e),
                error_type=type(e).__name__
            )


# Global service instance
realtime_pipeline_service = RealtimePipelineService()
