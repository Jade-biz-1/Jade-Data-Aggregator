from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles for RBAC system."""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class UserBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    role: UserRole = UserRole.VIEWER


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserWithPermissions(User):
    """User schema with role-based permissions."""
    permissions: dict = Field(default_factory=dict)

    @property
    def can_read(self) -> bool:
        """All authenticated users can read."""
        return True

    @property
    def can_write(self) -> bool:
        """Editors and admins can write."""
        return self.role in [UserRole.ADMIN, UserRole.EDITOR] or self.is_superuser

    @property
    def can_admin(self) -> bool:
        """Only admins can perform admin actions."""
        return self.role == UserRole.ADMIN or self.is_superuser