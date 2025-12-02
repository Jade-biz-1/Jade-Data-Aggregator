from datetime import timedelta

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    HTTPException,
    Request,
    status,
)
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend import crud
from backend.core import security
from backend.core.config import settings
from backend.core.database import get_db
from backend.core.security import get_current_active_user
from backend.schemas.auth import (
    EmailVerificationConfirm,
    EmailVerificationRequest,
    LoginResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshResponse,
    TokenRefresh,
)
from backend.schemas.auth import Token, TokenData
from backend.schemas.user import User, UserCreate
from backend.services.activity_log_service import (
    log_failed_login,
    log_login,
    log_logout,
    log_password_change,
)
from backend.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    auth_service = AuthService(db)

    # Fetch user from the database
    user = await crud.user.get_by_username(db, username=username)
    if not user or not security.verify_password(password, user.hashed_password):
        # Log failed login attempt
        await log_failed_login(db, username, request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        # Log failed login attempt for inactive user
        await log_failed_login(db, username, request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.username, expires_delta=access_token_expires, role=user.role
    )

    # Log successful login
    await log_login(db, user.id, request)

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=User)
async def register(
    user: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Create new user
    """
    # Check if user already exists
    existing_user = await crud.user.get_by_username(db, username=user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    # Check if email already exists
    existing_email = await crud.user.get_by_email(db, email=user.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash the password and create user directly
    from sqlalchemy.exc import IntegrityError

    from backend.models.user import User as UserModel
    
    try:
        db_user = UserModel(
            username=user.username,
            email=user.email,
            hashed_password=security.get_password_hash(user.password),
            is_active=user.is_active,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )


# Enhanced Authentication Features

@router.post("/password-reset/request")
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset email."""
    auth_service = AuthService(db)
    try:
        # Re-instantiate service for background tasks if needed
        result = await auth_service.request_password_reset(request, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Confirm password reset with token."""
    try:
        auth_service = AuthService(db)
        result = await auth_service.confirm_password_reset(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email-verification/request")
async def request_email_verification(
    request: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request email verification."""
    auth_service = AuthService(db)
    try:
        result = await auth_service.request_email_verification(request, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/email-verification/confirm")
async def confirm_email_verification(
    request: EmailVerificationConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Confirm email verification."""
    try:
        auth_service = AuthService(db)
        result = await auth_service.confirm_email_verification(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login-enhanced", response_model=LoginResponse)
async def login_with_refresh(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Login with username/password and get access + refresh tokens."""
    try:
        auth_service = AuthService(db)
        result = await auth_service.login_with_refresh_token(username, password, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    try:
        auth_service = AuthService(db)
        result = await auth_service.refresh_access_token(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(
    refresh_token: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Logout and revoke refresh token."""
    try:
        auth_service = AuthService(db)
        result = await auth_service.revoke_refresh_token(refresh_token, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cleanup-tokens")
async def cleanup_expired_tokens(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to cleanup expired tokens."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    auth_service = AuthService(db)

    try:
        count = await auth_service.cleanup_expired_tokens(db)
        return {"message": f"Cleaned up {count} expired tokens"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/change-password")
async def change_password(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for the currently authenticated user
    Requires current password verification
    """
    # Fetch full user from database (with hashed_password)
    from sqlalchemy import select

    from backend.models.user import User as UserModel

    result = await db.execute(
        select(UserModel).where(UserModel.id == current_user.id)
    )
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify current password
    if not security.verify_password(current_password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    # Validate new password strength
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )

    # Check if new password contains both letters and numbers
    has_letter = any(c.isalpha() for c in new_password)
    has_number = any(c.isdigit() for c in new_password)

    if not (has_letter and has_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must contain both letters and numbers"
        )

    # Update password
    db_user.hashed_password = security.get_password_hash(new_password)
    await db.commit()

    # Log password change event
    await log_password_change(db, current_user.id, request)

    return {"message": "Password changed successfully"}
