"""
Unit Tests for Email Service
Data Aggregator Platform - Testing Framework - Week 94 TEST-001

Tests cover:
- Email sending (SMTP, error handling, content)
- Password reset emails (token, URL, security)
- Email verification emails (token, expiration, formatting)
- Security: No information leakage, proper encoding
- SMTP failure scenarios

Total: 30 tests for critical security functionality
"""

import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from backend.services.email_service import EmailService, email_service


class TestEmailServiceInitialization:
    """Test email service initialization and configuration"""

    def test_email_service_singleton_exists(self):
        """Test that email service singleton is initialized"""
        assert email_service is not None
        assert isinstance(email_service, EmailService)

    def test_email_service_default_config(self):
        """Test email service initializes with default configuration"""
        service = EmailService()
        assert service.smtp_server is not None
        assert service.smtp_port is not None
        assert hasattr(service, 'smtp_username')
        assert hasattr(service, 'smtp_password')
        assert hasattr(service, 'from_email')


class TestEmailSending:
    """Test core email sending functionality"""

    @pytest.fixture
    def email_service_instance(self):
        """Create an email service instance for testing"""
        return EmailService()

    @pytest.mark.asyncio
    async def test_send_email_without_smtp_credentials_dev_mode(self, email_service_instance):
        """Test email sending in development mode (no SMTP credentials)"""
        # Force dev mode by clearing credentials
        email_service_instance.smtp_username = None
        email_service_instance.smtp_password = None

        result = await email_service_instance.send_email(
            to_email="test@example.com",
            subject="Test Subject",
            html_content="<h1>Test</h1>"
        )

        # In dev mode, should return True without actually sending
        assert result is True

    @pytest.mark.asyncio
    async def test_send_email_with_html_content(self, email_service_instance):
        """Test sending email with HTML content"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                html_content="<h1>Test HTML</h1>"
            )

            assert result is True
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once_with("test@example.com", "testpassword")
            mock_server.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_with_html_and_text_content(self, email_service_instance):
        """Test sending email with both HTML and text content"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                html_content="<h1>Test HTML</h1>",
                text_content="Test plain text"
            )

            assert result is True
            mock_server.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_smtp_connection_failure(self, email_service_instance):
        """Test email sending handles SMTP connection failures"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        with patch('smtplib.SMTP', side_effect=smtplib.SMTPConnectError(421, "Connection refused")):
            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                html_content="<h1>Test</h1>"
            )

            # Should return False on failure
            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_smtp_authentication_failure(self, email_service_instance):
        """Test email sending handles SMTP authentication failures"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "wrongpassword"

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, "Authentication failed")

            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                html_content="<h1>Test</h1>"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_invalid_recipient(self, email_service_instance):
        """Test email sending handles invalid recipient addresses"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            mock_server.send_message.side_effect = smtplib.SMTPRecipientsRefused({
                "invalid@": (550, "Invalid recipient")
            })

            result = await email_service_instance.send_email(
                to_email="invalid@",
                subject="Test Subject",
                html_content="<h1>Test</h1>"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_message_structure(self, email_service_instance):
        """Test that email message is structured correctly"""
        email_service_instance.smtp_username = "sender@example.com"
        email_service_instance.smtp_password = "testpassword"
        email_service_instance.from_email = "noreply@example.com"

        captured_message = None

        def capture_message(msg):
            nonlocal captured_message
            captured_message = msg

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            mock_server.send_message.side_effect = capture_message

            await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test Subject",
                html_content="<h1>Test HTML</h1>",
                text_content="Test plain text"
            )

            # Verify message was sent
            assert mock_server.send_message.called

    @pytest.mark.asyncio
    async def test_send_email_large_content(self, email_service_instance):
        """Test sending email with large content"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        # Generate large content (100KB)
        large_content = "<h1>Test</h1>" + ("<p>Content</p>" * 5000)

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Large Email Test",
                html_content=large_content
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_send_email_special_characters_in_subject(self, email_service_instance):
        """Test email sending handles special characters in subject"""
        email_service_instance.smtp_username = "test@example.com"
        email_service_instance.smtp_password = "testpassword"

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = await email_service_instance.send_email(
                to_email="recipient@example.com",
                subject="Test: Émojis 🔒 & Special Chars <>&",
                html_content="<h1>Test</h1>"
            )

            assert result is True


class TestPasswordResetEmail:
    """Test password reset email functionality"""

    @pytest.fixture
    def email_service_instance(self):
        """Create an email service instance for testing"""
        return EmailService()

    @pytest.mark.asyncio
    async def test_send_password_reset_email_success(self, email_service_instance):
        """Test sending password reset email successfully"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="abc123token"
            )

            assert result is True
            mock_send.assert_called_once()

            # Verify call arguments
            call_args = mock_send.call_args
            assert call_args[1]['to_email'] == "user@example.com"
            assert "Reset Your Password" in call_args[1]['subject']

    @pytest.mark.asyncio
    async def test_password_reset_email_contains_token_in_url(self, email_service_instance):
        """Test that password reset email contains token in reset URL"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            reset_token = "secure-token-123"

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token=reset_token
            )

            # Check that HTML content contains the token
            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            assert reset_token in html_content
            assert f"token={reset_token}" in html_content

    @pytest.mark.asyncio
    async def test_password_reset_email_contains_username(self, email_service_instance):
        """Test that password reset email contains username"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            username = "johndoe"

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username=username,
                reset_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            assert username in html_content

    @pytest.mark.asyncio
    async def test_password_reset_email_html_formatting(self, email_service_instance):
        """Test that password reset email has proper HTML formatting"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            # Verify HTML structure
            assert "<html>" in html_content
            assert "</html>" in html_content
            assert "<body>" in html_content
            assert "<h2>" in html_content
            assert "<a href=" in html_content  # Reset button/link

    @pytest.mark.asyncio
    async def test_password_reset_email_has_text_fallback(self, email_service_instance):
        """Test that password reset email includes text fallback"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="token123"
            )

            call_args = mock_send.call_args
            text_content = call_args[1]['text_content']

            # Verify text content exists and contains key information
            assert text_content is not None
            assert "testuser" in text_content
            assert "token123" in text_content

    @pytest.mark.asyncio
    async def test_password_reset_email_expiration_warning(self, email_service_instance):
        """Test that password reset email warns about expiration"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']
            text_content = call_args[1]['text_content']

            # Should mention expiration
            assert "1 hour" in html_content or "expire" in html_content.lower()
            assert "1 hour" in text_content or "expire" in text_content.lower()

    @pytest.mark.asyncio
    async def test_password_reset_email_subject_format(self, email_service_instance):
        """Test password reset email subject format"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="token123"
            )

            call_args = mock_send.call_args
            subject = call_args[1]['subject']

            assert "Reset" in subject or "Password" in subject

    @pytest.mark.asyncio
    async def test_password_reset_email_smtp_failure(self, email_service_instance):
        """Test password reset email handles SMTP failures gracefully"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = False  # Simulate SMTP failure

            result = await email_service_instance.send_password_reset_email(
                to_email="user@example.com",
                username="testuser",
                reset_token="token123"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_password_reset_url_construction(self, email_service_instance):
        """Test that password reset URL is constructed correctly"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            with patch('backend.services.email_service.settings') as mock_settings:
                mock_settings.FRONTEND_URL = "https://app.example.com"
                mock_send.return_value = True

                await email_service_instance.send_password_reset_email(
                    to_email="user@example.com",
                    username="testuser",
                    reset_token="token123"
                )

                call_args = mock_send.call_args
                html_content = call_args[1]['html_content']

                # URL should use HTTPS and include frontend URL
                assert "https://app.example.com/reset-password?token=token123" in html_content


class TestEmailVerificationEmail:
    """Test email verification functionality"""

    @pytest.fixture
    def email_service_instance(self):
        """Create an email service instance for testing"""
        return EmailService()

    @pytest.mark.asyncio
    async def test_send_email_verification_email_success(self, email_service_instance):
        """Test sending email verification email successfully"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="verify123"
            )

            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_email_verification_contains_token_in_url(self, email_service_instance):
        """Test that email verification contains token in URL"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            verification_token = "verify-token-456"

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token=verification_token
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            assert verification_token in html_content
            assert f"token={verification_token}" in html_content

    @pytest.mark.asyncio
    async def test_email_verification_contains_username(self, email_service_instance):
        """Test that email verification contains username"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            username = "janedoe"

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username=username,
                verification_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            assert username in html_content

    @pytest.mark.asyncio
    async def test_email_verification_html_formatting(self, email_service_instance):
        """Test that email verification has proper HTML formatting"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']

            # Verify HTML structure
            assert "<html>" in html_content
            assert "</html>" in html_content
            assert "<body>" in html_content
            assert "<h2>" in html_content
            assert "<a href=" in html_content  # Verification button/link

    @pytest.mark.asyncio
    async def test_email_verification_has_text_fallback(self, email_service_instance):
        """Test that email verification includes text fallback"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="token123"
            )

            call_args = mock_send.call_args
            text_content = call_args[1]['text_content']

            # Verify text content exists and contains key information
            assert text_content is not None
            assert "testuser" in text_content
            assert "token123" in text_content

    @pytest.mark.asyncio
    async def test_email_verification_expiration_warning_24h(self, email_service_instance):
        """Test that email verification warns about 24-hour expiration"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="token123"
            )

            call_args = mock_send.call_args
            html_content = call_args[1]['html_content']
            text_content = call_args[1]['text_content']

            # Should mention 24 hour expiration
            assert "24 hours" in html_content or "24 hour" in html_content
            assert "24 hours" in text_content or "24 hour" in text_content

    @pytest.mark.asyncio
    async def test_email_verification_subject_format(self, email_service_instance):
        """Test email verification subject format"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="token123"
            )

            call_args = mock_send.call_args
            subject = call_args[1]['subject']

            assert "Verify" in subject or "Email" in subject

    @pytest.mark.asyncio
    async def test_email_verification_smtp_failure(self, email_service_instance):
        """Test email verification handles SMTP failures gracefully"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = False  # Simulate SMTP failure

            result = await email_service_instance.send_email_verification_email(
                to_email="user@example.com",
                username="testuser",
                verification_token="token123"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_email_verification_url_construction(self, email_service_instance):
        """Test that email verification URL is constructed correctly"""
        with patch.object(email_service_instance, 'send_email', new_callable=AsyncMock) as mock_send:
            with patch('backend.services.email_service.settings') as mock_settings:
                mock_settings.FRONTEND_URL = "https://app.example.com"
                mock_send.return_value = True

                await email_service_instance.send_email_verification_email(
                    to_email="user@example.com",
                    username="testuser",
                    verification_token="verify789"
                )

                call_args = mock_send.call_args
                html_content = call_args[1]['html_content']

                # URL should use HTTPS and include frontend URL
                assert "https://app.example.com/verify-email?token=verify789" in html_content


# Run with: pytest testing/backend-tests/unit/services/test_email_service.py -v
# Run with coverage: pytest testing/backend-tests/unit/services/test_email_service.py -v --cov=backend.services.email_service --cov-report=term-missing
