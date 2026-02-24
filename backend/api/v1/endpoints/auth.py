from datetime import datetime, timedelta

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
    TwoFactorDisableRequest,
    TwoFactorEnableRequest,
    TwoFactorEnableResponse,
    TwoFactorRecoveryRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)
from backend.schemas.token import Token, TokenData
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
    OAuth2 compatible token login, get an access token for future requests.
    Enforces account lockout (FEAT-002) and 2FA (FEAT-001) when enabled.
    """
    # Fetch user from the database
    user = await crud.user.get_by_username(db, username=username)

    # --- FEAT-002: Account lockout check ---
    if user and user.lockout_until and user.lockout_until > datetime.utcnow():
        remaining = int((user.lockout_until - datetime.utcnow()).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked due to too many failed login attempts. "
                   f"Try again in {remaining} minute(s).",
        )

    # Verify credentials
    if not user or not security.verify_password(password, user.hashed_password):
        await log_failed_login(db, username, request)
        # Increment failed_login_attempts when user exists
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.lockout_until = datetime.utcnow() + timedelta(
                    minutes=settings.LOCKOUT_DURATION
                )
            await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        await log_failed_login(db, username, request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful credential check — reset lockout counters
    if user.failed_login_attempts or user.lockout_until:
        user.failed_login_attempts = 0
        user.lockout_until = None
        await db.commit()

    # --- FEAT-001: 2FA enforcement ---
    if user.is_2fa_enabled:
        # Issue a short-lived partial token that signals 2FA is required.
        # The client must exchange this for a full token via POST /auth/2fa/verify.
        partial_token = security.create_access_token(
            subject=user.username,
            expires_delta=timedelta(minutes=5),
            role=user.role,
            data={"sub": user.username, "role": user.role, "requires_2fa": True},
        )
        return {"access_token": partial_token, "token_type": "bearer", "requires_2fa": True}

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


# =============================================================================
# FEAT-001: Two-Factor Authentication Endpoints
# =============================================================================

def _generate_recovery_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """Generate plaintext recovery codes and their bcrypt hashes.

    Returns (plaintext_codes, hashed_codes).
    """
    import secrets as _secrets
    plaintext = [
        f"{_secrets.token_hex(4).upper()}-{_secrets.token_hex(4).upper()}"
        for _ in range(count)
    ]
    hashed = [security.get_password_hash(code) for code in plaintext]
    return plaintext, hashed


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a new TOTP secret for the authenticated user and return the
    provisioning URI for QR-code display.  2FA is NOT yet enabled — the user
    must call POST /auth/2fa/enable with a valid code to activate it.
    """
    from sqlalchemy import select
    from backend.models.user import User as UserModel

    db_user = (await db.execute(select(UserModel).where(UserModel.id == current_user.id))).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    secret = security.generate_otp_secret()
    otp_uri = security.generate_otp_uri(
        email=db_user.email,
        secret=secret,
        issuer_name=settings.PROJECT_NAME,
    )
    db_user.otp_secret = secret
    db_user.otp_auth_url = otp_uri
    await db.commit()

    return TwoFactorSetupResponse(
        secret=secret,
        otp_uri=otp_uri,
        message="Scan the QR code with your authenticator app, then call POST /auth/2fa/enable with the generated code.",
    )


@router.post("/2fa/enable", response_model=TwoFactorEnableResponse)
async def enable_2fa(
    body: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Enable 2FA after verifying the first TOTP code.  Returns one-time recovery
    codes that the user must store safely.
    """
    from sqlalchemy import select
    from backend.models.user import User as UserModel

    db_user = (await db.execute(select(UserModel).where(UserModel.id == current_user.id))).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.otp_secret:
        raise HTTPException(status_code=400, detail="Run POST /auth/2fa/setup first")
    if db_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    if not security.verify_otp(db_user.otp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    plaintext_codes, hashed_codes = _generate_recovery_codes()
    db_user.is_2fa_enabled = True
    db_user.recovery_codes = hashed_codes
    await db.commit()

    return TwoFactorEnableResponse(
        message="2FA has been enabled successfully. Store your recovery codes securely — they will not be shown again.",
        recovery_codes=plaintext_codes,
    )


@router.post("/2fa/disable")
async def disable_2fa(
    body: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Disable 2FA for the authenticated user after verifying the current TOTP code.
    """
    from sqlalchemy import select
    from backend.models.user import User as UserModel

    db_user = (await db.execute(select(UserModel).where(UserModel.id == current_user.id))).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    if not security.verify_otp(db_user.otp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    db_user.is_2fa_enabled = False
    db_user.otp_secret = None
    db_user.otp_auth_url = None
    db_user.recovery_codes = None
    await db.commit()

    return {"message": "2FA has been disabled"}


@router.post("/2fa/verify")
async def verify_2fa(
    body: TwoFactorVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Exchange a partial token (issued by POST /login when 2FA is enabled) plus
    a valid TOTP code for a full access token.
    """
    from jose import JWTError, jwt
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    try:
        payload = jwt.decode(body.partial_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired partial token")

    if not payload.get("requires_2fa"):
        raise HTTPException(status_code=400, detail="Token does not require 2FA verification")

    username = payload.get("sub")
    db_user = (await db.execute(select(UserModel).where(UserModel.username == username))).scalar_one_or_none()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    if not security.verify_otp(db_user.otp_secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    access_token = security.create_access_token(
        subject=db_user.username,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role=db_user.role,
        is_2fa_authenticated=True,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/2fa/recovery")
async def verify_2fa_recovery(
    body: TwoFactorRecoveryRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Exchange a partial token plus a recovery code for a full access token.
    The recovery code is consumed (single-use) upon success.
    """
    from jose import JWTError, jwt
    from backend.models.user import User as UserModel
    from sqlalchemy import select

    try:
        payload = jwt.decode(body.partial_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired partial token")

    if not payload.get("requires_2fa"):
        raise HTTPException(status_code=400, detail="Token does not require 2FA verification")

    username = payload.get("sub")
    db_user = (await db.execute(select(UserModel).where(UserModel.username == username))).scalar_one_or_none()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    stored_hashes: list = db_user.recovery_codes or []
    matched_index = None
    for i, hashed in enumerate(stored_hashes):
        if security.verify_password(body.recovery_code, hashed):
            matched_index = i
            break

    if matched_index is None:
        raise HTTPException(status_code=400, detail="Invalid recovery code")

    # Consume the used recovery code
    remaining = [h for idx, h in enumerate(stored_hashes) if idx != matched_index]
    db_user.recovery_codes = remaining
    await db.commit()

    access_token = security.create_access_token(
        subject=db_user.username,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        role=db_user.role,
        is_2fa_authenticated=True,
    )
    return {"access_token": access_token, "token_type": "bearer"}


# =============================================================================
# FEAT-003: CSRF Token Endpoint
# =============================================================================

@router.get("/csrf-token")
async def get_csrf_token(response: "Response"):
    """
    Return a CSRF token and set it as a readable (non-HttpOnly) cookie so that
    frontend JavaScript can read it and attach it as the X-CSRF-Token header on
    state-changing requests (POST / PUT / PATCH / DELETE).
    """
    import secrets as _secrets
    from fastapi.responses import JSONResponse

    token = _secrets.token_urlsafe(32)
    resp = JSONResponse(content={"csrf_token": token})
    resp.set_cookie(
        key="csrf_token",
        value=token,
        httponly=False,      # JS-readable so the frontend can read and echo it
        samesite="strict",
        secure=settings.ENVIRONMENT == "production",
        max_age=3600,
    )
    return resp
