"""Enhanced authentication service with password reset, email verification, and refresh tokens."""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend import crud
from backend.core.config import settings
from backend.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from backend.models.auth_token import AuthToken
from backend.models.user import User
from backend.schemas.auth import (
    EmailVerificationConfirm,
    EmailVerificationRequest,
    LoginResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshResponse,
    TokenRefresh,
)
from backend.services.email_service import email_service


class AuthService:
    """Enhanced authentication service."""

    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"

    async def request_password_reset(
        self,
        request: PasswordResetRequest,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Request password reset email."""
        # Find user by email
        user = await crud.user.get_by_email(db, email=request.email)

        if not user:
            # For security, don't reveal if email exists
            return {"message": "If the email exists, a password reset link has been sent"}

        # Generate reset token
        reset_token = self._generate_secure_token()
        expires_at = datetime.utcnow() + timedelta(hours=1)

        # Save token to database
        auth_token = AuthToken(
            token=reset_token,
            token_type="password_reset",
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(auth_token)
        await db.commit()

        # Send email
        await email_service.send_password_reset_email(
            to_email=user.email,
            username=user.username,
            reset_token=reset_token
        )

        return {"message": "If the email exists, a password reset link has been sent"}

    async def confirm_password_reset(
        self,
        request: PasswordResetConfirm,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Confirm password reset with token."""
        # Find valid token
        stmt = select(AuthToken).where(
            AuthToken.token == request.token,
            AuthToken.token_type == "password_reset",
            AuthToken.is_active == True,
            AuthToken.expires_at > datetime.utcnow()
        )
        result = await db.execute(stmt)
        auth_token = result.scalar_one_or_none()

        if not auth_token:
            raise ValueError("Invalid or expired reset token")

        # Get user
        user = await crud.user.get(db, id=auth_token.user_id)
        if not user:
            raise ValueError("User not found")

        # Update password
        hashed_password = get_password_hash(request.new_password)
        user.hashed_password = hashed_password

        # Deactivate token
        auth_token.is_active = False
        auth_token.used_at = datetime.utcnow()

        await db.commit()

        return {"message": "Password has been reset successfully"}

    async def request_email_verification(
        self,
        request: EmailVerificationRequest,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Request email verification."""
        user = await crud.user.get_by_email(db, email=request.email)

        if not user:
            return {"message": "If the email exists, a verification link has been sent"}

        if user.is_email_verified:
            return {"message": "Email is already verified"}

        # Generate verification token
        verification_token = self._generate_secure_token()
        expires_at = datetime.utcnow() + timedelta(hours=24)

        # Save token
        auth_token = AuthToken(
            token=verification_token,
            token_type="email_verification",
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(auth_token)
        await db.commit()

        # Send email
        await email_service.send_email_verification_email(
            to_email=user.email,
            username=user.username,
            verification_token=verification_token
        )

        return {"message": "If the email exists, a verification link has been sent"}

    async def confirm_email_verification(
        self,
        request: EmailVerificationConfirm,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Confirm email verification."""
        # Find valid token
        stmt = select(AuthToken).where(
            AuthToken.token == request.token,
            AuthToken.token_type == "email_verification",
            AuthToken.is_active == True,
            AuthToken.expires_at > datetime.utcnow()
        )
        result = await db.execute(stmt)
        auth_token = result.scalar_one_or_none()

        if not auth_token:
            raise ValueError("Invalid or expired verification token")

        # Get user
        user = await crud.user.get(db, id=auth_token.user_id)
        if not user:
            raise ValueError("User not found")

        # Mark email as verified
        user.is_email_verified = True

        # Deactivate token
        auth_token.is_active = False
        auth_token.used_at = datetime.utcnow()

        await db.commit()

        return {"message": "Email has been verified successfully"}

    async def login_with_refresh_token(
        self,
        username: str,
        password: str,
        db: AsyncSession
    ) -> LoginResponse:
        """Login and return both access and refresh tokens."""
        # Authenticate user
        user = await crud.user.get_by_username(db, username=username)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("User account is inactive")

        # Create tokens
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        refresh_token = self._generate_secure_token()
        expires_at = datetime.utcnow() + timedelta(days=7)

        # Save refresh token
        auth_token = AuthToken(
            token=refresh_token,
            token_type="refresh",
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(auth_token)
        await db.commit()

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "is_email_verified": user.is_email_verified
            }
        )

    async def refresh_access_token(
        self,
        request: TokenRefresh,
        db: AsyncSession
    ) -> RefreshResponse:
        """Refresh access token using refresh token."""
        # Find valid refresh token
        stmt = select(AuthToken).where(
            AuthToken.token == request.refresh_token,
            AuthToken.token_type == "refresh",
            AuthToken.is_active == True,
            AuthToken.expires_at > datetime.utcnow()
        )
        result = await db.execute(stmt)
        auth_token = result.scalar_one_or_none()

        if not auth_token:
            raise ValueError("Invalid or expired refresh token")

        # Get user
        user = await crud.user.get(db, id=auth_token.user_id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        # Create new access token
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return RefreshResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def revoke_refresh_token(
        self,
        refresh_token: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Revoke a refresh token (for logout)."""
        stmt = select(AuthToken).where(
            AuthToken.token == refresh_token,
            AuthToken.token_type == "refresh",
            AuthToken.is_active == True
        )
        result = await db.execute(stmt)
        auth_token = result.scalar_one_or_none()

        if auth_token:
            auth_token.is_active = False
            auth_token.used_at = datetime.utcnow()
            await db.commit()

        return {"message": "Token revoked successfully"}

    async def cleanup_expired_tokens(self, db: AsyncSession) -> int:
        """Clean up expired tokens."""
        stmt = select(AuthToken).where(
            AuthToken.expires_at <= datetime.utcnow()
        )
        result = await db.execute(stmt)
        expired_tokens = result.scalars().all()

        count = 0
        for token in expired_tokens:
            await db.delete(token)
            count += 1

        if count > 0:
            await db.commit()

        return count

    def _generate_secure_token(self) -> str:
        """Generate a secure random token."""
        random_bytes = secrets.token_bytes(32)
        return hashlib.sha256(random_bytes).hexdigest()


auth_service = AuthService()