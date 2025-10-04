"""
Pipeline Versions API Endpoints
Provides version control for pipelines
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from pydantic import BaseModel

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated, require_role
from backend.services.pipeline_version_service import PipelineVersionService

router = APIRouter()


# Pydantic models
class VersionCreate(BaseModel):
    change_description: str
    version_name: Optional[str] = None
    set_as_active: bool = False


# Version endpoints

@router.get("/pipelines/{pipeline_id}/versions")
async def get_pipeline_versions(
    pipeline_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get all versions of a pipeline"""
    versions = await PipelineVersionService.get_pipeline_versions(
        db=db,
        pipeline_id=pipeline_id,
        skip=skip,
        limit=limit
    )

    return {
        "pipeline_id": pipeline_id,
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
        ],
        "total": len(versions)
    }


@router.get("/pipelines/{pipeline_id}/versions/summary")
async def get_version_history_summary(
    pipeline_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get version history summary"""
    return await PipelineVersionService.get_version_history_summary(db, pipeline_id)


@router.get("/pipelines/{pipeline_id}/versions/active")
async def get_active_version(
    pipeline_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get the active version of a pipeline"""
    version = await PipelineVersionService.get_active_version(db, pipeline_id)

    if not version:
        raise HTTPException(status_code=404, detail="No active version found")

    return {
        "id": version.id,
        "version_number": version.version_number,
        "version_name": version.version_name,
        "change_description": version.change_description,
        "is_active": version.is_active,
        "created_at": version.created_at.isoformat() if version.created_at else None
    }


@router.get("/versions/{version_id}")
async def get_version(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get details of a specific version"""
    version = await PipelineVersionService.get_version(db, version_id)

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "id": version.id,
        "pipeline_id": version.pipeline_id,
        "version_number": version.version_number,
        "version_name": version.version_name,
        "change_description": version.change_description,
        "pipeline_snapshot": version.pipeline_snapshot,
        "visual_definition": version.visual_definition,
        "node_definitions": version.node_definitions,
        "edge_definitions": version.edge_definitions,
        "is_active": version.is_active,
        "created_at": version.created_at.isoformat() if version.created_at else None,
        "created_by": version.created_by
    }


@router.post("/pipelines/{pipeline_id}/versions")
async def create_version(
    pipeline_id: int,
    version: VersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Create a new version of a pipeline"""
    new_version = await PipelineVersionService.create_version(
        db=db,
        pipeline_id=pipeline_id,
        change_description=version.change_description,
        version_name=version.version_name,
        created_by=current_user.id,
        set_as_active=version.set_as_active
    )

    if not new_version:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    return {
        "id": new_version.id,
        "version_number": new_version.version_number,
        "version_name": new_version.version_name,
        "message": "Version created successfully"
    }


@router.post("/versions/{version_id}/activate")
async def activate_version(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Set a version as active"""
    version = await PipelineVersionService.set_active_version(db, version_id)

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "id": version.id,
        "version_number": version.version_number,
        "message": "Version activated successfully"
    }


@router.post("/versions/{version_id}/restore")
async def restore_version(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Restore a pipeline to a specific version"""
    pipeline = await PipelineVersionService.restore_version(
        db=db,
        version_id=version_id,
        created_by=current_user.id
    )

    if not pipeline:
        raise HTTPException(status_code=404, detail="Version not found")

    return {
        "pipeline_id": pipeline.id,
        "message": "Pipeline restored successfully"
    }


@router.get("/versions/{version_id_1}/compare/{version_id_2}")
async def compare_versions(
    version_id_1: int,
    version_id_2: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Compare two versions of a pipeline"""
    comparison = await PipelineVersionService.compare_versions(db, version_id_1, version_id_2)

    if "error" in comparison:
        raise HTTPException(status_code=400, detail=comparison["error"])

    return comparison


@router.delete("/versions/{version_id}")
async def delete_version(
    version_id: int,
    allow_delete_active: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Dict[str, str]:
    """Delete a pipeline version"""
    success = await PipelineVersionService.delete_version(
        db=db,
        version_id=version_id,
        allow_delete_active=allow_delete_active
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete version (it may be active or not found)"
        )

    return {"message": "Version deleted successfully"}
