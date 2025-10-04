"""
Schema Mapping Service
Provides field mapping storage, transformation rule generation, and mapping validation
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from enum import Enum
import json


class MappingType(str, Enum):
    """Types of field mappings"""
    DIRECT = "direct"  # Direct field-to-field mapping
    TRANSFORM = "transform"  # Mapping with transformation
    CONCAT = "concat"  # Concatenate multiple fields
    SPLIT = "split"  # Split one field into multiple
    CONSTANT = "constant"  # Map to constant value
    CALCULATED = "calculated"  # Calculate from multiple fields
    CONDITIONAL = "conditional"  # Conditional mapping


class TransformationType(str, Enum):
    """Types of transformations"""
    UPPERCASE = "uppercase"
    LOWERCASE = "lowercase"
    TRIM = "trim"
    SUBSTRING = "substring"
    REPLACE = "replace"
    CAST = "cast"
    FORMAT_DATE = "format_date"
    MATH_OPERATION = "math_operation"
    REGEX_EXTRACT = "regex_extract"
    CUSTOM = "custom"


class FieldMapping:
    """Represents a mapping between source and destination fields"""

    def __init__(
        self,
        source_field: Optional[str] = None,
        destination_field: str = None,
        mapping_type: MappingType = MappingType.DIRECT,
        transformation: Optional[Dict[str, Any]] = None,
        condition: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None
    ):
        self.source_field = source_field
        self.destination_field = destination_field
        self.mapping_type = mapping_type
        self.transformation = transformation or {}
        self.condition = condition
        self.description = description

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "source_field": self.source_field,
            "destination_field": self.destination_field,
            "mapping_type": self.mapping_type.value,
            "transformation": self.transformation,
            "condition": self.condition,
            "description": self.description
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'FieldMapping':
        """Create from dictionary"""
        return FieldMapping(
            source_field=data.get("source_field"),
            destination_field=data.get("destination_field"),
            mapping_type=MappingType(data.get("mapping_type", "direct")),
            transformation=data.get("transformation"),
            condition=data.get("condition"),
            description=data.get("description")
        )


class SchemaMapping:
    """Complete mapping between source and destination schemas"""

    def __init__(
        self,
        mapping_id: Optional[str] = None,
        name: str = None,
        source_schema: Dict[str, Any] = None,
        destination_schema: Dict[str, Any] = None,
        field_mappings: List[FieldMapping] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.mapping_id = mapping_id or self._generate_id()
        self.name = name
        self.source_schema = source_schema
        self.destination_schema = destination_schema
        self.field_mappings = field_mappings or []
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def _generate_id(self) -> str:
        """Generate unique mapping ID"""
        return f"mapping_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"

    def add_mapping(self, field_mapping: FieldMapping):
        """Add a field mapping"""
        self.field_mappings.append(field_mapping)
        self.updated_at = datetime.now()

    def remove_mapping(self, destination_field: str) -> bool:
        """Remove a field mapping"""
        original_length = len(self.field_mappings)
        self.field_mappings = [
            m for m in self.field_mappings
            if m.destination_field != destination_field
        ]
        if len(self.field_mappings) < original_length:
            self.updated_at = datetime.now()
            return True
        return False

    def get_mapping(self, destination_field: str) -> Optional[FieldMapping]:
        """Get mapping for a destination field"""
        for mapping in self.field_mappings:
            if mapping.destination_field == destination_field:
                return mapping
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "mapping_id": self.mapping_id,
            "name": self.name,
            "source_schema": self.source_schema,
            "destination_schema": self.destination_schema,
            "field_mappings": [m.to_dict() for m in self.field_mappings],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class MappingGenerator:
    """Generate mappings automatically based on schema analysis"""

    @staticmethod
    def auto_generate_mappings(
        source_schema: Dict[str, Any],
        destination_schema: Dict[str, Any]
    ) -> List[FieldMapping]:
        """
        Automatically generate field mappings based on field names and types

        Args:
            source_schema: Source schema with fields
            destination_schema: Destination schema with fields

        Returns:
            List of suggested field mappings
        """
        mappings = []

        source_fields = {f['name']: f for f in source_schema.get('fields', [])}
        dest_fields = {f['name']: f for f in destination_schema.get('fields', [])}

        for dest_name, dest_field in dest_fields.items():
            # Try exact name match
            if dest_name in source_fields:
                mapping = MappingGenerator._create_mapping_with_type_check(
                    dest_name,
                    dest_name,
                    source_fields[dest_name],
                    dest_field
                )
                mappings.append(mapping)
                continue

            # Try case-insensitive match
            lower_dest_name = dest_name.lower()
            for source_name, source_field in source_fields.items():
                if source_name.lower() == lower_dest_name:
                    mapping = MappingGenerator._create_mapping_with_type_check(
                        source_name,
                        dest_name,
                        source_field,
                        dest_field
                    )
                    mappings.append(mapping)
                    break
            else:
                # Try fuzzy matching (similar names)
                best_match = MappingGenerator._find_similar_field(
                    dest_name,
                    list(source_fields.keys())
                )
                if best_match and MappingGenerator._similarity_score(dest_name, best_match) > 0.7:
                    mapping = MappingGenerator._create_mapping_with_type_check(
                        best_match,
                        dest_name,
                        source_fields[best_match],
                        dest_field
                    )
                    mappings.append(mapping)

        return mappings

    @staticmethod
    def _create_mapping_with_type_check(
        source_name: str,
        dest_name: str,
        source_field: Dict[str, Any],
        dest_field: Dict[str, Any]
    ) -> FieldMapping:
        """Create mapping with type compatibility check"""
        source_type = source_field.get('data_type')
        dest_type = dest_field.get('data_type')

        # Check if types are compatible
        if source_type == dest_type:
            return FieldMapping(
                source_field=source_name,
                destination_field=dest_name,
                mapping_type=MappingType.DIRECT,
                description=f"Direct mapping: {source_name} -> {dest_name}"
            )
        else:
            # Types don't match, need transformation
            transformation = MappingGenerator._suggest_transformation(
                source_type,
                dest_type
            )
            return FieldMapping(
                source_field=source_name,
                destination_field=dest_name,
                mapping_type=MappingType.TRANSFORM,
                transformation=transformation,
                description=f"Type conversion: {source_type} -> {dest_type}"
            )

    @staticmethod
    def _suggest_transformation(
        source_type: str,
        dest_type: str
    ) -> Dict[str, Any]:
        """Suggest transformation based on type mismatch"""
        transformation = {
            "type": TransformationType.CAST.value,
            "from_type": source_type,
            "to_type": dest_type
        }

        # Add specific transformation hints
        if source_type == "string" and dest_type == "integer":
            transformation["function"] = "int"
        elif source_type == "string" and dest_type == "float":
            transformation["function"] = "float"
        elif source_type in ["integer", "float"] and dest_type == "string":
            transformation["function"] = "str"
        elif source_type == "string" and dest_type == "datetime":
            transformation["type"] = TransformationType.FORMAT_DATE.value
            transformation["format"] = "auto-detect"

        return transformation

    @staticmethod
    def _find_similar_field(target: str, candidates: List[str]) -> Optional[str]:
        """Find most similar field name"""
        if not candidates:
            return None

        # Simple similarity based on character overlap
        best_match = None
        best_score = 0

        for candidate in candidates:
            score = MappingGenerator._similarity_score(target, candidate)
            if score > best_score:
                best_score = score
                best_match = candidate

        return best_match if best_score > 0.5 else None

    @staticmethod
    def _similarity_score(str1: str, str2: str) -> float:
        """Calculate similarity score between two strings (0-1)"""
        str1 = str1.lower()
        str2 = str2.lower()

        if str1 == str2:
            return 1.0

        # Levenshtein-like simple scoring
        max_len = max(len(str1), len(str2))
        if max_len == 0:
            return 1.0

        # Count matching characters in order
        matches = 0
        i = j = 0
        while i < len(str1) and j < len(str2):
            if str1[i] == str2[j]:
                matches += 1
                i += 1
                j += 1
            else:
                i += 1

        return matches / max_len


class MappingValidator:
    """Validate schema mappings"""

    @staticmethod
    def validate_mapping(
        schema_mapping: SchemaMapping
    ) -> Tuple[bool, List[str]]:
        """
        Validate a schema mapping

        Args:
            schema_mapping: SchemaMapping to validate

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Check if all required destination fields are mapped
        dest_fields = schema_mapping.destination_schema.get('fields', [])
        dest_required_fields = [
            f['name'] for f in dest_fields
            if not f.get('nullable', True)
        ]

        mapped_dest_fields = {
            m.destination_field for m in schema_mapping.field_mappings
        }

        for required_field in dest_required_fields:
            if required_field not in mapped_dest_fields:
                errors.append(f"Required destination field '{required_field}' is not mapped")

        # Validate each field mapping
        source_field_names = {
            f['name'] for f in schema_mapping.source_schema.get('fields', [])
        }

        for mapping in schema_mapping.field_mappings:
            # Check if source field exists (for non-constant mappings)
            if mapping.mapping_type != MappingType.CONSTANT:
                if mapping.source_field and mapping.source_field not in source_field_names:
                    errors.append(
                        f"Source field '{mapping.source_field}' does not exist in source schema"
                    )

            # Validate transformation if present
            if mapping.transformation:
                validation_result = MappingValidator._validate_transformation(
                    mapping.transformation
                )
                if not validation_result[0]:
                    errors.append(
                        f"Invalid transformation for field '{mapping.destination_field}': {validation_result[1]}"
                    )

        is_valid = len(errors) == 0
        return is_valid, errors

    @staticmethod
    def _validate_transformation(transformation: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate a transformation configuration"""
        if not transformation:
            return True, ""

        # Check required fields
        if 'type' not in transformation:
            return False, "Transformation type is required"

        trans_type = transformation['type']

        # Validate specific transformation types
        if trans_type == TransformationType.CAST.value:
            if 'to_type' not in transformation:
                return False, "Cast transformation requires 'to_type'"

        elif trans_type == TransformationType.SUBSTRING.value:
            if 'start' not in transformation:
                return False, "Substring transformation requires 'start' parameter"

        elif trans_type == TransformationType.REPLACE.value:
            if 'old' not in transformation or 'new' not in transformation:
                return False, "Replace transformation requires 'old' and 'new' parameters"

        return True, ""


class MappingTemplateManager:
    """Manage reusable mapping templates"""

    def __init__(self):
        self.templates: Dict[str, Dict[str, Any]] = {}

    def create_template(
        self,
        template_name: str,
        source_type: str,
        destination_type: str,
        field_mappings: List[FieldMapping],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a reusable mapping template"""
        template = {
            "name": template_name,
            "source_type": source_type,
            "destination_type": destination_type,
            "field_mappings": [m.to_dict() for m in field_mappings],
            "description": description,
            "created_at": datetime.now().isoformat()
        }

        self.templates[template_name] = template
        return template

    def get_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        """Get a mapping template"""
        return self.templates.get(template_name)

    def list_templates(self) -> List[Dict[str, Any]]:
        """List all templates"""
        return list(self.templates.values())

    def apply_template(
        self,
        template_name: str,
        source_schema: Dict[str, Any],
        destination_schema: Dict[str, Any]
    ) -> Optional[SchemaMapping]:
        """Apply a template to create a new schema mapping"""
        template = self.get_template(template_name)
        if not template:
            return None

        # Create field mappings from template
        field_mappings = [
            FieldMapping.from_dict(m)
            for m in template['field_mappings']
        ]

        schema_mapping = SchemaMapping(
            name=f"{template_name}_mapping",
            source_schema=source_schema,
            destination_schema=destination_schema,
            field_mappings=field_mappings
        )

        return schema_mapping


class TransformationRuleGenerator:
    """Generate transformation rules from mappings"""

    @staticmethod
    def generate_python_code(schema_mapping: SchemaMapping) -> str:
        """
        Generate Python code for transformation

        Args:
            schema_mapping: SchemaMapping with field mappings

        Returns:
            Python code as string
        """
        code_lines = [
            "def transform_data(source_record: dict) -> dict:",
            "    \"\"\"Transform source record to destination format\"\"\"",
            "    destination_record = {}",
            ""
        ]

        for mapping in schema_mapping.field_mappings:
            if mapping.mapping_type == MappingType.DIRECT:
                code_lines.append(
                    f"    destination_record['{mapping.destination_field}'] = "
                    f"source_record.get('{mapping.source_field}')"
                )

            elif mapping.mapping_type == MappingType.TRANSFORM:
                transform_code = TransformationRuleGenerator._generate_transform_code(
                    mapping.source_field,
                    mapping.destination_field,
                    mapping.transformation
                )
                code_lines.append(f"    {transform_code}")

            elif mapping.mapping_type == MappingType.CONSTANT:
                const_value = mapping.transformation.get('value', 'None')
                code_lines.append(
                    f"    destination_record['{mapping.destination_field}'] = {repr(const_value)}"
                )

        code_lines.append("")
        code_lines.append("    return destination_record")

        return "\n".join(code_lines)

    @staticmethod
    def _generate_transform_code(
        source_field: str,
        dest_field: str,
        transformation: Dict[str, Any]
    ) -> str:
        """Generate transformation code for a specific field"""
        trans_type = transformation.get('type')
        source_ref = f"source_record.get('{source_field}')"

        if trans_type == TransformationType.UPPERCASE.value:
            return f"destination_record['{dest_field}'] = {source_ref}.upper() if {source_ref} else None"

        elif trans_type == TransformationType.LOWERCASE.value:
            return f"destination_record['{dest_field}'] = {source_ref}.lower() if {source_ref} else None"

        elif trans_type == TransformationType.CAST.value:
            to_type = transformation.get('to_type', 'str')
            func = transformation.get('function', to_type)
            return f"destination_record['{dest_field}'] = {func}({source_ref}) if {source_ref} is not None else None"

        elif trans_type == TransformationType.TRIM.value:
            return f"destination_record['{dest_field}'] = {source_ref}.strip() if {source_ref} else None"

        else:
            return f"destination_record['{dest_field}'] = {source_ref}  # TODO: Implement {trans_type}"

    @staticmethod
    def generate_sql_mapping(schema_mapping: SchemaMapping, table_alias: str = "src") -> str:
        """
        Generate SQL SELECT statement for transformation

        Args:
            schema_mapping: SchemaMapping with field mappings
            table_alias: Alias for source table

        Returns:
            SQL SELECT clause
        """
        select_clauses = []

        for mapping in schema_mapping.field_mappings:
            if mapping.mapping_type == MappingType.DIRECT:
                select_clauses.append(
                    f"{table_alias}.{mapping.source_field} AS {mapping.destination_field}"
                )

            elif mapping.mapping_type == MappingType.TRANSFORM:
                trans_clause = TransformationRuleGenerator._generate_sql_transform(
                    mapping.source_field,
                    mapping.destination_field,
                    mapping.transformation,
                    table_alias
                )
                select_clauses.append(trans_clause)

            elif mapping.mapping_type == MappingType.CONSTANT:
                const_value = mapping.transformation.get('value', 'NULL')
                select_clauses.append(
                    f"'{const_value}' AS {mapping.destination_field}"
                )

        return "SELECT\n    " + ",\n    ".join(select_clauses)

    @staticmethod
    def _generate_sql_transform(
        source_field: str,
        dest_field: str,
        transformation: Dict[str, Any],
        table_alias: str
    ) -> str:
        """Generate SQL transformation for a field"""
        trans_type = transformation.get('type')
        source_ref = f"{table_alias}.{source_field}"

        if trans_type == TransformationType.UPPERCASE.value:
            return f"UPPER({source_ref}) AS {dest_field}"

        elif trans_type == TransformationType.LOWERCASE.value:
            return f"LOWER({source_ref}) AS {dest_field}"

        elif trans_type == TransformationType.CAST.value:
            to_type = transformation.get('to_type', 'TEXT')
            return f"CAST({source_ref} AS {to_type.upper()}) AS {dest_field}"

        elif trans_type == TransformationType.TRIM.value:
            return f"TRIM({source_ref}) AS {dest_field}"

        else:
            return f"{source_ref} AS {dest_field}  -- TODO: Implement {trans_type}"
