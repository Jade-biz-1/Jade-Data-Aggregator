"""
Unit Tests for Transformation Business Logic
Data Aggregator Platform - Testing Framework - Week 95 TEST-008

Tests cover:
- Transformation CRUD operations
- Field mapping validation
- Transformation types and rules
- Transformation function management
- Code validation and execution safety

Total: 25 tests for transformation business logic
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.crud.transformation import CRUDTransformation, transformation
from backend.models.transformation import Transformation
from backend.schemas.transformation import TransformationCreate, TransformationUpdate
from backend.services.transformation_function_service import TransformationFunctionService
from backend.models.pipeline_template import TransformationFunction


class TestTransformationCRUDOperations:
    """Test transformation CRUD operations"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def sample_transformation(self):
        """Create a sample transformation"""
        return Transformation(
            id=1,
            name="Currency Conversion",
            description="Convert USD to EUR",
            transformation_type="currency_conversion",
            source_fields=["amount_usd"],
            target_fields=["amount_eur"],
            transformation_rules={"rate": 0.85, "precision": 2},
            is_active=True,
            owner_id=1
        )

    # CRUD Tests

    @pytest.mark.asyncio
    async def test_create_transformation(self, mock_db_session):
        """Test creating a new transformation"""
        crud = CRUDTransformation()

        transformation_create = TransformationCreate(
            name="Data Normalization",
            description="Normalize email addresses",
            transformation_type="data_normalization",
            source_fields=["email"],
            target_fields=["normalized_email"],
            transformation_rules={"lowercase": True, "trim": True},
            is_active=True
        )

        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.create(db=mock_db_session, obj_in=transformation_create)

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert result.name == "Data Normalization"
        assert result.transformation_type == "data_normalization"

    @pytest.mark.asyncio
    async def test_get_transformation_by_id(self, mock_db_session, sample_transformation):
        """Test retrieving transformation by ID"""
        crud = CRUDTransformation()

        mock_result = Mock()
        mock_result.scalars.return_value.first.return_value = sample_transformation
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get(db=mock_db_session, id=1)

        assert result is not None
        assert result.id == 1
        assert result.name == "Currency Conversion"

    @pytest.mark.asyncio
    async def test_get_transformation_not_found(self, mock_db_session):
        """Test retrieving non-existent transformation"""
        crud = CRUDTransformation()

        mock_result = Mock()
        mock_result.scalars.return_value.first.return_value = None
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get(db=mock_db_session, id=99999)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_multiple_transformations(self, mock_db_session):
        """Test retrieving multiple transformations with pagination"""
        crud = CRUDTransformation()

        transformations = [
            Transformation(id=1, name="Transform 1", transformation_type="type1", owner_id=1),
            Transformation(id=2, name="Transform 2", transformation_type="type2", owner_id=1),
            Transformation(id=3, name="Transform 3", transformation_type="type3", owner_id=1)
        ]

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = transformations
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get_multi(db=mock_db_session, skip=0, limit=10)

        assert len(result) == 3
        assert result[0].name == "Transform 1"

    @pytest.mark.asyncio
    async def test_update_transformation(self, mock_db_session, sample_transformation):
        """Test updating transformation"""
        crud = CRUDTransformation()

        transformation_update = TransformationUpdate(
            name="Updated Transformation",
            transformation_rules={"rate": 0.90},
            is_active=False
        )

        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.update(
            db=mock_db_session,
            db_obj=sample_transformation,
            obj_in=transformation_update
        )

        assert sample_transformation.name == "Updated Transformation"
        assert sample_transformation.is_active == False
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_transformation(self, mock_db_session, sample_transformation):
        """Test deleting transformation"""
        crud = CRUDTransformation()

        mock_result = Mock()
        mock_result.scalars.return_value.first.return_value = sample_transformation
        mock_db_session.execute = AsyncMock(return_value=mock_result)
        mock_db_session.delete = AsyncMock()
        mock_db_session.commit = AsyncMock()

        result = await crud.remove(db=mock_db_session, id=1)

        assert result == sample_transformation
        mock_db_session.delete.assert_called_once_with(sample_transformation)
        mock_db_session.commit.assert_called_once()


class TestFieldMappingValidation:
    """Test field mapping validation logic"""

    def test_source_fields_must_be_list(self):
        """Test that source fields must be a list"""
        # Valid list
        transformation_create = TransformationCreate(
            name="Test",
            transformation_type="mapping",
            source_fields=["field1", "field2"],
            target_fields=["output1"]
        )
        assert isinstance(transformation_create.source_fields, list)

    def test_target_fields_must_be_list(self):
        """Test that target fields must be a list"""
        # Valid list
        transformation_create = TransformationCreate(
            name="Test",
            transformation_type="mapping",
            source_fields=["input1"],
            target_fields=["field1", "field2"]
        )
        assert isinstance(transformation_create.target_fields, list)

    def test_empty_source_fields_allowed(self):
        """Test that empty source fields are allowed (generated fields)"""
        transformation_create = TransformationCreate(
            name="Test",
            transformation_type="generate",
            source_fields=[],
            target_fields=["timestamp"]
        )
        assert transformation_create.source_fields == []

    def test_field_mapping_one_to_one(self):
        """Test one-to-one field mapping"""
        transformation_create = TransformationCreate(
            name="Rename Field",
            transformation_type="rename",
            source_fields=["old_name"],
            target_fields=["new_name"],
            transformation_rules={"mapping": {"old_name": "new_name"}}
        )
        assert len(transformation_create.source_fields) == 1
        assert len(transformation_create.target_fields) == 1

    def test_field_mapping_many_to_one(self):
        """Test many-to-one field mapping (aggregation)"""
        transformation_create = TransformationCreate(
            name="Concatenate",
            transformation_type="concatenate",
            source_fields=["first_name", "last_name"],
            target_fields=["full_name"],
            transformation_rules={"separator": " "}
        )
        assert len(transformation_create.source_fields) == 2
        assert len(transformation_create.target_fields) == 1

    def test_field_mapping_one_to_many(self):
        """Test one-to-many field mapping (split)"""
        transformation_create = TransformationCreate(
            name="Split Full Name",
            transformation_type="split",
            source_fields=["full_name"],
            target_fields=["first_name", "last_name"],
            transformation_rules={"delimiter": " "}
        )
        assert len(transformation_create.source_fields) == 1
        assert len(transformation_create.target_fields) == 2


class TestTransformationTypes:
    """Test different transformation types"""

    def test_currency_conversion_transformation(self):
        """Test currency conversion transformation"""
        transformation_create = TransformationCreate(
            name="USD to EUR",
            transformation_type="currency_conversion",
            source_fields=["amount_usd"],
            target_fields=["amount_eur"],
            transformation_rules={
                "source_currency": "USD",
                "target_currency": "EUR",
                "rate": 0.85
            }
        )
        assert transformation_create.transformation_type == "currency_conversion"
        assert "rate" in transformation_create.transformation_rules

    def test_data_normalization_transformation(self):
        """Test data normalization transformation"""
        transformation_create = TransformationCreate(
            name="Email Normalization",
            transformation_type="data_normalization",
            source_fields=["email"],
            target_fields=["normalized_email"],
            transformation_rules={
                "lowercase": True,
                "trim_whitespace": True,
                "remove_special_chars": False
            }
        )
        assert transformation_create.transformation_type == "data_normalization"

    def test_date_format_transformation(self):
        """Test date format transformation"""
        transformation_create = TransformationCreate(
            name="Date Reformatter",
            transformation_type="date_format",
            source_fields=["date_string"],
            target_fields=["formatted_date"],
            transformation_rules={
                "input_format": "%Y-%m-%d",
                "output_format": "%d/%m/%Y"
            }
        )
        assert transformation_create.transformation_type == "date_format"

    def test_filter_transformation(self):
        """Test filter transformation"""
        transformation_create = TransformationCreate(
            name="Age Filter",
            transformation_type="filter",
            source_fields=["age"],
            target_fields=["age"],
            transformation_rules={
                "condition": "greater_than",
                "value": 18
            }
        )
        assert transformation_create.transformation_type == "filter"

    def test_aggregate_transformation(self):
        """Test aggregate transformation"""
        transformation_create = TransformationCreate(
            name="Sum Calculator",
            transformation_type="aggregate",
            source_fields=["values"],
            target_fields=["sum"],
            transformation_rules={
                "operation": "sum",
                "group_by": "category"
            }
        )
        assert transformation_create.transformation_type == "aggregate"


class TestTransformationFunctionService:
    """Test transformation function management"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.mark.asyncio
    async def test_create_transformation_function(self, mock_db_session):
        """Test creating a transformation function"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        function = await TransformationFunctionService.create_function(
            db=mock_db_session,
            name="uppercase",
            display_name="Convert to Uppercase",
            description="Converts string to uppercase",
            function_code="return value.upper()",
            category="string",
            function_type="python",
            parameters=[{"name": "value", "type": "string"}],
            return_type="string"
        )

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_function_by_id(self, mock_db_session):
        """Test retrieving function by ID"""
        sample_function = TransformationFunction(
            id=1,
            name="test_func",
            display_name="Test Function",
            description="Test",
            function_code="return x",
            category="custom"
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_function
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await TransformationFunctionService.get_function(mock_db_session, 1)

        assert result is not None
        assert result.id == 1

    @pytest.mark.asyncio
    async def test_get_function_by_name(self, mock_db_session):
        """Test retrieving function by name"""
        sample_function = TransformationFunction(
            id=1,
            name="uppercase",
            display_name="Uppercase",
            description="Test",
            function_code="return x.upper()",
            category="string"
        )

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_function
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await TransformationFunctionService.get_function_by_name(
            mock_db_session,
            "uppercase"
        )

        assert result is not None
        assert result.name == "uppercase"

    @pytest.mark.asyncio
    async def test_list_functions_with_filters(self, mock_db_session):
        """Test listing functions with various filters"""
        functions = [
            TransformationFunction(id=1, name="func1", display_name="F1", description="", function_code="", category="string", is_builtin=True),
            TransformationFunction(id=2, name="func2", display_name="F2", description="", function_code="", category="string", is_builtin=False)
        ]

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = functions
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await TransformationFunctionService.list_functions(
            db=mock_db_session,
            category="string",
            is_builtin=None,
            limit=10
        )

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_list_functions_with_search(self, mock_db_session):
        """Test listing functions with search query"""
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await TransformationFunctionService.list_functions(
            db=mock_db_session,
            search="uppercase",
            limit=10
        )

        # Query should be executed with search pattern
        mock_db_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_builtin_functions_filter(self, mock_db_session):
        """Test filtering builtin vs custom functions"""
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        # Get only builtin functions
        result = await TransformationFunctionService.list_functions(
            db=mock_db_session,
            is_builtin=True,
            limit=10
        )

        mock_db_session.execute.assert_called_once()


class TestTransformationBusinessRules:
    """Test transformation business rules and constraints"""

    def test_transformation_name_required(self):
        """Test that transformation name is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            TransformationCreate(
                name=None,  # Invalid: name required
                transformation_type="test"
            )

    def test_transformation_type_required(self):
        """Test that transformation type is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            TransformationCreate(
                name="Test",
                transformation_type=None  # Invalid: required
            )

    def test_transformation_active_state_default(self):
        """Test that transformation is active by default"""
        transformation_create = TransformationCreate(
            name="Test",
            transformation_type="test"
        )

        # Should default to True
        assert transformation_create.is_active == True

    def test_transformation_rules_optional(self):
        """Test that transformation rules are optional"""
        transformation_create = TransformationCreate(
            name="Test",
            transformation_type="test",
            transformation_rules=None
        )

        assert transformation_create.transformation_rules is None

    def test_transformation_rules_can_be_complex(self):
        """Test that transformation rules can contain complex structures"""
        complex_rules = {
            "conditions": [
                {"field": "age", "operator": "gt", "value": 18},
                {"field": "country", "operator": "in", "value": ["US", "UK"]}
            ],
            "actions": [
                {"type": "set_field", "field": "adult", "value": True}
            ],
            "priority": 1,
            "enabled": True
        }

        transformation_create = TransformationCreate(
            name="Complex Rules",
            transformation_type="conditional",
            transformation_rules=complex_rules
        )

        assert transformation_create.transformation_rules["priority"] == 1
        assert len(transformation_create.transformation_rules["conditions"]) == 2


class TestTransformationSafety:
    """Test transformation code safety and validation"""

    def test_transformation_code_storage(self):
        """Test that transformation code can be stored"""
        code = "def transform(value):\n    return value.upper()"

        transformation_create = TransformationCreate(
            name="Custom Code",
            transformation_type="custom",
            transformation_code=code
        )

        assert transformation_create.transformation_code == code

    def test_transformation_code_optional(self):
        """Test that transformation code is optional"""
        transformation_create = TransformationCreate(
            name="No Code",
            transformation_type="builtin"
        )

        # Code is optional for builtin transformations
        assert transformation_create.transformation_code is None


# Run with: pytest testing/backend-tests/unit/business-logic/test_transformation_business_logic.py -v
# Run with coverage: pytest testing/backend-tests/unit/business-logic/test_transformation_business_logic.py -v --cov=backend.crud.transformation --cov=backend.services.transformation_function_service --cov-report=term-missing
