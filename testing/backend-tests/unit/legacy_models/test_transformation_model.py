"""
Unit Tests for Transformation Model
Data Aggregator Platform - Testing Framework

Tests cover:
- Transformation creation with valid data
- Transformation types
- Transformation rules and configuration
- Transformation-user relationship (owner)
- Transformation active status
- Field mappings (source/target fields)
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.core.security import get_password_hash
from backend.models.transformation import Transformation
from backend.models.user import User


@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory database for each test"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user for transformation ownership"""
    user = User(
        username="transformowner",
        email="transform@example.com",
        hashed_password=get_password_hash("Pass123!"),
        role="developer"
    )
    db_session.add(user)
    db_session.commit()
    return user


class TestTransformationModelCreation:
    """Test transformation model creation and basic operations"""
    
    def test_create_transformation_with_required_fields(self, db_session, test_user):
        """Test creating a transformation with all required fields"""
        transformation = Transformation(
            name="Test Transformation",
            description="A test transformation",
            transformation_type="data_normalization",
            transformation_rules={"operation": "normalize", "method": "min-max"},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.id is not None
        assert transformation.name == "Test Transformation"
        assert transformation.description == "A test transformation"
        assert transformation.transformation_type == "data_normalization"
        assert transformation.transformation_rules == {"operation": "normalize", "method": "min-max"}
        assert transformation.owner_id == test_user.id
        assert transformation.is_active is True  # Default value
    
    def test_create_transformation_with_field_mappings(self, db_session, test_user):
        """Test creating a transformation with source and target fields"""
        transformation = Transformation(
            name="Field Mapper",
            transformation_type="field_mapping",
            source_fields=["first_name", "last_name", "email"],
            target_fields=["firstName", "lastName", "emailAddress"],
            transformation_rules={"case": "camelCase"},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.source_fields == ["first_name", "last_name", "email"]
        assert transformation.target_fields == ["firstName", "lastName", "emailAddress"]
    
    def test_create_transformation_with_code(self, db_session, test_user):
        """Test creating a transformation with transformation code"""
        code = """
def transform(data):
    return data.upper()
"""
        transformation = Transformation(
            name="Code Transform",
            transformation_type="custom_code",
            transformation_code=code,
            transformation_rules={},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.transformation_code == code
    
    def test_transformation_requires_owner(self, db_session):
        """Test that transformation requires an owner_id"""
        transformation = Transformation(
            name="Orphan Transform",
            transformation_type="data_cleanup",
            transformation_rules={}
        )
        db_session.add(transformation)
        
        with pytest.raises(Exception):  # IntegrityError
            db_session.commit()
    
    def test_transformation_timestamps_created(self, db_session, test_user):
        """Test that created_at timestamp is set automatically"""
        transformation = Transformation(
            name="Time Transform",
            transformation_type="date_format",
            transformation_rules={},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.created_at is not None


class TestTransformationTypes:
    """Test different transformation types"""
    
    @pytest.mark.parametrize("transform_type,rules", [
        ("data_normalization", {"method": "z-score"}),
        ("currency_conversion", {"from": "USD", "to": "EUR"}),
        ("date_format", {"input": "YYYY-MM-DD", "output": "DD/MM/YYYY"}),
        ("field_mapping", {"mapping": {"old": "new"}}),
        ("data_filtering", {"condition": "value > 0"}),
        ("data_aggregation", {"function": "sum", "group_by": "category"}),
    ])
    def test_create_transformation_with_different_types(self, db_session, test_user, transform_type, rules):
        """Test creating transformations of different types"""
        transformation = Transformation(
            name=f"{transform_type.replace('_', ' ').title()}",
            transformation_type=transform_type,
            transformation_rules=rules,
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.transformation_type == transform_type
        assert transformation.transformation_rules == rules


class TestTransformationActiveStatus:
    """Test transformation active status functionality"""
    
    def test_transformation_is_active_by_default(self, db_session, test_user):
        """Test that transformations are active by default"""
        transformation = Transformation(
            name="Active Transform",
            transformation_type="data_cleanup",
            transformation_rules={},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.is_active is True
    
    def test_transformation_can_be_deactivated(self, db_session, test_user):
        """Test that transformations can be deactivated"""
        transformation = Transformation(
            name="Inactive Transform",
            transformation_type="deprecated",
            transformation_rules={},
            is_active=False,
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        
        assert transformation.is_active is False


class TestTransformationUserRelationship:
    """Test transformation-user relationship (ownership)"""
    
    def test_transformation_has_owner_relationship(self, db_session, test_user):
        """Test that transformation has owner relationship to user"""
        transformation = Transformation(
            name="Owned Transform",
            transformation_type="data_normalization",
            transformation_rules={},
            owner_id=test_user.id
        )
        db_session.add(transformation)
        db_session.commit()
        db_session.refresh(transformation)
        
        assert transformation.owner is not None
        assert transformation.owner.id == test_user.id
        assert transformation.owner.username == "transformowner"
    
    def test_user_has_transformations_relationship(self, db_session, test_user):
        """Test that user can access their transformations"""
        transform1 = Transformation(
            name="Transform 1",
            transformation_type="type_a",
            transformation_rules={},
            owner_id=test_user.id
        )
        transform2 = Transformation(
            name="Transform 2",
            transformation_type="type_b",
            transformation_rules={},
            owner_id=test_user.id
        )
        db_session.add_all([transform1, transform2])
        db_session.commit()
        db_session.refresh(test_user)
        
        assert len(test_user.transformations) == 2
        transform_names = [t.name for t in test_user.transformations]
        assert "Transform 1" in transform_names
        assert "Transform 2" in transform_names


# Run with: pytest testing/backend-tests/unit/legacy_models/test_transformation_model.py -v
