"""
Unit Tests for User Model
Data Aggregator Platform - Testing Framework

Tests cover:
- User creation with valid data
- User creation with invalid data
- Password hashing
- User relationships
- Role validation
- Active status behavior
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.user import User
from backend.core.database import Base
from backend.core.security import get_password_hash, verify_password


# Test database setup (in-memory SQLite for unit tests)
@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory database for each test"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


class TestUserModelCreation:
    """Test user model creation and basic operations"""
    
    def test_create_user_with_valid_data(self, db_session):
        """Test creating a user with all required fields"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("TestPass123!"),
            first_name="Test",
            last_name="User",
            role="viewer"
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.role == "viewer"
        assert user.is_active is True  # Default value
        assert user.is_superuser is False  # Default value
        assert user.is_email_verified is False  # Default value
    
    def test_create_user_with_minimal_data(self, db_session):
        """Test creating a user with only required fields"""
        user = User(
            username="minimaluser",
            email="minimal@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.username == "minimaluser"
        assert user.email == "minimal@example.com"
        assert user.role == "viewer"  # Default role
        assert user.is_active is True
    
    def test_create_admin_user(self, db_session):
        """Test creating an admin user"""
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_superuser=True
        )
        db_session.add(admin)
        db_session.commit()
        
        assert admin.role == "admin"
        assert admin.is_superuser is True
    
    def test_user_timestamps_created(self, db_session):
        """Test that created_at timestamp is set automatically"""
        user = User(
            username="timeuser",
            email="time@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.created_at is not None
        # updated_at is None initially, only set on update
    
    def test_username_must_be_unique(self, db_session):
        """Test that duplicate usernames are not allowed"""
        user1 = User(
            username="duplicate",
            email="user1@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(
            username="duplicate",  # Same username
            email="user2@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            db_session.commit()
    
    def test_email_must_be_unique(self, db_session):
        """Test that duplicate emails are not allowed"""
        user1 = User(
            username="user1",
            email="duplicate@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(
            username="user2",
            email="duplicate@example.com",  # Same email
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            db_session.commit()


class TestUserPasswordHashing:
    """Test password hashing functionality"""
    
    def test_password_is_hashed(self, db_session):
        """Test that password is properly hashed"""
        plain_password = "MySecretPass123!"
        hashed = get_password_hash(plain_password)
        
        user = User(
            username="hashuser",
            email="hash@example.com",
            hashed_password=hashed
        )
        db_session.add(user)
        db_session.commit()
        
        # Hashed password should not equal plain password
        assert user.hashed_password != plain_password
        # Hashed password should be verifiable
        assert verify_password(plain_password, user.hashed_password) is True
    
    def test_password_verification_fails_with_wrong_password(self, db_session):
        """Test that wrong password fails verification"""
        correct_password = "Correct123!"
        wrong_password = "Wrong123!"
        
        user = User(
            username="verifyuser",
            email="verify@example.com",
            hashed_password=get_password_hash(correct_password)
        )
        db_session.add(user)
        db_session.commit()
        
        assert verify_password(wrong_password, user.hashed_password) is False


class TestUserRoles:
    """Test user role functionality"""
    
    @pytest.mark.parametrize("role", ["admin", "developer", "designer", "executor", "viewer", "executive"])
    def test_valid_roles(self, db_session, role):
        """Test that all valid roles can be assigned"""
        user = User(
            username=f"{role}user",
            email=f"{role}@example.com",
            hashed_password=get_password_hash("Pass123!"),
            role=role
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.role == role
    
    def test_default_role_is_viewer(self, db_session):
        """Test that default role is viewer"""
        user = User(
            username="defaultrole",
            email="default@example.com",
            hashed_password=get_password_hash("Pass123!")
            # No role specified
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.role == "viewer"


class TestUserActiveStatus:
    """Test user active status functionality"""
    
    def test_user_is_active_by_default(self, db_session):
        """Test that users are active by default"""
        user = User(
            username="activeuser",
            email="active@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is True
    
    def test_user_can_be_deactivated(self, db_session):
        """Test that users can be deactivated"""
        user = User(
            username="deactivateuser",
            email="deactivate@example.com",
            hashed_password=get_password_hash("Pass123!"),
            is_active=False
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is False
    
    def test_user_can_be_reactivated(self, db_session):
        """Test that deactivated users can be reactivated"""
        user = User(
            username="reactivateuser",
            email="reactivate@example.com",
            hashed_password=get_password_hash("Pass123!"),
            is_active=False
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_active is False
        
        # Reactivate
        user.is_active = True
        db_session.commit()
        
        assert user.is_active is True


class TestUserRelationships:
    """Test user model relationships"""
    
    def test_user_has_auth_tokens_relationship(self, db_session):
        """Test that user has auth_tokens relationship"""
        user = User(
            username="tokenuser",
            email="token@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        # Relationship exists (even if empty)
        assert hasattr(user, 'auth_tokens')
        assert user.auth_tokens == []
    
    def test_user_has_file_uploads_relationship(self, db_session):
        """Test that user has file_uploads relationship"""
        user = User(
            username="fileuser",
            email="file@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert hasattr(user, 'file_uploads')
        assert user.file_uploads == []
    
    def test_user_has_pipelines_relationship(self, db_session):
        """Test that user has pipelines relationship"""
        user = User(
            username="pipelineuser",
            email="pipeline@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert hasattr(user, 'pipelines')
        assert user.pipelines == []
    
    def test_user_has_connectors_relationship(self, db_session):
        """Test that user has connectors relationship"""
        user = User(
            username="connectoruser",
            email="connector@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert hasattr(user, 'connectors')
        assert user.connectors == []
    
    def test_user_has_transformations_relationship(self, db_session):
        """Test that user has transformations relationship"""
        user = User(
            username="transformuser",
            email="transform@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert hasattr(user, 'transformations')
        assert user.transformations == []


class TestUserEmailVerification:
    """Test email verification functionality"""
    
    def test_user_email_not_verified_by_default(self, db_session):
        """Test that email is not verified by default"""
        user = User(
            username="unverified",
            email="unverified@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.is_email_verified is False
    
    def test_user_email_can_be_verified(self, db_session):
        """Test that email can be verified"""
        user = User(
            username="verified",
            email="verified@example.com",
            hashed_password=get_password_hash("Pass123!")
        )
        db_session.add(user)
        db_session.commit()
        
        # Verify email
        user.is_email_verified = True
        db_session.commit()
        
        assert user.is_email_verified is True


# Run with: pytest backend/tests/unit/models/test_user_model.py -v
