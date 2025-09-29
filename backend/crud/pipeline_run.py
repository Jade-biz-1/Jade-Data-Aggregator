from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from backend.models.pipeline_run import PipelineRun
from backend.schemas.pipeline_run import PipelineRunCreate, PipelineRunUpdate


class CRUDPipelineRun:
    """CRUD operations for pipeline runs."""

    async def create(self, db: AsyncSession, *, obj_in: PipelineRunCreate) -> PipelineRun:
        """Create a new pipeline run."""
        obj_data = obj_in.dict()
        db_obj = PipelineRun(**obj_data)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def get(self, db: AsyncSession, id: int) -> Optional[PipelineRun]:
        """Get pipeline run by ID."""
        result = await db.execute(select(PipelineRun).filter(PipelineRun.id == id))
        return result.scalar_one_or_none()

    async def update(
        self, db: AsyncSession, *, db_obj: PipelineRun, obj_in: PipelineRunUpdate
    ) -> PipelineRun:
        """Update pipeline run."""
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_pipeline(
        self,
        db: AsyncSession,
        *,
        pipeline_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PipelineRun]:
        """Get all runs for a specific pipeline."""
        result = await db.execute(
            select(self.model)
            .filter(PipelineRun.pipeline_id == pipeline_id)
            .order_by(desc(PipelineRun.started_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_latest_run(
        self,
        db: AsyncSession,
        *,
        pipeline_id: int
    ) -> Optional[PipelineRun]:
        """Get the latest run for a specific pipeline."""
        result = await db.execute(
            select(self.model)
            .filter(PipelineRun.pipeline_id == pipeline_id)
            .order_by(desc(PipelineRun.started_at))
            .limit(1)
        )
        return result.scalars().first()

    async def get_running_runs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[PipelineRun]:
        """Get all currently running pipeline runs."""
        result = await db.execute(
            select(self.model)
            .options(selectinload(PipelineRun.pipeline))
            .filter(PipelineRun.status.in_(["queued", "running"]))
            .order_by(desc(PipelineRun.started_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_runs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10
    ) -> List[PipelineRun]:
        """Get recent pipeline runs across all pipelines."""
        result = await db.execute(
            select(self.model)
            .options(selectinload(PipelineRun.pipeline))
            .order_by(desc(PipelineRun.started_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


pipeline_run = CRUDPipelineRun()