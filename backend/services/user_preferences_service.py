"""
User Preferences Service

Service layer for managing user preferences and settings.
Part of Sub-Phase 6A: Enhanced UI/UX Support
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Optional, Dict, Any
from datetime import datetime

from backend.models.user_preferences import UserPreference, WidgetPreference


class UserPreferencesService:
    """Service for managing user preferences"""

    async def get_user_preferences(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Optional[UserPreference]:
        """Get user preferences, create default if not exists"""
        result = await db.execute(
            select(UserPreference).where(UserPreference.user_id == user_id)
        )
        preferences = result.scalar_one_or_none()

        if not preferences:
            # Create default preferences
            preferences = await self.create_default_preferences(db, user_id)

        return preferences

    async def create_default_preferences(
        self,
        db: AsyncSession,
        user_id: int
    ) -> UserPreference:
        """Create default preferences for a new user"""
        preferences = UserPreference(
            user_id=user_id,
            theme="light",
            color_scheme="default",
            font_size="medium",
            sidebar_collapsed=False,
            notifications_enabled=True,
            sound_enabled=True,
            high_contrast=False,
            reduced_motion=False,
            screen_reader_optimized=False,
            keyboard_shortcuts_enabled=True,
            language="en",
            timezone="UTC",
            date_format="YYYY-MM-DD",
            time_format="24h",
            items_per_page=25,
            show_onboarding=True,
            custom_settings={}
        )

        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)

        return preferences

    async def update_preferences(
        self,
        db: AsyncSession,
        user_id: int,
        updates: Dict[str, Any]
    ) -> UserPreference:
        """Update user preferences"""
        preferences = await self.get_user_preferences(db, user_id)

        # Update allowed fields
        allowed_fields = {
            'theme', 'color_scheme', 'font_size', 'sidebar_collapsed',
            'notifications_enabled', 'sound_enabled', 'high_contrast',
            'reduced_motion', 'screen_reader_optimized', 'keyboard_shortcuts_enabled',
            'language', 'timezone', 'date_format', 'time_format',
            'default_dashboard', 'items_per_page', 'show_onboarding',
            'custom_settings'
        }

        for field, value in updates.items():
            if field in allowed_fields and hasattr(preferences, field):
                setattr(preferences, field, value)

        preferences.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(preferences)

        return preferences

    async def update_theme(
        self,
        db: AsyncSession,
        user_id: int,
        theme: str
    ) -> UserPreference:
        """Update theme preference"""
        return await self.update_preferences(db, user_id, {"theme": theme})

    async def update_accessibility(
        self,
        db: AsyncSession,
        user_id: int,
        accessibility_settings: Dict[str, bool]
    ) -> UserPreference:
        """Update accessibility settings"""
        allowed_settings = {
            'high_contrast', 'reduced_motion', 'screen_reader_optimized',
            'keyboard_shortcuts_enabled'
        }

        updates = {
            k: v for k, v in accessibility_settings.items()
            if k in allowed_settings
        }

        return await self.update_preferences(db, user_id, updates)

    async def update_regional_settings(
        self,
        db: AsyncSession,
        user_id: int,
        regional_settings: Dict[str, str]
    ) -> UserPreference:
        """Update regional settings"""
        allowed_settings = {'language', 'timezone', 'date_format', 'time_format'}

        updates = {
            k: v for k, v in regional_settings.items()
            if k in allowed_settings
        }

        return await self.update_preferences(db, user_id, updates)

    async def update_custom_setting(
        self,
        db: AsyncSession,
        user_id: int,
        key: str,
        value: Any
    ) -> UserPreference:
        """Update or add a custom setting"""
        preferences = await self.get_user_preferences(db, user_id)

        if preferences.custom_settings is None:
            preferences.custom_settings = {}

        preferences.custom_settings[key] = value
        preferences.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(preferences)

        return preferences

    async def delete_custom_setting(
        self,
        db: AsyncSession,
        user_id: int,
        key: str
    ) -> UserPreference:
        """Delete a custom setting"""
        preferences = await self.get_user_preferences(db, user_id)

        if preferences.custom_settings and key in preferences.custom_settings:
            del preferences.custom_settings[key]
            preferences.updated_at = datetime.utcnow()

            await db.commit()
            await db.refresh(preferences)

        return preferences

    async def reset_preferences(
        self,
        db: AsyncSession,
        user_id: int
    ) -> UserPreference:
        """Reset preferences to defaults"""
        # Delete existing preferences
        await db.execute(
            delete(UserPreference).where(UserPreference.user_id == user_id)
        )
        await db.commit()

        # Create new default preferences
        return await self.create_default_preferences(db, user_id)

    # Widget Preferences

    async def get_widget_preferences(
        self,
        db: AsyncSession,
        user_id: int,
        widget_id: Optional[str] = None
    ):
        """Get widget preferences for a user"""
        query = select(WidgetPreference).where(WidgetPreference.user_id == user_id)

        if widget_id:
            query = query.where(WidgetPreference.widget_id == widget_id)

        result = await db.execute(query)

        if widget_id:
            return result.scalar_one_or_none()
        else:
            return result.scalars().all()

    async def update_widget_preference(
        self,
        db: AsyncSession,
        user_id: int,
        widget_type: str,
        widget_id: str,
        config: Dict[str, Any],
        is_visible: Optional[bool] = None,
        is_collapsed: Optional[bool] = None
    ) -> WidgetPreference:
        """Update or create widget preference"""
        # Check if exists
        result = await db.execute(
            select(WidgetPreference).where(
                WidgetPreference.user_id == user_id,
                WidgetPreference.widget_id == widget_id
            )
        )
        widget_pref = result.scalar_one_or_none()

        if widget_pref:
            # Update existing
            widget_pref.widget_type = widget_type
            widget_pref.config = config
            if is_visible is not None:
                widget_pref.is_visible = is_visible
            if is_collapsed is not None:
                widget_pref.is_collapsed = is_collapsed
            widget_pref.updated_at = datetime.utcnow()
        else:
            # Create new
            widget_pref = WidgetPreference(
                user_id=user_id,
                widget_type=widget_type,
                widget_id=widget_id,
                config=config,
                is_visible=is_visible if is_visible is not None else True,
                is_collapsed=is_collapsed if is_collapsed is not None else False
            )
            db.add(widget_pref)

        await db.commit()
        await db.refresh(widget_pref)

        return widget_pref

    async def delete_widget_preference(
        self,
        db: AsyncSession,
        user_id: int,
        widget_id: str
    ) -> bool:
        """Delete widget preference"""
        result = await db.execute(
            delete(WidgetPreference).where(
                WidgetPreference.user_id == user_id,
                WidgetPreference.widget_id == widget_id
            )
        )
        await db.commit()

        return result.rowcount > 0


# Singleton instance
user_preferences_service = UserPreferencesService()
