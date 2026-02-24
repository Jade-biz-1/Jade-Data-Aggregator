from pydantic import BaseModel
from typing import List, Optional


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class EmailVerificationRequest(BaseModel):
    email: str


class EmailVerificationConfirm(BaseModel):
    token: str


class TokenRefresh(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# --- FEAT-001: 2FA schemas ---

class TwoFactorSetupResponse(BaseModel):
    """Returned by POST /auth/2fa/setup — contains provisioning data."""
    secret: str
    otp_uri: str
    message: str


class TwoFactorEnableRequest(BaseModel):
    """Confirm enabling 2FA by supplying the first TOTP code."""
    code: str


class TwoFactorEnableResponse(BaseModel):
    """Returned after 2FA is successfully enabled; includes recovery codes."""
    message: str
    recovery_codes: List[str]


class TwoFactorDisableRequest(BaseModel):
    """Disable 2FA by verifying the current TOTP code."""
    code: str


class TwoFactorVerifyRequest(BaseModel):
    """Exchange a partial token + TOTP code for a full access token."""
    partial_token: str
    code: str


class TwoFactorRecoveryRequest(BaseModel):
    """Exchange a recovery code for a full access token."""
    partial_token: str
    recovery_code: str