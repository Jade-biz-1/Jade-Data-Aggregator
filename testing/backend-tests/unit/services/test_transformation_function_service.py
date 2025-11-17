"""
Unit tests for Transformation Function Service
Tests transformation function CRUD operations, filtering, and execution
"""

import pytest
from backend.services.transformation_function_service import TransformationFunctionService
from backend.models.pipeline_template import TransformationFunction


class TestTransformationFunctionService:
    """Test suite for TransformationFunctionService"""

    async def test_create_function_with_valid_data(self, test_session):
        """Test creating a transformation function with all required fields"""
        function = await TransformationFunctionService.create_function(
            db=test_session,
            name="test_function",
            display_name="Test Function",
            description="A test transformation function",
            function_code="def test_function(data):\n    return data",
            category="custom",
            function_type="python"
        )

        assert function.id is not None
        assert function.name == "test_function"
        assert function.display_name == "Test Function"
        assert function.category == "custom"
        assert function.function_type == "python"
        assert function.use_count == 0
        assert function.is_builtin is False
        assert function.is_public is False

    async def test_create_function_with_optional_fields(self, test_session):
        """Test creating function with optional parameters"""
        parameters = [
            {"name": "data", "type": "array", "description": "Input data"},
            {"name": "threshold", "type": "number", "description": "Threshold value"}
        ]

        example_input = {"data": [1, 2, 3], "threshold": 5}
        example_output = {"result": [1, 2, 3]}

        function = await TransformationFunctionService.create_function(
            db=test_session,
            name="complex_function",
            display_name="Complex Function",
            description="A complex transformation",
            function_code="def complex_function(data, threshold):\n    return data",
            category="filter",
            function_type="python",
            parameters=parameters,
            return_type="array",
            example_usage="complex_function(data, 10)",
            example_input=example_input,
            example_output=example_output,
            is_public=True,
            is_builtin=False,
            created_by=1,
            tags=["filter", "custom", "advanced"]
        )

        assert function.parameters == parameters
        assert function.return_type == "array"
        assert function.example_usage == "complex_function(data, 10)"
        assert function.example_input == example_input
        assert function.example_output == example_output
        assert function.is_public is True
        assert function.created_by == 1
        assert function.tags == ["filter", "custom", "advanced"]

    async def test_get_function_by_id(self, test_session):
        """Test retrieving a function by ID"""
        # Create a function
        created = await TransformationFunctionService.create_function(
            db=test_session,
            name="get_test",
            display_name="Get Test",
            description="Test get by ID",
            function_code="def get_test(data):\n    return data"
        )

        # Retrieve it
        retrieved = await TransformationFunctionService.get_function(
            db=test_session,
            function_id=created.id
        )

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.name == "get_test"

    async def test_get_function_by_id_not_found(self, test_session):
        """Test retrieving non-existent function returns None"""
        result = await TransformationFunctionService.get_function(
            db=test_session,
            function_id=99999
        )

        assert result is None

    async def test_get_function_by_name(self, test_session):
        """Test retrieving a function by name"""
        await TransformationFunctionService.create_function(
            db=test_session,
            name="unique_name",
            display_name="Unique Name",
            description="Test get by name",
            function_code="def unique_name(data):\n    return data"
        )

        retrieved = await TransformationFunctionService.get_function_by_name(
            db=test_session,
            name="unique_name"
        )

        assert retrieved is not None
        assert retrieved.name == "unique_name"

    async def test_list_functions_no_filters(self, test_session):
        """Test listing all functions without filters"""
        # Create multiple functions
        await TransformationFunctionService.create_function(
            db=test_session,
            name="func1",
            display_name="Function 1",
            description="First function",
            function_code="def func1(data):\n    return data"
        )
        await TransformationFunctionService.create_function(
            db=test_session,
            name="func2",
            display_name="Function 2",
            description="Second function",
            function_code="def func2(data):\n    return data"
        )

        functions = await TransformationFunctionService.list_functions(
            db=test_session
        )

        assert len(functions) >= 2
        function_names = [f.name for f in functions]
        assert "func1" in function_names
        assert "func2" in function_names

    async def test_list_functions_filter_by_category(self, test_session):
        """Test listing functions filtered by category"""
        await TransformationFunctionService.create_function(
            db=test_session,
            name="filter_func",
            display_name="Filter Function",
            description="Filter category",
            function_code="def filter_func(data):\n    return data",
            category="filter"
        )
        await TransformationFunctionService.create_function(
            db=test_session,
            name="map_func",
            display_name="Map Function",
            description="Map category",
            function_code="def map_func(data):\n    return data",
            category="map"
        )

        filter_functions = await TransformationFunctionService.list_functions(
            db=test_session,
            category="filter"
        )

        assert len(filter_functions) >= 1
        assert all(f.category == "filter" for f in filter_functions)

    async def test_list_functions_filter_by_type(self, test_session):
        """Test listing functions filtered by function type"""
        await TransformationFunctionService.create_function(
            db=test_session,
            name="python_func",
            display_name="Python Function",
            description="Python type",
            function_code="def python_func(data):\n    return data",
            function_type="python"
        )

        functions = await TransformationFunctionService.list_functions(
            db=test_session,
            function_type="python"
        )

        assert len(functions) >= 1
        assert all(f.function_type == "python" for f in functions)

    async def test_list_functions_filter_by_is_public(self, test_session):
        """Test listing functions filtered by is_public flag"""
        await TransformationFunctionService.create_function(
            db=test_session,
            name="public_func",
            display_name="Public Function",
            description="Public function",
            function_code="def public_func(data):\n    return data",
            is_public=True
        )
        await TransformationFunctionService.create_function(
            db=test_session,
            name="private_func",
            display_name="Private Function",
            description="Private function",
            function_code="def private_func(data):\n    return data",
            is_public=False
        )

        public_functions = await TransformationFunctionService.list_functions(
            db=test_session,
            is_public=True
        )

        assert len(public_functions) >= 1
        assert all(f.is_public is True for f in public_functions)

    async def test_list_functions_search(self, test_session):
        """Test searching functions by name/description"""
        await TransformationFunctionService.create_function(
            db=test_session,
            name="searchable_func",
            display_name="Searchable Function",
            description="This is a unique searchable description",
            function_code="def searchable_func(data):\n    return data"
        )

        results = await TransformationFunctionService.list_functions(
            db=test_session,
            search="searchable"
        )

        assert len(results) >= 1
        assert any("searchable" in f.name.lower() or "searchable" in f.description.lower() for f in results)

    async def test_list_functions_pagination(self, test_session):
        """Test pagination of function list"""
        # Create several functions
        for i in range(5):
            await TransformationFunctionService.create_function(
                db=test_session,
                name=f"page_func_{i}",
                display_name=f"Page Function {i}",
                description=f"Function {i}",
                function_code=f"def page_func_{i}(data):\n    return data"
            )

        # Get first page
        page1 = await TransformationFunctionService.list_functions(
            db=test_session,
            skip=0,
            limit=2
        )

        # Get second page
        page2 = await TransformationFunctionService.list_functions(
            db=test_session,
            skip=2,
            limit=2
        )

        assert len(page1) == 2
        assert len(page2) >= 2
        # Ensure pages don't overlap
        page1_ids = {f.id for f in page1}
        page2_ids = {f.id for f in page2}
        assert len(page1_ids.intersection(page2_ids)) == 0

    async def test_update_function(self, test_session):
        """Test updating a transformation function"""
        function = await TransformationFunctionService.create_function(
            db=test_session,
            name="update_test",
            display_name="Update Test",
            description="Original description",
            function_code="def update_test(data):\n    return data"
        )

        updated = await TransformationFunctionService.update_function(
            db=test_session,
            function_id=function.id,
            description="Updated description",
            is_public=True
        )

        assert updated is not None
        assert updated.id == function.id
        assert updated.description == "Updated description"
        assert updated.is_public is True
        assert updated.name == "update_test"  # Unchanged

    async def test_update_nonexistent_function(self, test_session):
        """Test updating non-existent function returns None"""
        result = await TransformationFunctionService.update_function(
            db=test_session,
            function_id=99999,
            description="Updated"
        )

        assert result is None

    async def test_delete_function(self, test_session):
        """Test deleting a transformation function"""
        function = await TransformationFunctionService.create_function(
            db=test_session,
            name="delete_test",
            display_name="Delete Test",
            description="To be deleted",
            function_code="def delete_test(data):\n    return data"
        )

        result = await TransformationFunctionService.delete_function(
            db=test_session,
            function_id=function.id
        )

        assert result is True

        # Verify it's deleted
        deleted = await TransformationFunctionService.get_function(
            db=test_session,
            function_id=function.id
        )
        assert deleted is None

    async def test_delete_nonexistent_function(self, test_session):
        """Test deleting non-existent function returns False"""
        result = await TransformationFunctionService.delete_function(
            db=test_session,
            function_id=99999
        )

        assert result is False

    async def test_increment_use_count(self, test_session):
        """Test incrementing function use count"""
        function = await TransformationFunctionService.create_function(
            db=test_session,
            name="use_count_test",
            display_name="Use Count Test",
            description="Test use count",
            function_code="def use_count_test(data):\n    return data"
        )

        assert function.use_count == 0

        # Increment use count
        await TransformationFunctionService.increment_use_count(
            db=test_session,
            function_id=function.id
        )

        # Verify increment
        updated = await TransformationFunctionService.get_function(
            db=test_session,
            function_id=function.id
        )
        assert updated.use_count == 1

        # Increment again
        await TransformationFunctionService.increment_use_count(
            db=test_session,
            function_id=function.id
        )

        updated = await TransformationFunctionService.get_function(
            db=test_session,
            function_id=function.id
        )
        assert updated.use_count == 2

    async def test_get_functions_by_category(self, test_session):
        """Test getting functions grouped by category"""
        # Create functions in different categories
        await TransformationFunctionService.create_function(
            db=test_session,
            name="filter1",
            display_name="Filter 1",
            description="Filter function",
            function_code="def filter1(data):\n    return data",
            category="filter",
            is_public=True
        )
        await TransformationFunctionService.create_function(
            db=test_session,
            name="map1",
            display_name="Map 1",
            description="Map function",
            function_code="def map1(data):\n    return data",
            category="map",
            is_public=True
        )
        await TransformationFunctionService.create_function(
            db=test_session,
            name="filter2",
            display_name="Filter 2",
            description="Another filter",
            function_code="def filter2(data):\n    return data",
            category="filter",
            is_public=True
        )

        grouped = await TransformationFunctionService.get_functions_by_category(
            db=test_session
        )

        assert "filter" in grouped
        assert "map" in grouped
        assert len(grouped["filter"]) >= 2
        assert len(grouped["map"]) >= 1

    def test_get_builtin_functions(self):
        """Test retrieving built-in function definitions"""
        builtins = TransformationFunctionService.get_builtin_functions()

        assert len(builtins) > 0
        assert all("name" in func for func in builtins)
        assert all("function_code" in func for func in builtins)
        assert all("is_builtin" in func and func["is_builtin"] is True for func in builtins)

        # Verify specific built-in functions exist
        function_names = [func["name"] for func in builtins]
        assert "filter_null_values" in function_names
        assert "map_fields" in function_names
        assert "aggregate_sum" in function_names
        assert "sort_records" in function_names
