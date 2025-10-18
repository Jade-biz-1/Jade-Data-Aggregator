"""
Unit tests for Transformation model
Tests transformation creation, validation, types, and CRUD operations
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from backend.models.transformation import Transformation
from backend.models.user import User
from backend.core.security import get_password_hash


class TestTransformationModel:
    """Test suite for Transformation model"""

    @pytest.fixture
    async def test_user(self, test_session):
        """Create a test user for transformation ownership"""
        user = User(
            username="transformowner",
            email="transformowner@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="developer"
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    async def test_create_transformation_with_valid_data(self, test_session, test_user):
        """Test creating a transformation with all required fields"""
        transformation = Transformation(
            name="Data Normalization",
            description="Normalize customer data",
            transformation_type="data_normalization",
            source_fields=["first_name", "last_name", "email"],
            target_fields=["full_name", "email_normalized"],
            transformation_rules={"join_fields": ["first_name", "last_name"]},
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.id is not None
        assert transformation.name == "Data Normalization"
        assert transformation.transformation_type == "data_normalization"
        assert transformation.source_fields == ["first_name", "last_name", "email"]
        assert transformation.target_fields == ["full_name", "email_normalized"]
        assert transformation.is_active is True
        assert transformation.owner_id == test_user.id

    async def test_create_mapping_transformation(self, test_session, test_user):
        """Test creating a field mapping transformation"""
        transformation = Transformation(
            name="Field Mapper",
            description="Map source to target fields",
            transformation_type="mapping",
            source_fields=["source_id", "source_name"],
            target_fields=["id", "name"],
            transformation_rules={
                "mappings": {
                    "source_id": "id",
                    "source_name": "name"
                }
            },
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.transformation_type == "mapping"
        assert "mappings" in transformation.transformation_rules

    async def test_create_currency_conversion_transformation(self, test_session, test_user):
        """Test creating a currency conversion transformation"""
        transformation = Transformation(
            name="Currency Converter",
            description="Convert EUR to USD",
            transformation_type="currency_conversion",
            source_fields=["price_eur"],
            target_fields=["price_usd"],
            transformation_rules={
                "from_currency": "EUR",
                "to_currency": "USD",
                "exchange_rate": 1.18
            },
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.transformation_type == "currency_conversion"
        assert transformation.transformation_rules["from_currency"] == "EUR"
        assert transformation.transformation_rules["to_currency"] == "USD"

    async def test_create_transformation_with_code(self, test_session, test_user):
        """Test creating a transformation with custom code"""
        transformation_code = """
def transform(data):
    return {
        'full_name': f"{data['first_name']} {data['last_name']}",
        'email': data['email'].lower()
    }
"""
        transformation = Transformation(
            name="Custom Transform",
            description="Custom Python transformation",
            transformation_type="custom_code",
            transformation_code=transformation_code,
            source_fields=["first_name", "last_name", "email"],
            target_fields=["full_name", "email"],
            transformation_rules={},
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.transformation_code is not None
        assert "def transform" in transformation.transformation_code

    async def test_transformation_missing_required_fields(self, test_session, test_user):
        """Test that required fields must be provided"""
        # Missing transformation_type
        transformation = Transformation(
            name="Invalid Transform",
            source_fields=["field1"],
            target_fields=["field2"],
            owner_id=test_user.id
        )
        test_session.add(transformation)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_transformation_missing_owner_id(self, test_session):
        """Test that owner_id is required"""
        transformation = Transformation(
            name="Orphan Transform",
            transformation_type="mapping",
            source_fields=["field1"],
            target_fields=["field2"]
        )
        test_session.add(transformation)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_transformation_user_relationship(self, test_session, test_user):
        """Test the relationship between Transformation and User"""
        transformation = Transformation(
            name="Relationship Test",
            transformation_type="mapping",
            source_fields=["field1"],
            target_fields=["field2"],
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)
        await test_session.refresh(test_user)

        # Test forward relationship (transformation -> user)
        assert transformation.owner is not None
        assert transformation.owner.id == test_user.id
        assert transformation.owner.username == "transformowner"

        # Test backward relationship (user -> transformations)
        assert len(test_user.transformations) > 0
        assert transformation in test_user.transformations

    async def test_transformation_is_active_flag(self, test_session, test_user):
        """Test transformation activation/deactivation"""
        transformation = Transformation(
            name="Active Test",
            transformation_type="mapping",
            source_fields=["field1"],
            target_fields=["field2"],
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.is_active is True

        # Deactivate transformation
        transformation.is_active = False
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.is_active is False

    async def test_transformation_timestamps(self, test_session, test_user):
        """Test that timestamps are set automatically"""
        transformation = Transformation(
            name="Timestamp Test",
            transformation_type="mapping",
            source_fields=["field1"],
            target_fields=["field2"],
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        assert transformation.created_at is not None
        assert isinstance(transformation.created_at, datetime)

    async def test_transformation_query_by_type(self, test_session, test_user):
        """Test querying transformations by type"""
        from sqlalchemy import select

        # Create multiple transformations of different types
        mapping = Transformation(
            name="Mapper",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=test_user.id
        )
        normalization = Transformation(
            name="Normalizer",
            transformation_type="data_normalization",
            source_fields=["c"],
            target_fields=["d"],
            owner_id=test_user.id
        )
        test_session.add_all([mapping, normalization])
        await test_session.commit()

        # Query for mapping transformations
        result = await test_session.execute(
            select(Transformation).where(Transformation.transformation_type == "mapping")
        )
        mappings = result.scalars().all()

        assert len(mappings) >= 1
        assert all(t.transformation_type == "mapping" for t in mappings)

    async def test_transformation_delete(self, test_session, test_user):
        """Test deleting a transformation"""
        from sqlalchemy import select

        transformation = Transformation(
            name="Delete Test",
            transformation_type="mapping",
            source_fields=["field1"],
            target_fields=["field2"],
            owner_id=test_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        transformation_id = transformation.id

        await test_session.delete(transformation)
        await test_session.commit()

        result = await test_session.execute(
            select(Transformation).where(Transformation.id == transformation_id)
        )
        deleted_transformation = result.scalar_one_or_none()

        assert deleted_transformation is None
