from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.models.transformation import Transformation as TransformationModel
from backend.schemas.transformation import TransformationCreate, TransformationUpdate


class CRUDTransformation:
    async def get(self, db: AsyncSession, id: int) -> Optional[TransformationModel]:
        result = await db.execute(
            select(TransformationModel).filter(TransformationModel.id == id)
        )
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[TransformationModel]:
        result = await db.execute(
            select(TransformationModel)
            .offset(skip)
            .limit(limit)
            .order_by(TransformationModel.id)
        )
        return result.scalars().all()

    async def create(
        self, db: AsyncSession, *, obj_in: TransformationCreate
    ) -> TransformationModel:
        db_obj = TransformationModel(
            name=obj_in.name,
            description=obj_in.description,
            transformation_type=obj_in.transformation_type,
            source_fields=obj_in.source_fields,
            target_fields=obj_in.target_fields,
            transformation_rules=obj_in.transformation_rules,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: TransformationModel,
        obj_in: TransformationUpdate
    ) -> TransformationModel:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> TransformationModel:
        result = await db.execute(
            select(TransformationModel).filter(TransformationModel.id == id)
        )
        obj = result.scalars().first()
        await db.delete(obj)
        await db.commit()
        return obj


transformation = CRUDTransformation()