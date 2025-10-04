"""
Pipeline Templates API Endpoints
Provides templates for quick pipeline creation
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated, require_role
from backend.services.pipeline_template_service import PipelineTemplateService
from backend.models.pipeline_template import PipelineTemplate

router = APIRouter()


# Pydantic models
class PipelineTemplateCreate(BaseModel):
    name: str
    description: str
    category: str = "general"
    template_definition: Dict[str, Any]
    node_definitions: Optional[Dict[str, Any]] = None
    edge_definitions: Optional[Dict[str, Any]] = None
    is_public: bool = False
    tags: Optional[List[str]] = None


class PipelineTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    template_definition: Optional[Dict[str, Any]] = None
    node_definitions: Optional[Dict[str, Any]] = None
    edge_definitions: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class PipelineFromTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None


# Template endpoints

@router.get("/")
async def list_pipeline_templates(
    category: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """List all pipeline templates"""
    templates = await PipelineTemplateService.list_templates(
        db=db,
        category=category,
        is_public=is_public,
        skip=skip,
        limit=limit
    )

    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "is_public": t.is_public,
                "use_count": t.use_count,
                "tags": t.tags,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in templates
        ],
        "total": len(templates)
    }


@router.get("/builtin")
async def get_builtin_templates(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get built-in pipeline templates"""
    templates = PipelineTemplateService.get_builtin_templates()

    return {
        "templates": templates,
        "total": len(templates)
    }


@router.get("/popular")
async def get_popular_templates(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get most popular templates"""
    templates = await PipelineTemplateService.get_popular_templates(db=db, limit=limit)

    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "use_count": t.use_count,
                "tags": t.tags
            }
            for t in templates
        ]
    }


@router.get("/by-category")
async def get_templates_by_category(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get templates grouped by category"""
    templates_by_category = await PipelineTemplateService.get_templates_by_category(db)

    return {
        category: [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "use_count": t.use_count,
                "tags": t.tags
            }
            for t in templates
        ]
        for category, templates in templates_by_category.items()
    }


@router.get("/{template_id}")
async def get_pipeline_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Get a specific pipeline template"""
    template = await PipelineTemplateService.get_template(db, template_id)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "category": template.category,
        "template_definition": template.template_definition,
        "node_definitions": template.node_definitions,
        "edge_definitions": template.edge_definitions,
        "is_public": template.is_public,
        "use_count": template.use_count,
        "tags": template.tags,
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "updated_at": template.updated_at.isoformat() if template.updated_at else None
    }


@router.post("/")
async def create_pipeline_template(
    template: PipelineTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Create a new pipeline template"""
    new_template = await PipelineTemplateService.create_template(
        db=db,
        name=template.name,
        description=template.description,
        category=template.category,
        template_definition=template.template_definition,
        node_definitions=template.node_definitions,
        edge_definitions=template.edge_definitions,
        is_public=template.is_public,
        created_by=current_user.id,
        tags=template.tags
    )

    return {
        "id": new_template.id,
        "name": new_template.name,
        "message": "Template created successfully"
    }


@router.put("/{template_id}")
async def update_pipeline_template(
    template_id: int,
    template: PipelineTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "editor"]))
) -> Dict[str, Any]:
    """Update a pipeline template"""
    updated_template = await PipelineTemplateService.update_template(
        db=db,
        template_id=template_id,
        **template.model_dump(exclude_unset=True)
    )

    if not updated_template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": updated_template.id,
        "name": updated_template.name,
        "message": "Template updated successfully"
    }


@router.delete("/{template_id}")
async def delete_pipeline_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Dict[str, str]:
    """Delete a pipeline template"""
    success = await PipelineTemplateService.delete_template(db, template_id)

    if not success:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/use")
async def create_pipeline_from_template(
    template_id: int,
    request: PipelineFromTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """Create a new pipeline from a template"""
    pipeline = await PipelineTemplateService.create_pipeline_from_template(
        db=db,
        template_id=template_id,
        name=request.name,
        description=request.description
    )

    if not pipeline:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": pipeline.id,
        "name": pipeline.name,
        "message": "Pipeline created from template successfully"
    }
