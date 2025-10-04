"""
User Preferences API Endpoints

API endpoints for managing user preferences and settings.
Part of Sub-Phase 6A: Enhanced UI/UX Support
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
from pydantic import BaseModel

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.services.user_preferences_service import user_preferences_service


router = APIRouter(prefix="/preferences", tags=["preferences"])


# Schemas

class PreferencesResponse(BaseModel):
    id: int
    user_id: int
    theme: str
    color_scheme: str
    font_size: str
    sidebar_collapsed: bool
    notifications_enabled: bool
    sound_enabled: bool
    high_contrast: bool
    reduced_motion: bool
    screen_reader_optimized: bool
    keyboard_shortcuts_enabled: bool
    language: str
    timezone: str
    date_format: str
    time_format: str
    default_dashboard: Optional[str]
    items_per_page: int
    show_onboarding: bool
    custom_settings: Dict[str, Any]

    class Config:
        from_attributes = True


class PreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    color_scheme: Optional[str] = None
    font_size: Optional[str] = None
    sidebar_collapsed: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    screen_reader_optimized: Optional[bool] = None
    keyboard_shortcuts_enabled: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    default_dashboard: Optional[str] = None
    items_per_page: Optional[int] = None
    show_onboarding: Optional[bool] = None


class ThemeUpdate(BaseModel):
    theme: str  # light, dark, auto


class AccessibilityUpdate(BaseModel):
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    screen_reader_optimized: Optional[bool] = None
    keyboard_shortcuts_enabled: Optional[bool] = None


class RegionalSettingsUpdate(BaseModel):
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None


class CustomSettingUpdate(BaseModel):
    key: str
    value: Any


class WidgetPreferenceUpdate(BaseModel):
    widget_type: str
    widget_id: str
    config: Dict[str, Any]
    is_visible: Optional[bool] = None
    is_collapsed: Optional[bool] = None


class WidgetPreferenceResponse(BaseModel):
    id: int
    user_id: int
    widget_type: str
    widget_id: str
    config: Dict[str, Any]
    is_visible: bool
    is_collapsed: bool

    class Config:
        from_attributes = True


# Endpoints

@router.get("/", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's preferences"""
    preferences = await user_preferences_service.get_user_preferences(
        db=db,
        user_id=current_user.id
    )

    return preferences


@router.put("/", response_model=PreferencesResponse)
async def update_preferences(
    updates: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user preferences"""
    # Convert to dict, excluding None values
    updates_dict = {k: v for k, v in updates.dict().items() if v is not None}

    preferences = await user_preferences_service.update_preferences(
        db=db,
        user_id=current_user.id,
        updates=updates_dict
    )

    return preferences


@router.put("/theme", response_model=PreferencesResponse)
async def update_theme(
    theme: ThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update theme preference"""
    preferences = await user_preferences_service.update_theme(
        db=db,
        user_id=current_user.id,
        theme=theme.theme
    )

    return preferences


@router.put("/accessibility", response_model=PreferencesResponse)
async def update_accessibility(
    accessibility: AccessibilityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update accessibility settings"""
    settings_dict = {k: v for k, v in accessibility.dict().items() if v is not None}

    preferences = await user_preferences_service.update_accessibility(
        db=db,
        user_id=current_user.id,
        accessibility_settings=settings_dict
    )

    return preferences


@router.put("/regional", response_model=PreferencesResponse)
async def update_regional_settings(
    regional: RegionalSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update regional settings (language, timezone, date/time format)"""
    settings_dict = {k: v for k, v in regional.dict().items() if v is not None}

    preferences = await user_preferences_service.update_regional_settings(
        db=db,
        user_id=current_user.id,
        regional_settings=settings_dict
    )

    return preferences


@router.put("/custom", response_model=PreferencesResponse)
async def update_custom_setting(
    setting: CustomSettingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add or update a custom setting"""
    preferences = await user_preferences_service.update_custom_setting(
        db=db,
        user_id=current_user.id,
        key=setting.key,
        value=setting.value
    )

    return preferences


@router.delete("/custom/{key}", response_model=PreferencesResponse)
async def delete_custom_setting(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom setting"""
    preferences = await user_preferences_service.delete_custom_setting(
        db=db,
        user_id=current_user.id,
        key=key
    )

    return preferences


@router.post("/reset", response_model=PreferencesResponse)
async def reset_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reset all preferences to defaults"""
    preferences = await user_preferences_service.reset_preferences(
        db=db,
        user_id=current_user.id
    )

    return preferences


# Widget Preferences

@router.get("/widgets", response_model=list[WidgetPreferenceResponse])
async def get_widget_preferences(
    widget_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get widget preferences for current user"""
    preferences = await user_preferences_service.get_widget_preferences(
        db=db,
        user_id=current_user.id,
        widget_id=widget_id
    )

    if widget_id and preferences:
        return [preferences]
    elif widget_id:
        return []
    else:
        return preferences


@router.put("/widgets", response_model=WidgetPreferenceResponse)
async def update_widget_preference(
    widget: WidgetPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update or create widget preference"""
    preference = await user_preferences_service.update_widget_preference(
        db=db,
        user_id=current_user.id,
        widget_type=widget.widget_type,
        widget_id=widget.widget_id,
        config=widget.config,
        is_visible=widget.is_visible,
        is_collapsed=widget.is_collapsed
    )

    return preference


@router.delete("/widgets/{widget_id}")
async def delete_widget_preference(
    widget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete widget preference"""
    success = await user_preferences_service.delete_widget_preference(
        db=db,
        user_id=current_user.id,
        widget_id=widget_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget preference not found"
        )

    return {"message": "Widget preference deleted successfully"}
