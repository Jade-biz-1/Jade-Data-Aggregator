"""
Dashboard Layout API Endpoints

API endpoints for managing custom dashboard layouts.
Part of Sub-Phase 6A: Enhanced UI/UX Support
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.services.dashboard_layout_service import dashboard_layout_service


router = APIRouter(prefix="/dashboards", tags=["dashboards"])


# Schemas

class DashboardLayoutResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    layout_config: Dict[str, Any]
    is_default: bool
    is_shared: bool
    is_template: bool
    version: int
    parent_layout_id: Optional[int]
    view_count: int
    last_viewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardLayoutCreate(BaseModel):
    name: str
    description: Optional[str] = None
    layout_config: Dict[str, Any]
    is_default: bool = False
    is_shared: bool = False


class DashboardLayoutUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    is_shared: Optional[bool] = None


class DashboardLayoutClone(BaseModel):
    new_name: Optional[str] = None


class DashboardLayoutStats(BaseModel):
    total_layouts: int
    shared_layouts: int
    default_layout: Optional[str]
    most_viewed: Optional[str]
    total_views: int


# Endpoints

@router.get("/", response_model=List[DashboardLayoutResponse])
async def get_user_layouts(
    include_shared: bool = Query(True, description="Include shared layouts from other users"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all dashboard layouts for current user"""
    layouts = await dashboard_layout_service.get_user_layouts(
        db=db,
        user_id=current_user.id,
        include_shared=include_shared
    )

    return layouts


@router.get("/default", response_model=DashboardLayoutResponse)
async def get_default_layout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's default dashboard layout"""
    layout = await dashboard_layout_service.get_default_layout(
        db=db,
        user_id=current_user.id
    )

    if not layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default layout found"
        )

    return layout


@router.get("/templates", response_model=List[DashboardLayoutResponse])
async def get_layout_templates(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get available dashboard layout templates"""
    templates = await dashboard_layout_service.get_layout_templates(
        db=db,
        limit=limit
    )

    return templates


@router.get("/statistics", response_model=DashboardLayoutStats)
async def get_layout_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard layout statistics for current user"""
    stats = await dashboard_layout_service.get_layout_statistics(
        db=db,
        user_id=current_user.id
    )

    return stats


@router.get("/{layout_id}", response_model=DashboardLayoutResponse)
async def get_layout(
    layout_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific dashboard layout"""
    layout = await dashboard_layout_service.get_layout(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id
    )

    if not layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or access denied"
        )

    return layout


@router.post("/", response_model=DashboardLayoutResponse, status_code=status.HTTP_201_CREATED)
async def create_layout(
    layout: DashboardLayoutCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new dashboard layout"""
    new_layout = await dashboard_layout_service.create_layout(
        db=db,
        user_id=current_user.id,
        name=layout.name,
        layout_config=layout.layout_config,
        description=layout.description,
        is_default=layout.is_default,
        is_shared=layout.is_shared
    )

    return new_layout


@router.put("/{layout_id}", response_model=DashboardLayoutResponse)
async def update_layout(
    layout_id: int,
    layout: DashboardLayoutUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a dashboard layout"""
    updated_layout = await dashboard_layout_service.update_layout(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id,
        name=layout.name,
        description=layout.description,
        layout_config=layout.layout_config,
        is_default=layout.is_default,
        is_shared=layout.is_shared
    )

    if not updated_layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or you don't have permission to update it"
        )

    return updated_layout


@router.delete("/{layout_id}")
async def delete_layout(
    layout_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a dashboard layout"""
    success = await dashboard_layout_service.delete_layout(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or you don't have permission to delete it"
        )

    return {"message": "Layout deleted successfully"}


@router.post("/{layout_id}/clone", response_model=DashboardLayoutResponse, status_code=status.HTTP_201_CREATED)
async def clone_layout(
    layout_id: int,
    clone_data: DashboardLayoutClone,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clone a dashboard layout (from templates or shared layouts)"""
    cloned_layout = await dashboard_layout_service.clone_layout(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id,
        new_name=clone_data.new_name
    )

    if not cloned_layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or cannot be cloned"
        )

    return cloned_layout


@router.post("/{layout_id}/set-default", response_model=DashboardLayoutResponse)
async def set_default_layout(
    layout_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set a layout as the default dashboard"""
    layout = await dashboard_layout_service.set_default_layout(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id
    )

    if not layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or you don't have permission to set it as default"
        )

    return layout


@router.post("/{layout_id}/make-template", response_model=DashboardLayoutResponse)
async def create_template(
    layout_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Convert a layout to a template (admin only - add role check in production)"""
    # TODO: Add admin role check
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")

    layout = await dashboard_layout_service.create_template(
        db=db,
        layout_id=layout_id,
        user_id=current_user.id
    )

    if not layout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Layout not found or you don't have permission"
        )

    return layout
