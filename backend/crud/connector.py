from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.connector import Connector
from backend.schemas.connector import ConnectorCreate, ConnectorUpdate


class CRUDConnector:
    async def get(self, db: AsyncSession, id: int) -> Optional[Connector]:
        result = await db.execute(select(Connector).filter(Connector.id == id))
        return result.scalar_one_or_none()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        result = await db.execute(select(Connector).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: ConnectorCreate) -> Connector:
        db_obj = Connector(
            name=obj_in.name,
            connector_type=obj_in.connector_type,
            config=obj_in.config,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, db_obj: Connector, obj_in: ConnectorUpdate) -> Connector:
        obj_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            setattr(db_obj, field, obj_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, id: int) -> Connector:
        obj = await self.get(db, id)
        await db.delete(obj)
        await db.commit()
        return obj


connector = CRUDConnector()