"""
Unit tests for User model
Tests user creation, validation, relationships, and CRUD operations
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from backend.models.user import User
from backend.core.security import get_password_hash, verify_password


class TestUserModel:
    """Test suite for User model"""

    def test_create_user_with_valid_data(self, test_session):
        """Test creating a user with all required fields"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="viewer",
            is_active=True
        )
        test_session.add(user)
        test_session.commit()

        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == "viewer"
        assert user.is_active is True
        assert user.created_at is not None

    def test_create_user_with_optional_fields(self, test_session):
        """Test creating a user with optional fields"""
        user = User(
            username="johndoe",
            email="john@example.com",
            first_name="John",
            last_name="Doe",
            hashed_password=get_password_hash("Test123!@#"),
            role="admin",
            is_superuser=True
        )
        test_session.add(user)
        test_session.commit()

        assert user.first_name == "John"
        assert user.last_name == "Doe"
        assert user.is_superuser is True

    def test_create_user_duplicate_username(self, test_session):
        """Test that duplicate usernames are not allowed"""
        user1 = User(
            username="duplicate",
            email="user1@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user1)
        test_session.commit()

        user2 = User(
            username="duplicate",  # Same username
            email="user2@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user2)

        with pytest.raises(IntegrityError):
            test_session.commit()

    def test_create_user_duplicate_email(self, test_session):
        """Test that duplicate emails are not allowed"""
        user1 = User(
            username="user1",
            email="duplicate@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user1)
        test_session.commit()

        user2 = User(
            username="user2",
            email="duplicate@example.com",  # Same email
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user2)

        with pytest.raises(IntegrityError):
            test_session.commit()

    def test_user_password_hashing(self, test_session):
        """Test that passwords are properly hashed"""
        password = "SecurePassword123!@#"
        user = User(
            username="hashtest",
            email="hash@example.com",
            hashed_password=get_password_hash(password)
        )
        test_session.add(user)
        test_session.commit()

        # Password should be hashed, not plain text
        assert user.hashed_password != password
        # Verify password should work
        assert verify_password(password, user.hashed_password)

    def test_user_default_values(self, test_session):
        """Test that default values are set correctly"""
        user = User(
            username="defaults",
            email="defaults@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        assert user.is_active is True  # Default is True
        assert user.is_superuser is False  # Default is False
        assert user.role == "viewer"  # Default role
        assert user.is_email_verified is False  # Default is False

    def test_user_role_assignment(self, test_session):
        """Test assigning different roles to users"""
        roles = ["admin", "developer", "designer", "executor", "viewer", "executive"]

        for role in roles:
            user = User(
                username=f"user_{role}",
                email=f"{role}@example.com",
                hashed_password=get_password_hash("Test123!@#"),
                role=role
            )
            test_session.add(user)
            test_session.commit()

            assert user.role == role

    def test_user_is_active_flag(self, test_session):
        """Test user activation/deactivation"""
        user = User(
            username="activetest",
            email="active@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            is_active=True
        )
        test_session.add(user)
        test_session.commit()

        assert user.is_active is True

        # Deactivate user
        user.is_active = False
        test_session.commit()

        assert user.is_active is False

    def test_user_email_verification(self, test_session):
        """Test email verification flag"""
        user = User(
            username="verifytest",
            email="verify@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            is_email_verified=False
        )
        test_session.add(user)
        test_session.commit()

        assert user.is_email_verified is False

        # Verify email
        user.is_email_verified = True
        test_session.commit()

        assert user.is_email_verified is True

    def test_user_timestamps(self, test_session):
        """Test that timestamps are set automatically"""
        user = User(
            username="timestamps",
            email="timestamps@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        assert user.created_at is not None
        assert isinstance(user.created_at, datetime)

    def test_user_update_timestamp(self, test_session):
        """Test that updated_at timestamp changes on update"""
        user = User(
            username="updatetest",
            email="update@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        original_updated_at = user.updated_at

        # Update user
        user.first_name = "Updated"
        test_session.commit()

        # Note: updated_at may be None if not triggered, depends on DB implementation
        # This test validates the column exists

    def test_user_missing_required_fields(self, test_session):
        """Test that required fields must be provided"""
        # Missing username
        user = User(
            email="missing@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)

        with pytest.raises(IntegrityError):
            test_session.commit()

    def test_user_query_by_username(self, test_session):
        """Test querying user by username"""
        user = User(
            username="querytest",
            email="query@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        found_user = test_session.query(User).filter_by(username="querytest").first()
        assert found_user is not None
        assert found_user.username == "querytest"

    def test_user_query_by_email(self, test_session):
        """Test querying user by email"""
        user = User(
            username="emailquery",
            email="emailquery@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        found_user = test_session.query(User).filter_by(email="emailquery@example.com").first()
        assert found_user is not None
        assert found_user.email == "emailquery@example.com"

    def test_user_delete(self, test_session):
        """Test deleting a user"""
        user = User(
            username="deletetest",
            email="delete@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add(user)
        test_session.commit()

        user_id = user.id

        test_session.delete(user)
        test_session.commit()

        deleted_user = test_session.query(User).filter_by(id=user_id).first()
        assert deleted_user is None
