"""
Pipeline Version Service
Manages pipeline versioning and history
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from backend.models.pipeline_template import PipelineVersion
from backend.models.pipeline import Pipeline


class PipelineVersionService:
    """Service for managing pipeline versions"""

    @staticmethod
    async def create_version(
        db: AsyncSession,
        pipeline_id: int,
        change_description: str,
        version_name: Optional[str] = None,
        created_by: Optional[int] = None,
        set_as_active: bool = False
    ) -> Optional[PipelineVersion]:
        """Create a new version of a pipeline"""
        # Get the pipeline
        result = await db.execute(
            select(Pipeline).where(Pipeline.id == pipeline_id)
        )
        pipeline = result.scalar_one_or_none()
        if not pipeline:
            return None

        # Get the current version number
        current_versions = await db.execute(
            select(PipelineVersion)
            .where(PipelineVersion.pipeline_id == pipeline_id)
            .order_by(PipelineVersion.version_number.desc())
        )
        latest_version = current_versions.scalar()
        next_version_number = (latest_version.version_number + 1) if latest_version else 1

        # Create snapshot of current pipeline state
        pipeline_snapshot = {
            "name": pipeline.name,
            "description": pipeline.description,
            "source_config": pipeline.source_config,
            "destination_config": pipeline.destination_config,
            "transformation_config": pipeline.transformation_config,
            "schedule": pipeline.schedule,
            "is_active": pipeline.is_active,
            "pipeline_type": pipeline.pipeline_type
        }

        # If setting as active, deactivate other versions
        if set_as_active:
            await db.execute(
                update(PipelineVersion)
                .where(PipelineVersion.pipeline_id == pipeline_id)
                .values(is_active=False)
            )

        # Create new version
        version = PipelineVersion(
            pipeline_id=pipeline_id,
            version_number=next_version_number,
            version_name=version_name or f"v{next_version_number}",
            change_description=change_description,
            pipeline_snapshot=pipeline_snapshot,
            visual_definition=pipeline.visual_definition,
            node_definitions=pipeline.node_definitions,
            edge_definitions=pipeline.edge_definitions,
            created_by=created_by,
            is_active=set_as_active
        )

        db.add(version)
        await db.commit()
        await db.refresh(version)
        return version

    @staticmethod
    async def get_version(
        db: AsyncSession,
        version_id: int
    ) -> Optional[PipelineVersion]:
        """Get a specific version"""
        result = await db.execute(
            select(PipelineVersion)
            .where(PipelineVersion.id == version_id)
            .options(selectinload(PipelineVersion.pipeline))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_pipeline_versions(
        db: AsyncSession,
        pipeline_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[PipelineVersion]:
        """Get all versions of a pipeline"""
        result = await db.execute(
            select(PipelineVersion)
            .where(PipelineVersion.pipeline_id == pipeline_id)
            .order_by(PipelineVersion.version_number.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_active_version(
        db: AsyncSession,
        pipeline_id: int
    ) -> Optional[PipelineVersion]:
        """Get the active version of a pipeline"""
        result = await db.execute(
            select(PipelineVersion)
            .where(
                PipelineVersion.pipeline_id == pipeline_id,
                PipelineVersion.is_active == True
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def set_active_version(
        db: AsyncSession,
        version_id: int
    ) -> Optional[PipelineVersion]:
        """Set a version as active"""
        version = await PipelineVersionService.get_version(db, version_id)
        if not version:
            return None

        # Deactivate all versions of this pipeline
        await db.execute(
            update(PipelineVersion)
            .where(PipelineVersion.pipeline_id == version.pipeline_id)
            .values(is_active=False)
        )

        # Activate this version
        version.is_active = True
        await db.commit()
        await db.refresh(version)
        return version

    @staticmethod
    async def restore_version(
        db: AsyncSession,
        version_id: int,
        created_by: Optional[int] = None
    ) -> Optional[Pipeline]:
        """Restore a pipeline to a specific version"""
        version = await PipelineVersionService.get_version(db, version_id)
        if not version:
            return None

        # Get the pipeline
        result = await db.execute(
            select(Pipeline).where(Pipeline.id == version.pipeline_id)
        )
        pipeline = result.scalar_one_or_none()
        if not pipeline:
            return None

        # Restore pipeline from snapshot
        snapshot = version.pipeline_snapshot
        pipeline.name = snapshot.get("name", pipeline.name)
        pipeline.description = snapshot.get("description", pipeline.description)
        pipeline.source_config = snapshot.get("source_config", {})
        pipeline.destination_config = snapshot.get("destination_config", {})
        pipeline.transformation_config = snapshot.get("transformation_config", {})
        pipeline.schedule = snapshot.get("schedule")
        pipeline.pipeline_type = snapshot.get("pipeline_type", "traditional")
        pipeline.visual_definition = version.visual_definition
        pipeline.node_definitions = version.node_definitions
        pipeline.edge_definitions = version.edge_definitions

        await db.commit()
        await db.refresh(pipeline)

        # Create a new version for this restore action
        await PipelineVersionService.create_version(
            db=db,
            pipeline_id=pipeline.id,
            change_description=f"Restored from version {version.version_number} ({version.version_name})",
            created_by=created_by
        )

        return pipeline

    @staticmethod
    async def compare_versions(
        db: AsyncSession,
        version_id_1: int,
        version_id_2: int
    ) -> Dict[str, Any]:
        """Compare two versions of a pipeline"""
        version1 = await PipelineVersionService.get_version(db, version_id_1)
        version2 = await PipelineVersionService.get_version(db, version_id_2)

        if not version1 or not version2:
            return {"error": "One or both versions not found"}

        if version1.pipeline_id != version2.pipeline_id:
            return {"error": "Versions are from different pipelines"}

        # Compare snapshots
        diff = {
            "version1": {
                "id": version1.id,
                "version_number": version1.version_number,
                "version_name": version1.version_name,
                "created_at": version1.created_at.isoformat() if version1.created_at else None
            },
            "version2": {
                "id": version2.id,
                "version_number": version2.version_number,
                "version_name": version2.version_name,
                "created_at": version2.created_at.isoformat() if version2.created_at else None
            },
            "differences": []
        }

        # Compare key fields
        snapshot1 = version1.pipeline_snapshot
        snapshot2 = version2.pipeline_snapshot

        fields_to_compare = [
            "name", "description", "source_config", "destination_config",
            "transformation_config", "schedule", "is_active", "pipeline_type"
        ]

        for field in fields_to_compare:
            val1 = snapshot1.get(field)
            val2 = snapshot2.get(field)
            if val1 != val2:
                diff["differences"].append({
                    "field": field,
                    "version1_value": val1,
                    "version2_value": val2
                })

        # Compare visual definitions
        if version1.visual_definition != version2.visual_definition:
            diff["differences"].append({
                "field": "visual_definition",
                "changed": True,
                "details": "Visual pipeline structure has changed"
            })

        return diff

    @staticmethod
    async def delete_version(
        db: AsyncSession,
        version_id: int,
        allow_delete_active: bool = False
    ) -> bool:
        """Delete a version (with safety checks)"""
        version = await PipelineVersionService.get_version(db, version_id)
        if not version:
            return False

        # Don't delete active version unless explicitly allowed
        if version.is_active and not allow_delete_active:
            return False

        await db.execute(
            delete(PipelineVersion).where(PipelineVersion.id == version_id)
        )
        await db.commit()
        return True

    @staticmethod
    async def get_version_history_summary(
        db: AsyncSession,
        pipeline_id: int
    ) -> Dict[str, Any]:
        """Get a summary of version history"""
        versions = await PipelineVersionService.get_pipeline_versions(db, pipeline_id)

        return {
            "pipeline_id": pipeline_id,
            "total_versions": len(versions),
            "latest_version": versions[0].version_number if versions else 0,
            "active_version": next(
                (v.version_number for v in versions if v.is_active),
                None
            ),
            "versions": [
                {
                    "id": v.id,
                    "version_number": v.version_number,
                    "version_name": v.version_name,
                    "change_description": v.change_description,
                    "is_active": v.is_active,
                    "created_at": v.created_at.isoformat() if v.created_at else None,
                    "created_by": v.created_by
                }
                for v in versions
            ]
        }
