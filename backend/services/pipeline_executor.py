import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.pipeline import Pipeline
from backend.models.pipeline_run import PipelineRun
from backend.crud.pipeline_run import pipeline_run as crud_pipeline_run
from backend.crud.pipeline import pipeline as crud_pipeline
from backend.schemas.pipeline_run import PipelineRunCreate, PipelineRunUpdate

logger = logging.getLogger(__name__)


class PipelineExecutionError(Exception):
    """Custom exception for pipeline execution errors."""
    pass


class PipelineExecutor:
    """Service for executing data pipelines."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_pipeline(
        self,
        pipeline_id: int,
        execution_config: Optional[Dict[str, Any]] = None,
        triggered_by: str = "manual"
    ) -> PipelineRun:
        """
        Execute a pipeline and return the run record.

        Args:
            pipeline_id: ID of the pipeline to execute
            execution_config: Runtime configuration overrides
            triggered_by: How the pipeline was triggered (manual, scheduled, webhook)

        Returns:
            PipelineRun: The created pipeline run record

        Raises:
            PipelineExecutionError: If pipeline execution fails
        """
        # Get the pipeline
        pipeline = await crud_pipeline.get(self.db, id=pipeline_id)
        if not pipeline:
            raise PipelineExecutionError(f"Pipeline {pipeline_id} not found")

        if not pipeline.is_active:
            raise PipelineExecutionError(f"Pipeline {pipeline_id} is not active")

        # Create the run record
        run_create = PipelineRunCreate(
            pipeline_id=pipeline_id,
            status="running",
            execution_config=execution_config,
            triggered_by=triggered_by
        )

        run = await crud_pipeline_run.create(self.db, obj_in=run_create)
        await self.db.commit()

        try:
            # Execute the pipeline (this is where the actual data processing would happen)
            await self._execute_pipeline_logic(run, pipeline)

            # Update run as completed
            run_update = PipelineRunUpdate(
                status="completed",
                completed_at=datetime.utcnow()
            )
            run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
            await self.db.commit()

        except Exception as e:
            logger.error(f"Pipeline {pipeline_id} execution failed: {str(e)}")

            # Update run as failed
            run_update = PipelineRunUpdate(
                status="failed",
                error_message=str(e),
                completed_at=datetime.utcnow()
            )
            run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
            await self.db.commit()
            raise PipelineExecutionError(f"Pipeline execution failed: {str(e)}")

        return run

    async def _execute_pipeline_logic(self, run: PipelineRun, pipeline: Pipeline):
        """
        Execute the actual pipeline logic.

        This is a simplified implementation. In a real system, this would:
        1. Connect to the source system
        2. Extract data according to source_config
        3. Apply transformations according to transformation_config
        4. Load data to destination according to destination_config
        """

        # Simulate data processing
        records_to_process = 1000  # This would be determined by the actual data source
        batch_size = 100

        total_processed = 0
        total_failed = 0

        # Simulate batch processing
        for i in range(0, records_to_process, batch_size):
            # Simulate processing time
            await asyncio.sleep(0.1)  # 100ms per batch

            # Simulate some failures (10% failure rate)
            import random
            batch_processed = batch_size
            batch_failed = random.randint(0, batch_size // 10)
            batch_processed -= batch_failed

            total_processed += batch_processed
            total_failed += batch_failed

            # Update progress
            run_update = PipelineRunUpdate(
                records_processed=total_processed,
                records_failed=total_failed,
                logs=f"Processed batch {i//batch_size + 1}, "
                     f"total processed: {total_processed}, "
                     f"total failed: {total_failed}"
            )
            await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
            await self.db.commit()

        logger.info(f"Pipeline {pipeline.id} completed: "
                   f"{total_processed} processed, {total_failed} failed")

    async def cancel_run(self, run_id: int) -> PipelineRun:
        """Cancel a running pipeline."""
        run = await crud_pipeline_run.get(self.db, id=run_id)
        if not run:
            raise PipelineExecutionError(f"Pipeline run {run_id} not found")

        if run.status not in ["queued", "running"]:
            raise PipelineExecutionError(f"Cannot cancel run {run_id} with status {run.status}")

        run_update = PipelineRunUpdate(
            status="cancelled",
            completed_at=datetime.utcnow(),
            error_message="Cancelled by user"
        )

        run = await crud_pipeline_run.update(self.db, db_obj=run, obj_in=run_update)
        await self.db.commit()

        return run

    async def get_run_status(self, run_id: int) -> Optional[PipelineRun]:
        """Get the status of a pipeline run."""
        return await crud_pipeline_run.get(self.db, id=run_id)

    async def get_pipeline_runs(
        self,
        pipeline_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[PipelineRun]:
        """Get all runs for a pipeline."""
        return await crud_pipeline_run.get_by_pipeline(
            self.db,
            pipeline_id=pipeline_id,
            skip=skip,
            limit=limit
        )