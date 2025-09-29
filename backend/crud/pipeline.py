from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.pipeline import Pipeline
from backend.schemas.pipeline import PipelineCreate, PipelineUpdate


class CRUDPipeline:
    async def get(self, db: AsyncSession, id: int) -> Optional[Pipeline]:
        result = await db.execute(select(Pipeline).filter(Pipeline.id == id))
        return result.scalar_one_or_none()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        result = await db.execute(select(Pipeline).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: PipelineCreate) -> Pipeline:
        db_obj = Pipeline(
            name=obj_in.name,
            description=obj_in.description,
            source_config=obj_in.source_config,
            destination_config=obj_in.destination_config,
            transformation_config=obj_in.transformation_config,
            schedule=obj_in.schedule,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, db_obj: Pipeline, obj_in: PipelineUpdate) -> Pipeline:
        obj_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            setattr(db_obj, field, obj_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, id: int) -> Pipeline:
        obj = await self.get(db, id)
        await db.delete(obj)
        await db.commit()
        return obj


pipeline = CRUDPipeline()