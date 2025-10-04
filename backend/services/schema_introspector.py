"""
Schema Introspection Service
Provides schema discovery for databases, APIs, and files
"""

from typing import Dict, List, Any, Optional, Union
from enum import Enum
import json
import re
from datetime import datetime
from sqlalchemy import create_engine, inspect, MetaData
from sqlalchemy.engine import Engine
import requests


class DataType(str, Enum):
    """Common data types across different sources"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    TIMESTAMP = "timestamp"
    JSON = "json"
    ARRAY = "array"
    OBJECT = "object"
    BINARY = "binary"
    UNKNOWN = "unknown"


class SchemaField:
    """Represents a field in a schema"""

    def __init__(
        self,
        name: str,
        data_type: DataType,
        nullable: bool = True,
        primary_key: bool = False,
        foreign_key: Optional[str] = None,
        default_value: Any = None,
        max_length: Optional[int] = None,
        description: Optional[str] = None,
        constraints: Optional[Dict[str, Any]] = None
    ):
        self.name = name
        self.data_type = data_type
        self.nullable = nullable
        self.primary_key = primary_key
        self.foreign_key = foreign_key
        self.default_value = default_value
        self.max_length = max_length
        self.description = description
        self.constraints = constraints or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert field to dictionary"""
        return {
            "name": self.name,
            "data_type": self.data_type.value,
            "nullable": self.nullable,
            "primary_key": self.primary_key,
            "foreign_key": self.foreign_key,
            "default_value": self.default_value,
            "max_length": self.max_length,
            "description": self.description,
            "constraints": self.constraints
        }


class SchemaTable:
    """Represents a table/collection in a schema"""

    def __init__(
        self,
        name: str,
        fields: List[SchemaField],
        description: Optional[str] = None,
        row_count: Optional[int] = None,
        indexes: Optional[List[Dict[str, Any]]] = None
    ):
        self.name = name
        self.fields = fields
        self.description = description
        self.row_count = row_count
        self.indexes = indexes or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert table to dictionary"""
        return {
            "name": self.name,
            "fields": [field.to_dict() for field in self.fields],
            "description": self.description,
            "row_count": self.row_count,
            "indexes": self.indexes,
            "field_count": len(self.fields)
        }


class DatabaseSchemaIntrospector:
    """Introspect database schemas"""

    @staticmethod
    def _map_sql_type_to_data_type(sql_type: str) -> DataType:
        """Map SQL type to common DataType"""
        sql_type_lower = str(sql_type).lower()

        if any(t in sql_type_lower for t in ['varchar', 'char', 'text', 'string']):
            return DataType.STRING
        elif any(t in sql_type_lower for t in ['int', 'serial', 'bigint', 'smallint']):
            return DataType.INTEGER
        elif any(t in sql_type_lower for t in ['float', 'double', 'decimal', 'numeric', 'real']):
            return DataType.FLOAT
        elif 'bool' in sql_type_lower:
            return DataType.BOOLEAN
        elif 'date' in sql_type_lower and 'time' not in sql_type_lower:
            return DataType.DATE
        elif any(t in sql_type_lower for t in ['datetime', 'timestamp']):
            return DataType.DATETIME
        elif any(t in sql_type_lower for t in ['json', 'jsonb']):
            return DataType.JSON
        elif 'array' in sql_type_lower:
            return DataType.ARRAY
        elif any(t in sql_type_lower for t in ['blob', 'binary', 'bytea']):
            return DataType.BINARY
        else:
            return DataType.UNKNOWN

    @staticmethod
    def introspect_database(
        connection_string: str,
        schema_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Introspect a database schema

        Args:
            connection_string: Database connection string
            schema_name: Optional schema name (for databases that support schemas)

        Returns:
            Dictionary containing schema information
        """
        try:
            engine = create_engine(connection_string)
            inspector = inspect(engine)

            # Get schema name
            schemas = inspector.get_schema_names()
            if schema_name is None:
                schema_name = schemas[0] if schemas else 'public'

            # Get all table names
            table_names = inspector.get_table_names(schema=schema_name)

            tables = []
            for table_name in table_names:
                # Get columns
                columns = inspector.get_columns(table_name, schema=schema_name)

                # Get primary keys
                pk_constraint = inspector.get_pk_constraint(table_name, schema=schema_name)
                primary_keys = pk_constraint.get('constrained_columns', [])

                # Get foreign keys
                fk_constraints = inspector.get_foreign_keys(table_name, schema=schema_name)
                foreign_keys = {
                    fk['constrained_columns'][0]: f"{fk['referred_table']}.{fk['referred_columns'][0]}"
                    for fk in fk_constraints
                    if fk['constrained_columns'] and fk['referred_columns']
                }

                # Get indexes
                indexes = inspector.get_indexes(table_name, schema=schema_name)

                # Build fields
                fields = []
                for column in columns:
                    field = SchemaField(
                        name=column['name'],
                        data_type=DatabaseSchemaIntrospector._map_sql_type_to_data_type(column['type']),
                        nullable=column.get('nullable', True),
                        primary_key=column['name'] in primary_keys,
                        foreign_key=foreign_keys.get(column['name']),
                        default_value=column.get('default'),
                        max_length=getattr(column['type'], 'length', None)
                    )
                    fields.append(field)

                # Create table
                table = SchemaTable(
                    name=table_name,
                    fields=fields,
                    indexes=indexes
                )
                tables.append(table)

            engine.dispose()

            return {
                "source_type": "database",
                "schema_name": schema_name,
                "connection_type": engine.dialect.name,
                "tables": [table.to_dict() for table in tables],
                "table_count": len(tables),
                "introspected_at": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "error": str(e),
                "source_type": "database",
                "introspected_at": datetime.now().isoformat()
            }


class APISchemaIntrospector:
    """Introspect API schemas (REST, GraphQL)"""

    @staticmethod
    def introspect_openapi(
        openapi_url: str,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Introspect OpenAPI/Swagger schema

        Args:
            openapi_url: URL to OpenAPI spec (e.g., /swagger.json, /openapi.json)
            api_key: Optional API key for authentication
        """
        try:
            headers = {}
            if api_key:
                headers['Authorization'] = f'Bearer {api_key}'

            response = requests.get(openapi_url, headers=headers, timeout=10)
            response.raise_for_status()

            spec = response.json()

            # Extract schemas from OpenAPI spec
            schemas = []

            # OpenAPI 3.x
            if 'components' in spec and 'schemas' in spec['components']:
                for schema_name, schema_def in spec['components']['schemas'].items():
                    schemas.append(
                        APISchemaIntrospector._parse_openapi_schema(schema_name, schema_def)
                    )

            # OpenAPI 2.x (Swagger)
            elif 'definitions' in spec:
                for schema_name, schema_def in spec['definitions'].items():
                    schemas.append(
                        APISchemaIntrospector._parse_openapi_schema(schema_name, schema_def)
                    )

            return {
                "source_type": "api",
                "api_type": "openapi",
                "version": spec.get('openapi') or spec.get('swagger'),
                "title": spec.get('info', {}).get('title'),
                "schemas": schemas,
                "schema_count": len(schemas),
                "introspected_at": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "error": str(e),
                "source_type": "api",
                "introspected_at": datetime.now().isoformat()
            }

    @staticmethod
    def _parse_openapi_schema(name: str, schema_def: Dict[str, Any]) -> Dict[str, Any]:
        """Parse OpenAPI schema definition"""
        fields = []

        properties = schema_def.get('properties', {})
        required_fields = schema_def.get('required', [])

        for field_name, field_def in properties.items():
            field_type = field_def.get('type', 'unknown')

            # Map OpenAPI type to DataType
            type_mapping = {
                'string': DataType.STRING,
                'integer': DataType.INTEGER,
                'number': DataType.FLOAT,
                'boolean': DataType.BOOLEAN,
                'array': DataType.ARRAY,
                'object': DataType.OBJECT
            }

            data_type = type_mapping.get(field_type, DataType.UNKNOWN)

            # Handle date/datetime formats
            if field_type == 'string':
                format_type = field_def.get('format')
                if format_type == 'date':
                    data_type = DataType.DATE
                elif format_type in ['date-time', 'datetime']:
                    data_type = DataType.DATETIME

            field = SchemaField(
                name=field_name,
                data_type=data_type,
                nullable=field_name not in required_fields,
                description=field_def.get('description'),
                max_length=field_def.get('maxLength')
            )
            fields.append(field)

        return {
            "name": name,
            "description": schema_def.get('description'),
            "fields": [field.to_dict() for field in fields],
            "field_count": len(fields)
        }

    @staticmethod
    def introspect_json_sample(
        json_data: Union[Dict, List],
        schema_name: str = "sample"
    ) -> Dict[str, Any]:
        """
        Introspect schema from JSON sample data

        Args:
            json_data: Sample JSON data
            schema_name: Name for the schema
        """
        try:
            # Handle array of objects
            if isinstance(json_data, list):
                if json_data and isinstance(json_data[0], dict):
                    json_data = json_data[0]
                else:
                    return {
                        "error": "Array must contain objects",
                        "source_type": "json_sample"
                    }

            fields = []
            for field_name, field_value in json_data.items():
                data_type = APISchemaIntrospector._infer_type_from_value(field_value)

                field = SchemaField(
                    name=field_name,
                    data_type=data_type,
                    nullable=field_value is None
                )
                fields.append(field)

            return {
                "source_type": "json_sample",
                "schema_name": schema_name,
                "fields": [field.to_dict() for field in fields],
                "field_count": len(fields),
                "introspected_at": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "error": str(e),
                "source_type": "json_sample",
                "introspected_at": datetime.now().isoformat()
            }

    @staticmethod
    def _infer_type_from_value(value: Any) -> DataType:
        """Infer DataType from a value"""
        if value is None:
            return DataType.UNKNOWN
        elif isinstance(value, bool):
            return DataType.BOOLEAN
        elif isinstance(value, int):
            return DataType.INTEGER
        elif isinstance(value, float):
            return DataType.FLOAT
        elif isinstance(value, str):
            # Try to detect date/datetime
            if re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                return DataType.DATE
            elif re.match(r'^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}', value):
                return DataType.DATETIME
            return DataType.STRING
        elif isinstance(value, list):
            return DataType.ARRAY
        elif isinstance(value, dict):
            return DataType.OBJECT
        else:
            return DataType.UNKNOWN


class FileSchemaIntrospector:
    """Introspect file schemas (CSV, JSON, Parquet, etc.)"""

    @staticmethod
    def introspect_csv_structure(
        sample_data: str,
        delimiter: str = ',',
        has_header: bool = True
    ) -> Dict[str, Any]:
        """
        Introspect CSV file structure from sample data

        Args:
            sample_data: Sample CSV data (first few lines)
            delimiter: CSV delimiter
            has_header: Whether first row is header
        """
        try:
            import csv
            from io import StringIO

            reader = csv.reader(StringIO(sample_data), delimiter=delimiter)
            rows = list(reader)

            if not rows:
                return {
                    "error": "No data in CSV",
                    "source_type": "csv"
                }

            # Get headers
            if has_header:
                headers = rows[0]
                data_rows = rows[1:]
            else:
                headers = [f"column_{i}" for i in range(len(rows[0]))]
                data_rows = rows

            # Infer types from data
            fields = []
            for i, header in enumerate(headers):
                # Collect values for this column
                values = [row[i] if i < len(row) else None for row in data_rows]

                # Infer type
                data_type = FileSchemaIntrospector._infer_csv_column_type(values)

                field = SchemaField(
                    name=header,
                    data_type=data_type,
                    nullable=any(v is None or v == '' for v in values)
                )
                fields.append(field)

            return {
                "source_type": "csv",
                "delimiter": delimiter,
                "has_header": has_header,
                "fields": [field.to_dict() for field in fields],
                "field_count": len(fields),
                "sample_row_count": len(data_rows),
                "introspected_at": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "error": str(e),
                "source_type": "csv",
                "introspected_at": datetime.now().isoformat()
            }

    @staticmethod
    def _infer_csv_column_type(values: List[Any]) -> DataType:
        """Infer column type from CSV values"""
        # Filter out empty values
        non_empty_values = [v for v in values if v is not None and v != '']

        if not non_empty_values:
            return DataType.STRING

        # Try to detect type from samples
        sample_values = non_empty_values[:10]

        # Try integer
        try:
            all(int(v) for v in sample_values)
            return DataType.INTEGER
        except (ValueError, TypeError):
            pass

        # Try float
        try:
            all(float(v) for v in sample_values)
            return DataType.FLOAT
        except (ValueError, TypeError):
            pass

        # Try boolean
        bool_values = {'true', 'false', '1', '0', 'yes', 'no', 't', 'f'}
        if all(str(v).lower() in bool_values for v in sample_values):
            return DataType.BOOLEAN

        # Try date
        if all(re.match(r'^\d{4}-\d{2}-\d{2}', str(v)) for v in sample_values):
            return DataType.DATE

        # Default to string
        return DataType.STRING


class SchemaComparator:
    """Compare schemas and detect differences"""

    @staticmethod
    def compare_schemas(
        schema1: Dict[str, Any],
        schema2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare two schemas and return differences

        Args:
            schema1: First schema
            schema2: Second schema

        Returns:
            Dictionary with comparison results
        """
        comparison = {
            "schemas_match": False,
            "added_fields": [],
            "removed_fields": [],
            "modified_fields": [],
            "type_changes": [],
            "compared_at": datetime.now().isoformat()
        }

        # Extract fields from schemas
        fields1 = {f['name']: f for f in schema1.get('fields', [])}
        fields2 = {f['name']: f for f in schema2.get('fields', [])}

        # Find added fields
        comparison["added_fields"] = [
            name for name in fields2.keys() if name not in fields1
        ]

        # Find removed fields
        comparison["removed_fields"] = [
            name for name in fields1.keys() if name not in fields2
        ]

        # Find modified fields
        for name in set(fields1.keys()) & set(fields2.keys()):
            field1 = fields1[name]
            field2 = fields2[name]

            if field1['data_type'] != field2['data_type']:
                comparison["type_changes"].append({
                    "field": name,
                    "old_type": field1['data_type'],
                    "new_type": field2['data_type']
                })

            # Check for other modifications
            modifications = {}
            if field1.get('nullable') != field2.get('nullable'):
                modifications['nullable'] = {
                    'old': field1.get('nullable'),
                    'new': field2.get('nullable')
                }
            if field1.get('max_length') != field2.get('max_length'):
                modifications['max_length'] = {
                    'old': field1.get('max_length'),
                    'new': field2.get('max_length')
                }

            if modifications:
                comparison["modified_fields"].append({
                    "field": name,
                    "modifications": modifications
                })

        # Determine if schemas match
        comparison["schemas_match"] = (
            len(comparison["added_fields"]) == 0 and
            len(comparison["removed_fields"]) == 0 and
            len(comparison["modified_fields"]) == 0 and
            len(comparison["type_changes"]) == 0
        )

        return comparison

    @staticmethod
    def calculate_compatibility_score(comparison: Dict[str, Any]) -> float:
        """
        Calculate compatibility score between schemas (0-100)

        Args:
            comparison: Result from compare_schemas

        Returns:
            Compatibility score (0-100)
        """
        if comparison["schemas_match"]:
            return 100.0

        # Calculate penalties
        added_penalty = len(comparison["added_fields"]) * 5
        removed_penalty = len(comparison["removed_fields"]) * 10
        modified_penalty = len(comparison["modified_fields"]) * 7
        type_change_penalty = len(comparison["type_changes"]) * 15

        total_penalty = added_penalty + removed_penalty + modified_penalty + type_change_penalty

        score = max(0, 100 - total_penalty)
        return round(score, 2)
