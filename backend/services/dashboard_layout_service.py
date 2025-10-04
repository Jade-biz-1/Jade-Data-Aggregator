"""
Dashboard Layout Service

Service layer for managing custom dashboard layouts and configurations.
Part of Sub-Phase 6A: Enhanced UI/UX Support
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_
from typing import Optional, Dict, Any, List
from datetime import datetime

from backend.models.user_preferences import DashboardLayout


class DashboardLayoutService:
    """Service for managing dashboard layouts"""

    async def get_user_layouts(
        self,
        db: AsyncSession,
        user_id: int,
        include_shared: bool = True
    ) -> List[DashboardLayout]:
        """Get all layouts for a user"""
        query = select(DashboardLayout).where(
            or_(
                DashboardLayout.user_id == user_id,
                and_(
                    DashboardLayout.is_shared == True,
                    include_shared == True
                )
            )
        ).order_by(DashboardLayout.is_default.desc(), DashboardLayout.updated_at.desc())

        result = await db.execute(query)
        return result.scalars().all()

    async def get_layout(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: Optional[int] = None
    ) -> Optional[DashboardLayout]:
        """Get a specific layout"""
        query = select(DashboardLayout).where(DashboardLayout.id == layout_id)

        if user_id:
            # Verify access: owner or shared layout
            query = query.where(
                or_(
                    DashboardLayout.user_id == user_id,
                    DashboardLayout.is_shared == True
                )
            )

        result = await db.execute(query)
        layout = result.scalar_one_or_none()

        # Update view count and last viewed
        if layout:
            layout.view_count += 1
            layout.last_viewed_at = datetime.utcnow()
            await db.commit()
            await db.refresh(layout)

        return layout

    async def get_default_layout(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Optional[DashboardLayout]:
        """Get user's default layout"""
        result = await db.execute(
            select(DashboardLayout).where(
                DashboardLayout.user_id == user_id,
                DashboardLayout.is_default == True
            )
        )
        return result.scalar_one_or_none()

    async def create_layout(
        self,
        db: AsyncSession,
        user_id: int,
        name: str,
        layout_config: Dict[str, Any],
        description: Optional[str] = None,
        is_default: bool = False,
        is_shared: bool = False
    ) -> DashboardLayout:
        """Create a new dashboard layout"""
        # If setting as default, unset other defaults
        if is_default:
            await self._unset_default_layouts(db, user_id)

        layout = DashboardLayout(
            user_id=user_id,
            name=name,
            description=description,
            layout_config=layout_config,
            is_default=is_default,
            is_shared=is_shared,
            version=1
        )

        db.add(layout)
        await db.commit()
        await db.refresh(layout)

        return layout

    async def update_layout(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        layout_config: Optional[Dict[str, Any]] = None,
        is_default: Optional[bool] = None,
        is_shared: Optional[bool] = None
    ) -> Optional[DashboardLayout]:
        """Update an existing layout"""
        # Get layout and verify ownership
        result = await db.execute(
            select(DashboardLayout).where(
                DashboardLayout.id == layout_id,
                DashboardLayout.user_id == user_id
            )
        )
        layout = result.scalar_one_or_none()

        if not layout:
            return None

        # Update fields
        if name is not None:
            layout.name = name
        if description is not None:
            layout.description = description
        if layout_config is not None:
            layout.layout_config = layout_config
            layout.version += 1  # Increment version on config change
        if is_shared is not None:
            layout.is_shared = is_shared

        # Handle default flag
        if is_default is not None and is_default:
            await self._unset_default_layouts(db, user_id)
            layout.is_default = True
        elif is_default is not None and not is_default:
            layout.is_default = False

        layout.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(layout)

        return layout

    async def delete_layout(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: int
    ) -> bool:
        """Delete a layout"""
        result = await db.execute(
            delete(DashboardLayout).where(
                DashboardLayout.id == layout_id,
                DashboardLayout.user_id == user_id
            )
        )
        await db.commit()

        return result.rowcount > 0

    async def clone_layout(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: int,
        new_name: Optional[str] = None
    ) -> Optional[DashboardLayout]:
        """Clone a layout (from templates or shared layouts)"""
        # Get source layout (can be from another user if shared)
        result = await db.execute(
            select(DashboardLayout).where(
                DashboardLayout.id == layout_id,
                or_(
                    DashboardLayout.user_id == user_id,
                    DashboardLayout.is_shared == True,
                    DashboardLayout.is_template == True
                )
            )
        )
        source_layout = result.scalar_one_or_none()

        if not source_layout:
            return None

        # Create new layout
        cloned_layout = DashboardLayout(
            user_id=user_id,
            name=new_name or f"{source_layout.name} (Copy)",
            description=source_layout.description,
            layout_config=source_layout.layout_config.copy(),
            is_default=False,
            is_shared=False,
            is_template=False,
            version=1,
            parent_layout_id=layout_id
        )

        db.add(cloned_layout)
        await db.commit()
        await db.refresh(cloned_layout)

        return cloned_layout

    async def set_default_layout(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: int
    ) -> Optional[DashboardLayout]:
        """Set a layout as default"""
        # Verify ownership
        result = await db.execute(
            select(DashboardLayout).where(
                DashboardLayout.id == layout_id,
                DashboardLayout.user_id == user_id
            )
        )
        layout = result.scalar_one_or_none()

        if not layout:
            return None

        # Unset other defaults
        await self._unset_default_layouts(db, user_id)

        # Set as default
        layout.is_default = True
        layout.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(layout)

        return layout

    async def get_layout_templates(
        self,
        db: AsyncSession,
        limit: int = 50
    ) -> List[DashboardLayout]:
        """Get available layout templates"""
        result = await db.execute(
            select(DashboardLayout)
            .where(DashboardLayout.is_template == True)
            .order_by(DashboardLayout.view_count.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def create_template(
        self,
        db: AsyncSession,
        layout_id: int,
        user_id: int
    ) -> Optional[DashboardLayout]:
        """Convert a layout to a template (admin only)"""
        result = await db.execute(
            select(DashboardLayout).where(
                DashboardLayout.id == layout_id,
                DashboardLayout.user_id == user_id
            )
        )
        layout = result.scalar_one_or_none()

        if not layout:
            return None

        layout.is_template = True
        layout.is_shared = True
        layout.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(layout)

        return layout

    async def get_layout_statistics(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Dict[str, Any]:
        """Get layout statistics for a user"""
        result = await db.execute(
            select(DashboardLayout).where(DashboardLayout.user_id == user_id)
        )
        layouts = result.scalars().all()

        return {
            "total_layouts": len(layouts),
            "shared_layouts": sum(1 for l in layouts if l.is_shared),
            "default_layout": next((l.name for l in layouts if l.is_default), None),
            "most_viewed": max(layouts, key=lambda l: l.view_count).name if layouts else None,
            "total_views": sum(l.view_count for l in layouts)
        }

    async def _unset_default_layouts(
        self,
        db: AsyncSession,
        user_id: int
    ):
        """Unset all default layouts for a user"""
        await db.execute(
            update(DashboardLayout)
            .where(
                DashboardLayout.user_id == user_id,
                DashboardLayout.is_default == True
            )
            .values(is_default=False)
        )


# Singleton instance
dashboard_layout_service = DashboardLayoutService()
