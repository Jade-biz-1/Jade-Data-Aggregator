"""
Transformation Function Service
Manages library of reusable transformation functions
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from backend.models.pipeline_template import TransformationFunction


class TransformationFunctionService:
    """Service for managing transformation functions"""

    @staticmethod
    async def create_function(
        db: AsyncSession,
        name: str,
        display_name: str,
        description: str,
        function_code: str,
        category: str = "custom",
        function_type: str = "python",
        parameters: Optional[List[Dict[str, Any]]] = None,
        return_type: Optional[str] = None,
        example_usage: Optional[str] = None,
        example_input: Optional[Dict[str, Any]] = None,
        example_output: Optional[Dict[str, Any]] = None,
        is_public: bool = False,
        is_builtin: bool = False,
        created_by: Optional[int] = None,
        tags: Optional[List[str]] = None
    ) -> TransformationFunction:
        """Create a new transformation function"""
        function = TransformationFunction(
            name=name,
            display_name=display_name,
            description=description,
            category=category,
            function_code=function_code,
            function_type=function_type,
            parameters=parameters or [],
            return_type=return_type,
            example_usage=example_usage,
            example_input=example_input,
            example_output=example_output,
            is_builtin=is_builtin,
            is_public=is_public,
            created_by=created_by,
            tags=tags or [],
            use_count=0
        )

        db.add(function)
        await db.commit()
        await db.refresh(function)
        return function

    @staticmethod
    async def get_function(db: AsyncSession, function_id: int) -> Optional[TransformationFunction]:
        """Get a function by ID"""
        result = await db.execute(
            select(TransformationFunction).where(TransformationFunction.id == function_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_function_by_name(db: AsyncSession, name: str) -> Optional[TransformationFunction]:
        """Get a function by name"""
        result = await db.execute(
            select(TransformationFunction).where(TransformationFunction.name == name)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_functions(
        db: AsyncSession,
        category: Optional[str] = None,
        function_type: Optional[str] = None,
        is_public: Optional[bool] = None,
        is_builtin: Optional[bool] = None,
        created_by: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[TransformationFunction]:
        """List transformation functions with filters"""
        query = select(TransformationFunction)

        # Apply filters
        if category:
            query = query.where(TransformationFunction.category == category)
        if function_type:
            query = query.where(TransformationFunction.function_type == function_type)
        if is_public is not None:
            query = query.where(TransformationFunction.is_public == is_public)
        if is_builtin is not None:
            query = query.where(TransformationFunction.is_builtin == is_builtin)
        if created_by is not None:
            query = query.where(TransformationFunction.created_by == created_by)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (TransformationFunction.name.ilike(search_pattern)) |
                (TransformationFunction.display_name.ilike(search_pattern)) |
                (TransformationFunction.description.ilike(search_pattern))
            )

        query = query.offset(skip).limit(limit).order_by(TransformationFunction.name)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_function(
        db: AsyncSession,
        function_id: int,
        **kwargs
    ) -> Optional[TransformationFunction]:
        """Update a transformation function"""
        function = await TransformationFunctionService.get_function(db, function_id)
        if not function:
            return None

        for key, value in kwargs.items():
            if hasattr(function, key) and value is not None:
                setattr(function, key, value)

        await db.commit()
        await db.refresh(function)
        return function

    @staticmethod
    async def delete_function(db: AsyncSession, function_id: int) -> bool:
        """Delete a transformation function"""
        result = await db.execute(
            delete(TransformationFunction).where(TransformationFunction.id == function_id)
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def increment_use_count(db: AsyncSession, function_id: int):
        """Increment function use count"""
        await db.execute(
            update(TransformationFunction)
            .where(TransformationFunction.id == function_id)
            .values(use_count=TransformationFunction.use_count + 1)
        )
        await db.commit()

    @staticmethod
    async def get_functions_by_category(db: AsyncSession) -> Dict[str, List[TransformationFunction]]:
        """Get functions grouped by category"""
        result = await db.execute(
            select(TransformationFunction)
            .where(TransformationFunction.is_public == True)
            .order_by(TransformationFunction.category, TransformationFunction.name)
        )
        functions = result.scalars().all()

        # Group by category
        by_category: Dict[str, List[TransformationFunction]] = {}
        for func in functions:
            category = func.category or "custom"
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(func)

        return by_category

    @staticmethod
    async def test_function(
        db: AsyncSession,
        function_id: int,
        test_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Test a transformation function with sample input"""
        function = await TransformationFunctionService.get_function(db, function_id)
        if not function:
            return {"error": "Function not found"}

        try:
            # This is a simplified test - in production, use a sandboxed execution environment
            # For security, validate and sanitize the function code before execution

            # Create a safe execution context
            safe_globals = {
                "__builtins__": {
                    "len": len,
                    "str": str,
                    "int": int,
                    "float": float,
                    "list": list,
                    "dict": dict,
                    "sum": sum,
                    "min": min,
                    "max": max,
                    "sorted": sorted,
                    "enumerate": enumerate,
                    "zip": zip
                }
            }

            # Execute function code
            exec(function.function_code, safe_globals)

            # Get the function from context
            if function.name in safe_globals:
                func = safe_globals[function.name]
                result = func(test_input)

                return {
                    "success": True,
                    "input": test_input,
                    "output": result,
                    "function_name": function.name
                }
            else:
                return {"error": f"Function '{function.name}' not found in code"}

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "function_name": function.name
            }

    @staticmethod
    def get_builtin_functions() -> List[Dict[str, Any]]:
        """Get built-in transformation functions"""
        return [
            {
                "name": "filter_null_values",
                "display_name": "Filter Null Values",
                "description": "Remove records with null values in specified fields",
                "category": "filter",
                "function_type": "python",
                "function_code": """def filter_null_values(data, fields=None):
    \"\"\"Filter out records with null values\"\"\"
    if not fields:
        return [record for record in data if all(v is not None for v in record.values())]
    return [record for record in data if all(record.get(f) is not None for f in fields)]""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "fields", "type": "array", "description": "Fields to check for null", "optional": True}
                ],
                "return_type": "array",
                "example_usage": "filter_null_values(data, ['email', 'phone'])",
                "example_input": {"data": [{"name": "John", "email": "john@test.com"}, {"name": "Jane", "email": None}]},
                "example_output": {"data": [{"name": "John", "email": "john@test.com"}]},
                "is_builtin": True,
                "is_public": True,
                "tags": ["filter", "null", "cleaning"]
            },
            {
                "name": "map_fields",
                "display_name": "Map Fields",
                "description": "Rename or transform fields in records",
                "category": "map",
                "function_type": "python",
                "function_code": """def map_fields(data, field_mapping):
    \"\"\"Map fields from one name to another\"\"\"
    result = []
    for record in data:
        new_record = {}
        for old_key, new_key in field_mapping.items():
            if old_key in record:
                new_record[new_key] = record[old_key]
        result.append(new_record)
    return result""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "field_mapping", "type": "object", "description": "Mapping of old field names to new names"}
                ],
                "return_type": "array",
                "example_usage": "map_fields(data, {'old_name': 'new_name'})",
                "example_input": {"data": [{"old_name": "value"}], "field_mapping": {"old_name": "new_name"}},
                "example_output": {"data": [{"new_name": "value"}]},
                "is_builtin": True,
                "is_public": True,
                "tags": ["map", "rename", "transform"]
            },
            {
                "name": "aggregate_sum",
                "display_name": "Aggregate Sum",
                "description": "Sum values grouped by specified fields",
                "category": "aggregate",
                "function_type": "python",
                "function_code": """def aggregate_sum(data, group_by, sum_field):
    \"\"\"Aggregate data by summing a field\"\"\"
    from collections import defaultdict
    groups = defaultdict(lambda: 0)
    for record in data:
        key = tuple(record.get(f) for f in group_by)
        groups[key] += record.get(sum_field, 0)

    result = []
    for key, total in groups.items():
        record = {group_by[i]: key[i] for i in range(len(group_by))}
        record['total'] = total
        result.append(record)
    return result""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "group_by", "type": "array", "description": "Fields to group by"},
                    {"name": "sum_field", "type": "string", "description": "Field to sum"}
                ],
                "return_type": "array",
                "example_usage": "aggregate_sum(data, ['category'], 'amount')",
                "is_builtin": True,
                "is_public": True,
                "tags": ["aggregate", "sum", "group"]
            },
            {
                "name": "sort_records",
                "display_name": "Sort Records",
                "description": "Sort records by specified field",
                "category": "sort",
                "function_type": "python",
                "function_code": """def sort_records(data, sort_by, reverse=False):
    \"\"\"Sort records by a field\"\"\"
    return sorted(data, key=lambda x: x.get(sort_by, ''), reverse=reverse)""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "sort_by", "type": "string", "description": "Field to sort by"},
                    {"name": "reverse", "type": "boolean", "description": "Sort in descending order", "optional": True}
                ],
                "return_type": "array",
                "example_usage": "sort_records(data, 'created_at', True)",
                "is_builtin": True,
                "is_public": True,
                "tags": ["sort", "order"]
            },
            {
                "name": "limit_records",
                "display_name": "Limit Records",
                "description": "Limit the number of records returned",
                "category": "filter",
                "function_type": "python",
                "function_code": """def limit_records(data, limit, offset=0):
    \"\"\"Limit the number of records\"\"\"
    return data[offset:offset + limit]""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "limit", "type": "number", "description": "Maximum number of records"},
                    {"name": "offset", "type": "number", "description": "Number of records to skip", "optional": True}
                ],
                "return_type": "array",
                "example_usage": "limit_records(data, 100, 0)",
                "is_builtin": True,
                "is_public": True,
                "tags": ["limit", "pagination"]
            },
            {
                "name": "deduplicate",
                "display_name": "Deduplicate Records",
                "description": "Remove duplicate records based on specified fields",
                "category": "filter",
                "function_type": "python",
                "function_code": """def deduplicate(data, unique_fields):
    \"\"\"Remove duplicate records\"\"\"
    seen = set()
    result = []
    for record in data:
        key = tuple(record.get(f) for f in unique_fields)
        if key not in seen:
            seen.add(key)
            result.append(record)
    return result""",
                "parameters": [
                    {"name": "data", "type": "array", "description": "Input data array"},
                    {"name": "unique_fields", "type": "array", "description": "Fields to check for uniqueness"}
                ],
                "return_type": "array",
                "example_usage": "deduplicate(data, ['email'])",
                "is_builtin": True,
                "is_public": True,
                "tags": ["filter", "deduplicate", "unique"]
            }
        ]
