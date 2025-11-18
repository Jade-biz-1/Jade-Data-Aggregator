"""
Unit Tests for User Management Business Logic
Data Aggregator Platform - Testing Framework - Week 95 TEST-009

Tests cover:
- User CRUD operations
- Password hashing and validation
- Role-based access control (RBAC)
- Email verification logic
- Username/email uniqueness
- User activation/deactivation
- Superuser privileges

Total: 25 tests for user management business logic
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.crud.user import CRUDUser, user
from backend.models.user import User
from backend.schemas.user import UserCreate, UserUpdate
from backend.core.security import get_password_hash, verify_password


class TestUserCRUDOperations:
    """Test user CRUD operations"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def sample_user(self):
        """Create a sample user"""
        return User(
            id=1,
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False,
            role="viewer",
            is_email_verified=False
        )

    # CRUD Tests

    @pytest.mark.asyncio
    async def test_create_user(self, mock_db_session):
        """Test creating a new user"""
        crud = CRUDUser()

        user_create = UserCreate(
            username="newuser",
            email="new@example.com",
            hashed_password=get_password_hash("securepass123")
        )

        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.create(db=mock_db_session, obj_in=user_create)

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert result.username == "newuser"
        assert result.email == "new@example.com"

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, mock_db_session, sample_user):
        """Test retrieving user by ID"""
        crud = CRUDUser()

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get(db=mock_db_session, id=1)

        assert result is not None
        assert result.id == 1
        assert result.username == "testuser"

    @pytest.mark.asyncio
    async def test_get_user_by_username(self, mock_db_session, sample_user):
        """Test retrieving user by username"""
        crud = CRUDUser()

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get_by_username(db=mock_db_session, username="testuser")

        assert result is not None
        assert result.username == "testuser"

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, mock_db_session, sample_user):
        """Test retrieving user by email"""
        crud = CRUDUser()

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get_by_email(db=mock_db_session, email="test@example.com")

        assert result is not None
        assert result.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_multiple_users(self, mock_db_session):
        """Test retrieving multiple users with pagination"""
        crud = CRUDUser()

        users = [
            User(id=1, username="user1", email="user1@example.com", hashed_password="hash1"),
            User(id=2, username="user2", email="user2@example.com", hashed_password="hash2"),
            User(id=3, username="user3", email="user3@example.com", hashed_password="hash3")
        ]

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = users
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get_multi(db=mock_db_session, skip=0, limit=10)

        assert len(result) == 3
        assert result[0].username == "user1"

    @pytest.mark.asyncio
    async def test_update_user(self, mock_db_session, sample_user):
        """Test updating user information"""
        crud = CRUDUser()

        user_update = UserUpdate(
            first_name="Updated",
            last_name="Name",
            is_email_verified=True
        )

        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.update(
            db=mock_db_session,
            db_obj=sample_user,
            obj_in=user_update
        )

        assert sample_user.first_name == "Updated"
        assert sample_user.last_name == "Name"
        assert sample_user.is_email_verified == True
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_user(self, mock_db_session, sample_user):
        """Test deleting user"""
        crud = CRUDUser()

        # Mock get to return the user
        crud.get = AsyncMock(return_value=sample_user)
        mock_db_session.delete = AsyncMock()
        mock_db_session.commit = AsyncMock()

        result = await crud.remove(db=mock_db_session, id=1)

        assert result == sample_user
        mock_db_session.delete.assert_called_once_with(sample_user)
        mock_db_session.commit.assert_called_once()


class TestPasswordManagement:
    """Test password hashing and validation"""

    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        password = "mysecurepassword123"
        hashed = get_password_hash(password)

        # Hash should not be the plaintext password
        assert hashed != password
        # Hash should be consistent
        assert len(hashed) > 0

    def test_password_verification_success(self):
        """Test successful password verification"""
        password = "correctpassword"
        hashed = get_password_hash(password)

        # Correct password should verify
        assert verify_password(password, hashed) == True

    def test_password_verification_failure(self):
        """Test failed password verification"""
        password = "correctpassword"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        # Wrong password should not verify
        assert verify_password(wrong_password, hashed) == False

    def test_password_hash_uniqueness(self):
        """Test that same password generates different hashes (salt)"""
        password = "samepassword"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify the password
        assert verify_password(password, hash1) == True
        assert verify_password(password, hash2) == True


class TestRoleBasedAccessControl:
    """Test RBAC functionality"""

    def test_user_default_role_is_viewer(self):
        """Test that default role is viewer"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash"
        )

        # Default role should be viewer
        assert user.role == "viewer"

    def test_user_role_assignment(self):
        """Test assigning different roles to users"""
        roles = ["admin", "developer", "designer", "executor", "executive", "viewer"]

        for role in roles:
            user = User(
                username=f"user_{role}",
                email=f"{role}@example.com",
                hashed_password="hash",
                role=role
            )
            assert user.role == role

    def test_admin_role(self):
        """Test admin role assignment"""
        user = User(
            username="admin",
            email="admin@example.com",
            hashed_password="hash",
            role="admin"
        )

        assert user.role == "admin"
        # Admin could also be superuser
        user.is_superuser = True
        assert user.is_superuser == True

    def test_viewer_role_read_only(self):
        """Test viewer role (read-only)"""
        user = User(
            username="viewer",
            email="viewer@example.com",
            hashed_password="hash",
            role="viewer"
        )

        assert user.role == "viewer"
        assert user.is_superuser == False


class TestEmailVerification:
    """Test email verification logic"""

    def test_user_email_not_verified_by_default(self):
        """Test that email is not verified by default"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash"
        )

        assert user.is_email_verified == False

    def test_verify_user_email(self):
        """Test verifying user email"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash",
            is_email_verified=False
        )

        # Verify email
        user.is_email_verified = True
        assert user.is_email_verified == True

    def test_email_verification_state_persistence(self):
        """Test that email verification state is tracked"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash",
            is_email_verified=True
        )

        # Should maintain verified state
        assert user.is_email_verified == True


class TestUserActivation:
    """Test user activation/deactivation"""

    def test_user_active_by_default(self):
        """Test that users are active by default"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash"
        )

        assert user.is_active == True

    def test_deactivate_user(self):
        """Test deactivating a user"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash",
            is_active=True
        )

        # Deactivate user
        user.is_active = False
        assert user.is_active == False

    def test_reactivate_user(self):
        """Test reactivating a deactivated user"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash",
            is_active=False
        )

        # Reactivate user
        user.is_active = True
        assert user.is_active == True


class TestSuperuserPrivileges:
    """Test superuser privileges"""

    def test_user_not_superuser_by_default(self):
        """Test that users are not superusers by default"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash"
        )

        assert user.is_superuser == False

    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User(
            username="admin",
            email="admin@example.com",
            hashed_password="hash",
            is_superuser=True,
            role="admin"
        )

        assert user.is_superuser == True
        assert user.role == "admin"

    def test_superuser_can_be_any_role(self):
        """Test that superuser can have any role"""
        user = User(
            username="superadmin",
            email="superadmin@example.com",
            hashed_password="hash",
            is_superuser=True,
            role="developer"  # Superuser but developer role
        )

        assert user.is_superuser == True
        assert user.role == "developer"


class TestUserBusinessRules:
    """Test user business rules and constraints"""

    def test_username_required(self):
        """Test that username is required"""
        # Username is required at database level
        # Pydantic validation would catch this
        with pytest.raises(Exception):
            User(
                username=None,
                email="test@example.com",
                hashed_password="hash"
            )

    def test_email_required(self):
        """Test that email is required"""
        with pytest.raises(Exception):
            User(
                username="test",
                email=None,
                hashed_password="hash"
            )

    def test_password_required(self):
        """Test that password is required"""
        with pytest.raises(Exception):
            User(
                username="test",
                email="test@example.com",
                hashed_password=None
            )

    def test_user_has_relationships(self):
        """Test that user model has proper relationships"""
        user = User(
            username="test",
            email="test@example.com",
            hashed_password="hash"
        )

        # User should have relationship attributes defined
        assert hasattr(user, 'pipelines')
        assert hasattr(user, 'connectors')
        assert hasattr(user, 'transformations')
        assert hasattr(user, 'auth_tokens')
        assert hasattr(user, 'file_uploads')


# Run with: pytest testing/backend-tests/unit/business-logic/test_user_management_business_logic.py -v
# Run with coverage: pytest testing/backend-tests/unit/business-logic/test_user_management_business_logic.py -v --cov=backend.crud.user --cov=backend.core.security --cov-report=term-missing
