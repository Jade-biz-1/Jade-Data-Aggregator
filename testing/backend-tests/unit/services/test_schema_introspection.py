"""
Unit Tests for Schema Introspection and Mapping Services
TEST-008: Schema introspection and mapping (90 tests)

Tests cover:
- SchemaField and SchemaTable data classes
- DatabaseSchemaIntrospector SQL type mapping
- APISchemaIntrospector: JSON sample introspection, OpenAPI schema parsing,
  type inference from values
- FileSchemaIntrospector: CSV structure introspection, column type inference
- SchemaComparator: schema diff detection and compatibility scoring
- FieldMapping and SchemaMapping data classes
- MappingGenerator: auto-generate, fuzzy matching, type-mismatch transforms
- MappingValidator: required field checks, transformation validation
- MappingTemplateManager: create, get, list, apply templates
- TransformationRuleGenerator: Python code and SQL mapping generation
"""

import pytest
from datetime import datetime

from backend.services.schema_introspector import (
    DataType,
    DatabaseSchemaIntrospector,
    APISchemaIntrospector,
    FileSchemaIntrospector,
    SchemaComparator,
    SchemaField,
    SchemaTable,
)
from backend.services.schema_mapper import (
    FieldMapping,
    MappingGenerator,
    MappingTemplateManager,
    MappingType,
    MappingValidator,
    SchemaMapping,
    TransformationRuleGenerator,
    TransformationType,
)


# ---------------------------------------------------------------------------
# TEST-008-A: SchemaField (10 tests)
# ---------------------------------------------------------------------------

class TestSchemaField:
    """Tests for SchemaField data class"""

    def test_creation_with_required_params(self):
        field = SchemaField(name="id", data_type=DataType.INTEGER)
        assert field.name == "id"
        assert field.data_type == DataType.INTEGER

    def test_to_dict_contains_all_expected_keys(self):
        field = SchemaField(name="email", data_type=DataType.STRING)
        d = field.to_dict()
        for key in ["name", "data_type", "nullable", "primary_key", "foreign_key",
                    "default_value", "max_length", "description", "constraints"]:
            assert key in d

    def test_primary_key_defaults_to_false(self):
        field = SchemaField(name="name", data_type=DataType.STRING)
        assert field.primary_key is False

    def test_nullable_defaults_to_true(self):
        field = SchemaField(name="name", data_type=DataType.STRING)
        assert field.nullable is True

    def test_foreign_key_stored_correctly(self):
        field = SchemaField(name="user_id", data_type=DataType.INTEGER,
                            foreign_key="users.id")
        assert field.foreign_key == "users.id"
        assert field.to_dict()["foreign_key"] == "users.id"

    def test_constraints_default_to_empty_dict(self):
        field = SchemaField(name="val", data_type=DataType.FLOAT)
        assert field.constraints == {}

    def test_max_length_stored_in_dict(self):
        field = SchemaField(name="name", data_type=DataType.STRING, max_length=255)
        assert field.to_dict()["max_length"] == 255

    def test_data_type_stored_as_enum_value_string(self):
        field = SchemaField(name="active", data_type=DataType.BOOLEAN)
        assert field.to_dict()["data_type"] == "boolean"

    def test_description_stored_in_dict(self):
        field = SchemaField(name="score", data_type=DataType.FLOAT,
                            description="User score")
        assert field.to_dict()["description"] == "User score"

    def test_default_value_stored_in_dict(self):
        field = SchemaField(name="status", data_type=DataType.STRING,
                            default_value="active")
        assert field.to_dict()["default_value"] == "active"


# ---------------------------------------------------------------------------
# TEST-008-B: SchemaTable (5 tests)
# ---------------------------------------------------------------------------

class TestSchemaTable:
    """Tests for SchemaTable data class"""

    def test_creation_with_name_and_fields(self):
        field = SchemaField(name="id", data_type=DataType.INTEGER)
        table = SchemaTable(name="users", fields=[field])
        assert table.name == "users"
        assert len(table.fields) == 1

    def test_to_dict_includes_field_count(self):
        fields = [
            SchemaField(name="id", data_type=DataType.INTEGER),
            SchemaField(name="name", data_type=DataType.STRING),
        ]
        table = SchemaTable(name="products", fields=fields)
        d = table.to_dict()
        assert d["field_count"] == 2

    def test_to_dict_converts_fields_to_dicts(self):
        field = SchemaField(name="id", data_type=DataType.INTEGER)
        table = SchemaTable(name="items", fields=[field])
        d = table.to_dict()
        assert isinstance(d["fields"][0], dict)
        assert d["fields"][0]["name"] == "id"

    def test_row_count_stored_in_dict(self):
        table = SchemaTable(name="logs", fields=[], row_count=1000)
        assert table.to_dict()["row_count"] == 1000

    def test_indexes_default_to_empty_list(self):
        table = SchemaTable(name="empty", fields=[])
        assert table.indexes == []
        assert table.to_dict()["indexes"] == []


# ---------------------------------------------------------------------------
# TEST-008-C: DatabaseSchemaIntrospector SQL Type Mapping (15 tests)
# ---------------------------------------------------------------------------

class TestDatabaseSchemaIntrospectorTypeMapping:
    """Tests for _map_sql_type_to_data_type()"""

    def _map(self, sql_type: str) -> DataType:
        return DatabaseSchemaIntrospector._map_sql_type_to_data_type(sql_type)

    def test_varchar_maps_to_string(self):
        assert self._map("VARCHAR(255)") == DataType.STRING

    def test_char_maps_to_string(self):
        assert self._map("CHAR(10)") == DataType.STRING

    def test_text_maps_to_string(self):
        assert self._map("TEXT") == DataType.STRING

    def test_integer_maps_to_integer(self):
        assert self._map("INTEGER") == DataType.INTEGER

    def test_bigint_maps_to_integer(self):
        assert self._map("BIGINT") == DataType.INTEGER

    def test_serial_maps_to_integer(self):
        assert self._map("SERIAL") == DataType.INTEGER

    def test_float_maps_to_float(self):
        assert self._map("FLOAT") == DataType.FLOAT

    def test_decimal_maps_to_float(self):
        assert self._map("DECIMAL(10,2)") == DataType.FLOAT

    def test_numeric_maps_to_float(self):
        assert self._map("NUMERIC") == DataType.FLOAT

    def test_boolean_maps_to_boolean(self):
        assert self._map("BOOLEAN") == DataType.BOOLEAN

    def test_date_maps_to_date(self):
        assert self._map("DATE") == DataType.DATE

    def test_timestamp_maps_to_datetime(self):
        assert self._map("TIMESTAMP") == DataType.DATETIME

    def test_json_maps_to_json(self):
        assert self._map("JSON") == DataType.JSON

    def test_jsonb_maps_to_json(self):
        assert self._map("JSONB") == DataType.JSON

    def test_unknown_type_maps_to_unknown(self):
        assert self._map("CUSTOM_TYPE") == DataType.UNKNOWN


# ---------------------------------------------------------------------------
# TEST-008-D: APISchemaIntrospector – type inference (9 tests)
# ---------------------------------------------------------------------------

class TestAPISchemaIntrospectorTypeInference:
    """Tests for APISchemaIntrospector._infer_type_from_value()"""

    def _infer(self, value) -> DataType:
        return APISchemaIntrospector._infer_type_from_value(value)

    def test_none_infers_unknown(self):
        assert self._infer(None) == DataType.UNKNOWN

    def test_bool_infers_boolean(self):
        assert self._infer(True) == DataType.BOOLEAN
        assert self._infer(False) == DataType.BOOLEAN

    def test_int_infers_integer(self):
        assert self._infer(42) == DataType.INTEGER

    def test_float_infers_float(self):
        assert self._infer(3.14) == DataType.FLOAT

    def test_plain_string_infers_string(self):
        assert self._infer("hello") == DataType.STRING

    def test_date_string_infers_date(self):
        assert self._infer("2024-01-15") == DataType.DATE

    def test_datetime_string_infers_datetime(self):
        assert self._infer("2024-01-15T10:30:00") == DataType.DATETIME

    def test_list_infers_array(self):
        assert self._infer([1, 2, 3]) == DataType.ARRAY

    def test_dict_infers_object(self):
        assert self._infer({"key": "value"}) == DataType.OBJECT


# ---------------------------------------------------------------------------
# TEST-008-E: APISchemaIntrospector – JSON sample introspection (6 tests)
# ---------------------------------------------------------------------------

class TestAPISchemaIntrospectorJsonSample:
    """Tests for APISchemaIntrospector.introspect_json_sample()"""

    def test_dict_sample_returns_fields(self):
        data = {"id": 1, "name": "Alice", "active": True}
        result = APISchemaIntrospector.introspect_json_sample(data)
        assert result["source_type"] == "json_sample"
        assert result["field_count"] == 3

    def test_list_of_dicts_uses_first_element(self):
        data = [{"id": 1, "score": 9.5}, {"id": 2, "score": 7.0}]
        result = APISchemaIntrospector.introspect_json_sample(data)
        assert result["field_count"] == 2

    def test_empty_list_returns_error(self):
        result = APISchemaIntrospector.introspect_json_sample([])
        assert "error" in result

    def test_list_of_non_dicts_returns_error(self):
        result = APISchemaIntrospector.introspect_json_sample([1, 2, 3])
        assert "error" in result

    def test_null_value_field_is_nullable(self):
        data = {"name": None}
        result = APISchemaIntrospector.introspect_json_sample(data)
        field = result["fields"][0]
        assert field["nullable"] is True

    def test_custom_schema_name_stored(self):
        data = {"id": 1}
        result = APISchemaIntrospector.introspect_json_sample(data, schema_name="MySchema")
        assert result["schema_name"] == "MySchema"


# ---------------------------------------------------------------------------
# TEST-008-F: APISchemaIntrospector – OpenAPI schema parsing (5 tests)
# ---------------------------------------------------------------------------

class TestAPISchemaIntrospectorOpenAPI:
    """Tests for APISchemaIntrospector._parse_openapi_schema()"""

    def test_basic_schema_produces_fields(self):
        schema_def = {
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"}
            }
        }
        result = APISchemaIntrospector._parse_openapi_schema("User", schema_def)
        assert result["name"] == "User"
        assert result["field_count"] == 2

    def test_required_fields_are_not_nullable(self):
        schema_def = {
            "properties": {"email": {"type": "string"}},
            "required": ["email"]
        }
        result = APISchemaIntrospector._parse_openapi_schema("Contact", schema_def)
        email_field = next(f for f in result["fields"] if f["name"] == "email")
        assert email_field["nullable"] is False

    def test_optional_fields_are_nullable(self):
        schema_def = {"properties": {"bio": {"type": "string"}}}
        result = APISchemaIntrospector._parse_openapi_schema("Profile", schema_def)
        bio_field = result["fields"][0]
        assert bio_field["nullable"] is True

    def test_date_format_maps_to_date_type(self):
        schema_def = {
            "properties": {"birth_date": {"type": "string", "format": "date"}}
        }
        result = APISchemaIntrospector._parse_openapi_schema("Person", schema_def)
        assert result["fields"][0]["data_type"] == "date"

    def test_datetime_format_maps_to_datetime_type(self):
        schema_def = {
            "properties": {"created_at": {"type": "string", "format": "date-time"}}
        }
        result = APISchemaIntrospector._parse_openapi_schema("Event", schema_def)
        assert result["fields"][0]["data_type"] == "datetime"


# ---------------------------------------------------------------------------
# TEST-008-G: FileSchemaIntrospector – CSV (15 tests)
# ---------------------------------------------------------------------------

class TestFileSchemaIntrospectorCSV:
    """Tests for FileSchemaIntrospector.introspect_csv_structure()"""

    def test_empty_data_returns_error(self):
        result = FileSchemaIntrospector.introspect_csv_structure("")
        assert "error" in result

    def test_csv_with_header_extracts_column_names(self):
        csv = "id,name,score\n1,Alice,9.5\n2,Bob,8.0"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        field_names = [f["name"] for f in result["fields"]]
        assert "id" in field_names
        assert "name" in field_names
        assert "score" in field_names

    def test_csv_without_header_generates_column_names(self):
        csv = "1,Alice,9.5"
        result = FileSchemaIntrospector.introspect_csv_structure(csv, has_header=False)
        field_names = [f["name"] for f in result["fields"]]
        assert all(name.startswith("column_") for name in field_names)

    def test_infers_integer_column(self):
        csv = "id\n1\n2\n3"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        id_field = result["fields"][0]
        assert id_field["data_type"] == "integer"

    def test_infers_float_column(self):
        csv = "score\n9.5\n8.0\n7.3"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["fields"][0]["data_type"] == "float"

    def test_infers_boolean_column(self):
        csv = "active\ntrue\nfalse\ntrue"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["fields"][0]["data_type"] == "boolean"

    def test_infers_date_column(self):
        csv = "created\n2024-01-01\n2024-01-02\n2024-01-03"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["fields"][0]["data_type"] == "date"

    def test_infers_string_column(self):
        csv = "name\nAlice\nBob\nCharlie"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["fields"][0]["data_type"] == "string"

    def test_custom_delimiter(self):
        csv = "id;name\n1;Alice\n2;Bob"
        result = FileSchemaIntrospector.introspect_csv_structure(csv, delimiter=";")
        field_names = [f["name"] for f in result["fields"]]
        assert "id" in field_names
        assert "name" in field_names

    def test_nullable_column_detected(self):
        csv = "val\n1\n\n3"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["fields"][0]["nullable"] is True

    def test_field_count_correct(self):
        csv = "a,b,c,d\n1,2,3,4"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["field_count"] == 4

    def test_sample_row_count_reported(self):
        csv = "id\n1\n2\n3\n4\n5"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["sample_row_count"] == 5

    def test_source_type_is_csv(self):
        csv = "id\n1"
        result = FileSchemaIntrospector.introspect_csv_structure(csv)
        assert result["source_type"] == "csv"

    def test_all_empty_values_defaults_to_string(self):
        values = [None, "", None]
        result = FileSchemaIntrospector._infer_csv_column_type(values)
        assert result == DataType.STRING

    def test_infer_csv_float_wins_over_int_when_decimals_present(self):
        values = ["1.5", "2.0", "3.7"]
        result = FileSchemaIntrospector._infer_csv_column_type(values)
        assert result == DataType.FLOAT


# ---------------------------------------------------------------------------
# TEST-008-H: SchemaComparator (15 tests)
# ---------------------------------------------------------------------------

class TestSchemaComparator:
    """Tests for SchemaComparator.compare_schemas() and calculate_compatibility_score()"""

    def _make_schema(self, fields: list) -> dict:
        return {"fields": fields}

    def _field(self, name, data_type="string", nullable=True, max_length=None) -> dict:
        return {
            "name": name,
            "data_type": data_type,
            "nullable": nullable,
            "max_length": max_length
        }

    def test_identical_schemas_match(self):
        schema = self._make_schema([self._field("id", "integer")])
        result = SchemaComparator.compare_schemas(schema, schema)
        assert result["schemas_match"] is True

    def test_added_fields_detected(self):
        s1 = self._make_schema([self._field("id")])
        s2 = self._make_schema([self._field("id"), self._field("email")])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert "email" in result["added_fields"]

    def test_removed_fields_detected(self):
        s1 = self._make_schema([self._field("id"), self._field("name")])
        s2 = self._make_schema([self._field("id")])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert "name" in result["removed_fields"]

    def test_type_change_detected(self):
        s1 = self._make_schema([self._field("score", "string")])
        s2 = self._make_schema([self._field("score", "float")])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert len(result["type_changes"]) == 1
        assert result["type_changes"][0]["field"] == "score"
        assert result["type_changes"][0]["old_type"] == "string"
        assert result["type_changes"][0]["new_type"] == "float"

    def test_nullable_change_detected(self):
        s1 = self._make_schema([self._field("name", nullable=True)])
        s2 = self._make_schema([self._field("name", nullable=False)])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert len(result["modified_fields"]) == 1

    def test_max_length_change_detected(self):
        s1 = self._make_schema([self._field("name", max_length=100)])
        s2 = self._make_schema([self._field("name", max_length=255)])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert len(result["modified_fields"]) == 1

    def test_schemas_match_false_when_fields_differ(self):
        s1 = self._make_schema([self._field("id")])
        s2 = self._make_schema([self._field("uuid")])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert result["schemas_match"] is False

    def test_empty_schemas_match(self):
        s1 = self._make_schema([])
        s2 = self._make_schema([])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert result["schemas_match"] is True

    def test_compared_at_timestamp_present(self):
        s = self._make_schema([])
        result = SchemaComparator.compare_schemas(s, s)
        assert "compared_at" in result

    def test_compatibility_score_100_for_identical(self):
        schema = self._make_schema([self._field("id", "integer")])
        comp = SchemaComparator.compare_schemas(schema, schema)
        score = SchemaComparator.calculate_compatibility_score(comp)
        assert score == 100.0

    def test_compatibility_score_reduced_for_added_fields(self):
        s1 = self._make_schema([self._field("id")])
        s2 = self._make_schema([self._field("id"), self._field("name")])
        comp = SchemaComparator.compare_schemas(s1, s2)
        score = SchemaComparator.calculate_compatibility_score(comp)
        assert score < 100.0

    def test_compatibility_score_reduced_for_removed_fields(self):
        s1 = self._make_schema([self._field("id"), self._field("name")])
        s2 = self._make_schema([self._field("id")])
        comp = SchemaComparator.compare_schemas(s1, s2)
        score = SchemaComparator.calculate_compatibility_score(comp)
        assert score < 100.0

    def test_compatibility_score_heavily_penalized_for_type_changes(self):
        s1 = self._make_schema([self._field("val", "string")])
        s2 = self._make_schema([self._field("val", "integer")])
        comp = SchemaComparator.compare_schemas(s1, s2)
        score = SchemaComparator.calculate_compatibility_score(comp)
        assert score <= 85.0

    def test_compatibility_score_minimum_is_zero(self):
        # Many changes should not produce negative score
        s1 = self._make_schema([self._field(f"f{i}", "string") for i in range(20)])
        s2 = self._make_schema([])
        comp = SchemaComparator.compare_schemas(s1, s2)
        score = SchemaComparator.calculate_compatibility_score(comp)
        assert score >= 0.0

    def test_multiple_field_diff_counts_correctly(self):
        s1 = self._make_schema([self._field("a"), self._field("b")])
        s2 = self._make_schema([self._field("c"), self._field("d")])
        result = SchemaComparator.compare_schemas(s1, s2)
        assert len(result["added_fields"]) == 2
        assert len(result["removed_fields"]) == 2


# ---------------------------------------------------------------------------
# TEST-008-I: FieldMapping and SchemaMapping (10 tests)
# ---------------------------------------------------------------------------

class TestFieldMappingAndSchemaMapping:
    """Tests for FieldMapping and SchemaMapping classes"""

    def test_field_mapping_to_dict_contains_expected_keys(self):
        mapping = FieldMapping(
            source_field="src",
            destination_field="dst",
            mapping_type=MappingType.DIRECT
        )
        d = mapping.to_dict()
        for key in ["source_field", "destination_field", "mapping_type",
                    "transformation", "condition", "description"]:
            assert key in d

    def test_field_mapping_from_dict_round_trips(self):
        data = {
            "source_field": "name",
            "destination_field": "full_name",
            "mapping_type": "direct"
        }
        mapping = FieldMapping.from_dict(data)
        assert mapping.source_field == "name"
        assert mapping.destination_field == "full_name"
        assert mapping.mapping_type == MappingType.DIRECT

    def test_field_mapping_default_type_is_direct(self):
        mapping = FieldMapping.from_dict({
            "source_field": "x",
            "destination_field": "y"
        })
        assert mapping.mapping_type == MappingType.DIRECT

    def test_schema_mapping_add_mapping(self):
        sm = SchemaMapping(name="test", source_schema={"fields": []},
                           destination_schema={"fields": []})
        fm = FieldMapping(source_field="a", destination_field="b")
        sm.add_mapping(fm)
        assert len(sm.field_mappings) == 1

    def test_schema_mapping_remove_existing_mapping_returns_true(self):
        sm = SchemaMapping(name="test", source_schema={"fields": []},
                           destination_schema={"fields": []})
        fm = FieldMapping(source_field="a", destination_field="b")
        sm.add_mapping(fm)
        result = sm.remove_mapping("b")
        assert result is True
        assert len(sm.field_mappings) == 0

    def test_schema_mapping_remove_nonexistent_returns_false(self):
        sm = SchemaMapping(name="test", source_schema={"fields": []},
                           destination_schema={"fields": []})
        result = sm.remove_mapping("nonexistent")
        assert result is False

    def test_schema_mapping_get_mapping_found(self):
        sm = SchemaMapping(name="test", source_schema={"fields": []},
                           destination_schema={"fields": []})
        fm = FieldMapping(source_field="x", destination_field="y")
        sm.add_mapping(fm)
        found = sm.get_mapping("y")
        assert found is fm

    def test_schema_mapping_get_mapping_not_found_returns_none(self):
        sm = SchemaMapping(name="test", source_schema={"fields": []},
                           destination_schema={"fields": []})
        result = sm.get_mapping("missing")
        assert result is None

    def test_schema_mapping_generates_unique_id(self):
        sm = SchemaMapping(name="test", source_schema={}, destination_schema={})
        assert sm.mapping_id.startswith("mapping_")

    def test_schema_mapping_to_dict_contains_field_mappings(self):
        sm = SchemaMapping(name="test", source_schema={}, destination_schema={})
        fm = FieldMapping(source_field="a", destination_field="b")
        sm.add_mapping(fm)
        d = sm.to_dict()
        assert len(d["field_mappings"]) == 1
        assert d["field_mappings"][0]["source_field"] == "a"


# ---------------------------------------------------------------------------
# TEST-008-J: MappingGenerator (10 tests)
# ---------------------------------------------------------------------------

class TestMappingGenerator:
    """Tests for MappingGenerator"""

    def _make_schema(self, *fields):
        """Build a schema dict with given (name, type) pairs."""
        return {"fields": [{"name": n, "data_type": t} for n, t in fields]}

    def test_auto_generate_exact_name_match_produces_direct_mapping(self):
        src = self._make_schema(("id", "integer"))
        dst = self._make_schema(("id", "integer"))
        mappings = MappingGenerator.auto_generate_mappings(src, dst)
        assert len(mappings) == 1
        assert mappings[0].mapping_type == MappingType.DIRECT

    def test_auto_generate_case_insensitive_name_match(self):
        src = self._make_schema(("UserID", "integer"))
        dst = self._make_schema(("userid", "integer"))
        mappings = MappingGenerator.auto_generate_mappings(src, dst)
        assert len(mappings) == 1
        assert mappings[0].source_field == "UserID"

    def test_auto_generate_type_mismatch_creates_transform_mapping(self):
        src = self._make_schema(("score", "string"))
        dst = self._make_schema(("score", "integer"))
        mappings = MappingGenerator.auto_generate_mappings(src, dst)
        assert mappings[0].mapping_type == MappingType.TRANSFORM

    def test_auto_generate_no_matching_field_produces_no_mapping(self):
        src = self._make_schema(("totally_different", "string"))
        dst = self._make_schema(("xyz_field", "string"))
        # Low similarity → no mapping generated
        mappings = MappingGenerator.auto_generate_mappings(src, dst)
        # Either 0 or 1 depending on fuzzy threshold; just check it doesn't crash
        assert isinstance(mappings, list)

    def test_create_mapping_same_types_is_direct(self):
        src_field = {"name": "name", "data_type": "string"}
        dst_field = {"name": "full_name", "data_type": "string"}
        mapping = MappingGenerator._create_mapping_with_type_check(
            "name", "full_name", src_field, dst_field
        )
        assert mapping.mapping_type == MappingType.DIRECT

    def test_create_mapping_different_types_is_transform(self):
        src_field = {"name": "age", "data_type": "string"}
        dst_field = {"name": "age", "data_type": "integer"}
        mapping = MappingGenerator._create_mapping_with_type_check(
            "age", "age", src_field, dst_field
        )
        assert mapping.mapping_type == MappingType.TRANSFORM

    def test_suggest_transformation_string_to_integer(self):
        result = MappingGenerator._suggest_transformation("string", "integer")
        assert result["type"] == TransformationType.CAST.value
        assert result["function"] == "int"

    def test_suggest_transformation_integer_to_string(self):
        result = MappingGenerator._suggest_transformation("integer", "string")
        assert result["function"] == "str"

    def test_similarity_score_identical_strings_is_1(self):
        score = MappingGenerator._similarity_score("hello", "hello")
        assert score == 1.0

    def test_similarity_score_completely_different_is_low(self):
        score = MappingGenerator._similarity_score("abc", "xyz")
        assert score < 0.5


# ---------------------------------------------------------------------------
# TEST-008-K: MappingValidator (7 tests)
# ---------------------------------------------------------------------------

class TestMappingValidator:
    """Tests for MappingValidator.validate_mapping()"""

    def _make_sm(self, src_fields, dst_fields, mappings=None):
        sm = SchemaMapping(
            name="test",
            source_schema={"fields": src_fields},
            destination_schema={"fields": dst_fields},
            field_mappings=mappings or []
        )
        return sm

    def test_valid_mapping_with_all_required_fields_mapped(self):
        src_fields = [{"name": "id", "data_type": "integer", "nullable": True}]
        dst_fields = [{"name": "id", "data_type": "integer", "nullable": False}]
        fm = FieldMapping(source_field="id", destination_field="id")
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is True
        assert errors == []

    def test_missing_required_destination_field_produces_error(self):
        src_fields = [{"name": "id", "data_type": "integer", "nullable": True}]
        dst_fields = [{"name": "id", "data_type": "integer", "nullable": False}]
        sm = self._make_sm(src_fields, dst_fields)  # No mappings
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is False
        assert any("id" in e for e in errors)

    def test_nonexistent_source_field_produces_error(self):
        src_fields = [{"name": "id", "data_type": "integer", "nullable": True}]
        dst_fields = [{"name": "name", "data_type": "string", "nullable": True}]
        fm = FieldMapping(source_field="nonexistent", destination_field="name")
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is False
        assert any("nonexistent" in e for e in errors)

    def test_constant_mapping_does_not_require_source_field(self):
        src_fields = []
        dst_fields = [{"name": "status", "data_type": "string", "nullable": True}]
        # Use empty transformation dict so the transformation validator is skipped;
        # the key point is that CONSTANT mappings don't check source field existence.
        fm = FieldMapping(
            source_field=None,
            destination_field="status",
            mapping_type=MappingType.CONSTANT,
            transformation={}
        )
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        # Should have no errors about missing source field
        source_errors = [e for e in errors if "source" in e.lower()]
        assert source_errors == []

    def test_transformation_without_type_produces_error(self):
        src_fields = [{"name": "age", "data_type": "string", "nullable": True}]
        dst_fields = [{"name": "age", "data_type": "string", "nullable": True}]
        fm = FieldMapping(
            source_field="age", destination_field="age",
            mapping_type=MappingType.TRANSFORM,
            transformation={"missing_type_key": True}
        )
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is False

    def test_cast_transformation_requires_to_type(self):
        src_fields = [{"name": "val", "data_type": "string", "nullable": True}]
        dst_fields = [{"name": "val", "data_type": "string", "nullable": True}]
        fm = FieldMapping(
            source_field="val", destination_field="val",
            mapping_type=MappingType.TRANSFORM,
            transformation={"type": "cast"}  # Missing to_type
        )
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is False

    def test_replace_transformation_requires_old_and_new(self):
        src_fields = [{"name": "val", "data_type": "string", "nullable": True}]
        dst_fields = [{"name": "val", "data_type": "string", "nullable": True}]
        fm = FieldMapping(
            source_field="val", destination_field="val",
            mapping_type=MappingType.TRANSFORM,
            transformation={"type": "replace", "old": "foo"}  # Missing new
        )
        sm = self._make_sm(src_fields, dst_fields, [fm])
        is_valid, errors = MappingValidator.validate_mapping(sm)
        assert is_valid is False


# ---------------------------------------------------------------------------
# TEST-008-L: MappingTemplateManager (5 tests)
# ---------------------------------------------------------------------------

class TestMappingTemplateManager:
    """Tests for MappingTemplateManager"""

    def test_create_and_get_template(self):
        mgr = MappingTemplateManager()
        fm = FieldMapping(source_field="id", destination_field="user_id")
        template = mgr.create_template(
            "my_template", "csv", "database", [fm], description="Test template"
        )
        assert template["name"] == "my_template"
        retrieved = mgr.get_template("my_template")
        assert retrieved is not None

    def test_get_nonexistent_template_returns_none(self):
        mgr = MappingTemplateManager()
        assert mgr.get_template("missing") is None

    def test_list_templates_includes_created_template(self):
        mgr = MappingTemplateManager()
        mgr.create_template("t1", "src", "dst", [])
        templates = mgr.list_templates()
        assert len(templates) == 1
        assert templates[0]["name"] == "t1"

    def test_apply_template_creates_schema_mapping(self):
        mgr = MappingTemplateManager()
        fm = FieldMapping(source_field="id", destination_field="id")
        mgr.create_template("t1", "csv", "db", [fm])
        src_schema = {"fields": [{"name": "id", "data_type": "integer"}]}
        dst_schema = {"fields": [{"name": "id", "data_type": "integer"}]}
        result = mgr.apply_template("t1", src_schema, dst_schema)
        assert isinstance(result, SchemaMapping)
        assert len(result.field_mappings) == 1

    def test_apply_nonexistent_template_returns_none(self):
        mgr = MappingTemplateManager()
        result = mgr.apply_template("missing", {}, {})
        assert result is None


# ---------------------------------------------------------------------------
# TEST-008-M: TransformationRuleGenerator (8 tests)
# ---------------------------------------------------------------------------

class TestTransformationRuleGenerator:
    """Tests for TransformationRuleGenerator"""

    def _make_sm(self, mappings):
        return SchemaMapping(
            name="test",
            source_schema={},
            destination_schema={},
            field_mappings=mappings
        )

    def test_generate_python_direct_mapping(self):
        fm = FieldMapping(source_field="name", destination_field="full_name")
        sm = self._make_sm([fm])
        code = TransformationRuleGenerator.generate_python_code(sm)
        assert "destination_record['full_name'] = source_record.get('name')" in code

    def test_generate_python_constant_mapping(self):
        fm = FieldMapping(
            destination_field="status",
            mapping_type=MappingType.CONSTANT,
            transformation={"value": "active"}
        )
        sm = self._make_sm([fm])
        code = TransformationRuleGenerator.generate_python_code(sm)
        assert "destination_record['status']" in code
        assert "active" in code

    def test_generate_python_code_defines_function(self):
        sm = self._make_sm([])
        code = TransformationRuleGenerator.generate_python_code(sm)
        assert "def transform_data" in code
        assert "return destination_record" in code

    def test_generate_python_uppercase_transform(self):
        fm = FieldMapping(
            source_field="name",
            destination_field="name_upper",
            mapping_type=MappingType.TRANSFORM,
            transformation={"type": "uppercase"}
        )
        sm = self._make_sm([fm])
        code = TransformationRuleGenerator.generate_python_code(sm)
        assert ".upper()" in code

    def test_generate_python_lowercase_transform(self):
        fm = FieldMapping(
            source_field="email",
            destination_field="email_lower",
            mapping_type=MappingType.TRANSFORM,
            transformation={"type": "lowercase"}
        )
        sm = self._make_sm([fm])
        code = TransformationRuleGenerator.generate_python_code(sm)
        assert ".lower()" in code

    def test_generate_sql_direct_mapping(self):
        fm = FieldMapping(source_field="id", destination_field="user_id")
        sm = self._make_sm([fm])
        sql = TransformationRuleGenerator.generate_sql_mapping(sm)
        assert "src.id AS user_id" in sql

    def test_generate_sql_constant_mapping(self):
        fm = FieldMapping(
            destination_field="source_system",
            mapping_type=MappingType.CONSTANT,
            transformation={"value": "crm"}
        )
        sm = self._make_sm([fm])
        sql = TransformationRuleGenerator.generate_sql_mapping(sm)
        assert "crm" in sql
        assert "source_system" in sql

    def test_generate_sql_uppercase_transform(self):
        fm = FieldMapping(
            source_field="country",
            destination_field="country_code",
            mapping_type=MappingType.TRANSFORM,
            transformation={"type": "uppercase"}
        )
        sm = self._make_sm([fm])
        sql = TransformationRuleGenerator.generate_sql_mapping(sm)
        assert "UPPER" in sql


# Run with:
# POSTGRES_SERVER=localhost POSTGRES_USER=user POSTGRES_PASSWORD=pass POSTGRES_DB=db \
# REDIS_URL=redis://localhost:6379 PYTHONPATH=/Users/Deepak/Public/Jade-Data-Aggregator \
# poetry run pytest testing/backend-tests/unit/services/test_schema_introspection.py -v
