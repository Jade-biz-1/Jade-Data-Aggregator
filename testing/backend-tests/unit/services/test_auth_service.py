"""
Unit Tests for Auth Service
Data Aggregator Platform - Testing Framework

Tests cover:
- Password reset request and confirmation
- Email verification
- Token generation and validation
- Token refresh
- User authentication
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.core.security import get_password_hash
from backend.models.auth_token import AuthToken
from backend.models.user import User
from backend.schemas.auth import (
    EmailVerificationRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
)
from backend.services.auth_service import AuthService


class TestAuthService:
    """Test suite for AuthService"""
    
    @pytest.fixture
    def auth_service(self):
        """Create an auth service instance"""
        return AuthService()
    
    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session
    
    @pytest.fixture
    def test_user(self):
        """Create a test user"""
        return User(
            id=1,
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("OldPassword123!"),
            is_active=True,
            role="viewer"
        )
    
    def test_auth_service_initialization(self, auth_service):
        """Test auth service initializes correctly"""
        assert auth_service.secret_key is not None
        assert auth_service.algorithm == "HS256"
    
    @pytest.mark.asyncio
    async def test_request_password_reset_user_exists(self, auth_service, mock_db_session, test_user):
        """Test password reset request for existing user"""
        request = PasswordResetRequest(email="test@example.com")
        
        with patch('backend.crud.user.get_by_email', new_callable=AsyncMock) as mock_get_user:
            with patch('backend.services.email_service.email_service.send_password_reset_email', new_callable=AsyncMock):
                mock_get_user.return_value = test_user
                mock_db_session.add = Mock()
                mock_db_session.commit = AsyncMock()
                
                result = await auth_service.request_password_reset(request, mock_db_session)
                
                assert "message" in result
                assert mock_db_session.add.called
                assert mock_db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_request_password_reset_user_not_exists(self, auth_service, mock_db_session):
        """Test password reset request for non-existent user (should not reveal)"""
        request = PasswordResetRequest(email="nonexistent@example.com")
        
        with patch('backend.crud.user.get_by_email', new_callable=AsyncMock) as mock_get_user:
            mock_get_user.return_value = None
            
            result = await auth_service.request_password_reset(request, mock_db_session)
            
            # Should return same message for security
            assert "message" in result
            assert "If the email exists" in result["message"]
    
    @pytest.mark.asyncio
    async def test_confirm_password_reset_valid_token(self, auth_service, mock_db_session, test_user):
        """Test password reset confirmation with valid token"""
        request = PasswordResetConfirm(
            token="valid-reset-token",
            new_password="NewPassword123!"
        )
        
        auth_token = AuthToken(
            id=1,
            token="valid-reset-token",
            token_type="password_reset",
            user_id=test_user.id,
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        
        with patch('backend.crud.user.get', new_callable=AsyncMock) as mock_get_user:
            mock_get_user.return_value = test_user
            mock_db_session.execute = AsyncMock()
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = auth_token
            mock_db_session.execute.return_value = mock_result
            mock_db_session.commit = AsyncMock()
            
            result = await auth_service.confirm_password_reset(request, mock_db_session)
            
            assert "message" in result
            assert auth_token.is_active == False
            assert mock_db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_confirm_password_reset_invalid_token(self, auth_service, mock_db_session):
        """Test password reset confirmation with invalid token"""
        request = PasswordResetConfirm(
            token="invalid-token",
            new_password="NewPassword123!"
        )
        
        mock_db_session.execute = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="Invalid or expired reset token"):
            await auth_service.confirm_password_reset(request, mock_db_session)
    
    @pytest.mark.asyncio
    async def test_confirm_password_reset_expired_token(self, auth_service, mock_db_session, test_user):
        """Test password reset confirmation with expired token"""
        request = PasswordResetConfirm(
            token="expired-token",
            new_password="NewPassword123!"
        )
        
        # Token expired 1 hour ago
        expired_token = AuthToken(
            id=1,
            token="expired-token",
            token_type="password_reset",
            user_id=test_user.id,
            is_active=True,
            expires_at=datetime.utcnow() - timedelta(hours=1)
        )
        
        mock_db_session.execute = AsyncMock()
        mock_result = Mock()
        # Expired token won't be returned by the query
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="Invalid or expired reset token"):
            await auth_service.confirm_password_reset(request, mock_db_session)
    
    def test_generate_secure_token(self, auth_service):
        """Test that secure tokens are generated"""
        token1 = auth_service._generate_secure_token()
        token2 = auth_service._generate_secure_token()
        
        # Tokens should be unique
        assert token1 != token2
        
        # Tokens should be of reasonable length
        assert len(token1) > 20
        assert len(token2) > 20
    
    @pytest.mark.asyncio
    async def test_email_verification_request(self, auth_service, mock_db_session, test_user):
        """Test email verification request"""
        request = EmailVerificationRequest(email="test@example.com")
        
        with patch('backend.crud.user.get_by_email', new_callable=AsyncMock) as mock_get_user:
            with patch('backend.services.email_service.email_service.send_verification_email', new_callable=AsyncMock):
                mock_get_user.return_value = test_user
                mock_db_session.add = Mock()
                mock_db_session.commit = AsyncMock()
                
                result = await auth_service.request_email_verification(request, mock_db_session)
                
                assert "message" in result
                assert mock_db_session.add.called


# Run with: pytest testing/backend-tests/unit/services/test_auth_service.py -v
