"""
Configuration Schema Service
Defines connector configuration schemas and generates dynamic form metadata
"""

from typing import Dict, List, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field
import json


class FieldType(str, Enum):
    """Field types for dynamic forms"""
    TEXT = "text"
    PASSWORD = "password"
    NUMBER = "number"
    EMAIL = "email"
    URL = "url"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    BOOLEAN = "boolean"
    JSON = "json"
    FILE = "file"
    TEXTAREA = "textarea"
    DATE = "date"
    DATETIME = "datetime"


class ValidationRule(BaseModel):
    """Validation rule for a field"""
    type: str = Field(..., description="Type of validation (required, min, max, pattern, etc.)")
    value: Any = Field(None, description="Value for the validation")
    message: str = Field(..., description="Error message if validation fails")


class FormField(BaseModel):
    """Represents a form field in dynamic configuration"""
    name: str = Field(..., description="Field name/key")
    label: str = Field(..., description="Display label")
    field_type: FieldType = Field(..., description="Type of field")
    default_value: Any = Field(None, description="Default value")
    placeholder: str = Field(None, description="Placeholder text")
    help_text: str = Field(None, description="Help/description text")
    required: bool = Field(default=False, description="Whether field is required")
    validation: List[ValidationRule] = Field(default_factory=list, description="Validation rules")
    options: List[Dict[str, Any]] = Field(default_factory=list, description="Options for select fields")
    conditional: Optional[Dict[str, Any]] = Field(None, description="Conditional display logic")
    group: str = Field(default="general", description="Field group/section")


class ConnectorConfigSchema(BaseModel):
    """Configuration schema for a connector type"""
    connector_type: str = Field(..., description="Type of connector (database, api, saas, etc.)")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Description of the connector")
    icon: str = Field(None, description="Icon identifier")
    fields: List[FormField] = Field(..., description="Configuration fields")
    groups: List[Dict[str, str]] = Field(default_factory=list, description="Field groups")


class ConfigurationSchemaService:
    """Service for managing configuration schemas"""

    # Database connector schemas
    DATABASE_SCHEMAS = {
        "postgresql": ConnectorConfigSchema(
            connector_type="postgresql",
            name="PostgreSQL Database",
            description="Connect to PostgreSQL database",
            icon="database",
            groups=[
                {"id": "connection", "label": "Connection Details"},
                {"id": "advanced", "label": "Advanced Settings"}
            ],
            fields=[
                FormField(
                    name="host",
                    label="Host",
                    field_type=FieldType.TEXT,
                    placeholder="localhost",
                    help_text="Database server hostname or IP address",
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Host is required")
                    ]
                ),
                FormField(
                    name="port",
                    label="Port",
                    field_type=FieldType.NUMBER,
                    default_value=5432,
                    placeholder="5432",
                    help_text="Database server port",
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Port is required"),
                        ValidationRule(type="min", value=1, message="Port must be at least 1"),
                        ValidationRule(type="max", value=65535, message="Port must be at most 65535")
                    ]
                ),
                FormField(
                    name="database",
                    label="Database Name",
                    field_type=FieldType.TEXT,
                    placeholder="mydatabase",
                    help_text="Name of the database to connect to",
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Database name is required")
                    ]
                ),
                FormField(
                    name="username",
                    label="Username",
                    field_type=FieldType.TEXT,
                    placeholder="postgres",
                    help_text="Database username",
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Username is required")
                    ]
                ),
                FormField(
                    name="password",
                    label="Password",
                    field_type=FieldType.PASSWORD,
                    placeholder="••••••••",
                    help_text="Database password",
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Password is required")
                    ]
                ),
                FormField(
                    name="ssl_mode",
                    label="SSL Mode",
                    field_type=FieldType.SELECT,
                    default_value="prefer",
                    help_text="SSL connection mode",
                    group="advanced",
                    options=[
                        {"value": "disable", "label": "Disable"},
                        {"value": "allow", "label": "Allow"},
                        {"value": "prefer", "label": "Prefer"},
                        {"value": "require", "label": "Require"},
                        {"value": "verify-ca", "label": "Verify CA"},
                        {"value": "verify-full", "label": "Verify Full"}
                    ]
                ),
                FormField(
                    name="schema",
                    label="Schema",
                    field_type=FieldType.TEXT,
                    default_value="public",
                    placeholder="public",
                    help_text="Default schema to use",
                    group="advanced"
                )
            ]
        ),
        "mysql": ConnectorConfigSchema(
            connector_type="mysql",
            name="MySQL Database",
            description="Connect to MySQL/MariaDB database",
            icon="database",
            groups=[
                {"id": "connection", "label": "Connection Details"},
                {"id": "advanced", "label": "Advanced Settings"}
            ],
            fields=[
                FormField(
                    name="host",
                    label="Host",
                    field_type=FieldType.TEXT,
                    placeholder="localhost",
                    required=True,
                    group="connection",
                    validation=[ValidationRule(type="required", message="Host is required")]
                ),
                FormField(
                    name="port",
                    label="Port",
                    field_type=FieldType.NUMBER,
                    default_value=3306,
                    required=True,
                    group="connection",
                    validation=[
                        ValidationRule(type="required", message="Port is required"),
                        ValidationRule(type="min", value=1, message="Invalid port"),
                        ValidationRule(type="max", value=65535, message="Invalid port")
                    ]
                ),
                FormField(
                    name="database",
                    label="Database Name",
                    field_type=FieldType.TEXT,
                    required=True,
                    group="connection",
                    validation=[ValidationRule(type="required", message="Database name is required")]
                ),
                FormField(
                    name="username",
                    label="Username",
                    field_type=FieldType.TEXT,
                    required=True,
                    group="connection",
                    validation=[ValidationRule(type="required", message="Username is required")]
                ),
                FormField(
                    name="password",
                    label="Password",
                    field_type=FieldType.PASSWORD,
                    required=True,
                    group="connection",
                    validation=[ValidationRule(type="required", message="Password is required")]
                ),
                FormField(
                    name="charset",
                    label="Character Set",
                    field_type=FieldType.SELECT,
                    default_value="utf8mb4",
                    group="advanced",
                    options=[
                        {"value": "utf8mb4", "label": "UTF-8 (utf8mb4)"},
                        {"value": "utf8", "label": "UTF-8 (utf8)"},
                        {"value": "latin1", "label": "Latin1"}
                    ]
                )
            ]
        )
    }

    # API connector schemas
    API_SCHEMAS = {
        "rest_api": ConnectorConfigSchema(
            connector_type="rest_api",
            name="REST API",
            description="Connect to REST API endpoints",
            icon="globe",
            groups=[
                {"id": "endpoint", "label": "Endpoint Configuration"},
                {"id": "authentication", "label": "Authentication"},
                {"id": "advanced", "label": "Advanced Settings"}
            ],
            fields=[
                FormField(
                    name="base_url",
                    label="Base URL",
                    field_type=FieldType.URL,
                    placeholder="https://api.example.com",
                    help_text="Base URL for the API",
                    required=True,
                    group="endpoint",
                    validation=[
                        ValidationRule(type="required", message="Base URL is required"),
                        ValidationRule(type="url", message="Must be a valid URL")
                    ]
                ),
                FormField(
                    name="auth_type",
                    label="Authentication Type",
                    field_type=FieldType.SELECT,
                    default_value="none",
                    help_text="Type of authentication",
                    required=True,
                    group="authentication",
                    options=[
                        {"value": "none", "label": "No Authentication"},
                        {"value": "api_key", "label": "API Key"},
                        {"value": "bearer_token", "label": "Bearer Token"},
                        {"value": "basic_auth", "label": "Basic Authentication"},
                        {"value": "oauth2", "label": "OAuth 2.0"}
                    ]
                ),
                FormField(
                    name="api_key",
                    label="API Key",
                    field_type=FieldType.PASSWORD,
                    placeholder="Enter API key",
                    help_text="Your API key",
                    group="authentication",
                    conditional={"field": "auth_type", "operator": "equals", "value": "api_key"},
                    validation=[
                        ValidationRule(type="required_if", value="auth_type:api_key", message="API key is required")
                    ]
                ),
                FormField(
                    name="api_key_header",
                    label="API Key Header Name",
                    field_type=FieldType.TEXT,
                    default_value="X-API-Key",
                    placeholder="X-API-Key",
                    help_text="Header name for API key",
                    group="authentication",
                    conditional={"field": "auth_type", "operator": "equals", "value": "api_key"}
                ),
                FormField(
                    name="bearer_token",
                    label="Bearer Token",
                    field_type=FieldType.PASSWORD,
                    placeholder="Enter bearer token",
                    group="authentication",
                    conditional={"field": "auth_type", "operator": "equals", "value": "bearer_token"},
                    validation=[
                        ValidationRule(type="required_if", value="auth_type:bearer_token", message="Bearer token is required")
                    ]
                ),
                FormField(
                    name="basic_username",
                    label="Username",
                    field_type=FieldType.TEXT,
                    group="authentication",
                    conditional={"field": "auth_type", "operator": "equals", "value": "basic_auth"}
                ),
                FormField(
                    name="basic_password",
                    label="Password",
                    field_type=FieldType.PASSWORD,
                    group="authentication",
                    conditional={"field": "auth_type", "operator": "equals", "value": "basic_auth"}
                ),
                FormField(
                    name="timeout",
                    label="Request Timeout (seconds)",
                    field_type=FieldType.NUMBER,
                    default_value=30,
                    help_text="Timeout for API requests",
                    group="advanced",
                    validation=[
                        ValidationRule(type="min", value=1, message="Timeout must be at least 1 second"),
                        ValidationRule(type="max", value=300, message="Timeout cannot exceed 300 seconds")
                    ]
                ),
                FormField(
                    name="custom_headers",
                    label="Custom Headers",
                    field_type=FieldType.JSON,
                    placeholder='{"Header-Name": "value"}',
                    help_text="Additional HTTP headers as JSON",
                    group="advanced"
                )
            ]
        )
    }

    # SaaS connector schemas
    SAAS_SCHEMAS = {
        "salesforce": ConnectorConfigSchema(
            connector_type="salesforce",
            name="Salesforce",
            description="Connect to Salesforce CRM",
            icon="cloud",
            groups=[
                {"id": "credentials", "label": "Credentials"},
                {"id": "settings", "label": "Settings"}
            ],
            fields=[
                FormField(
                    name="instance_url",
                    label="Instance URL",
                    field_type=FieldType.URL,
                    placeholder="https://yourinstance.salesforce.com",
                    help_text="Your Salesforce instance URL",
                    required=True,
                    group="credentials",
                    validation=[
                        ValidationRule(type="required", message="Instance URL is required"),
                        ValidationRule(type="url", message="Must be a valid URL")
                    ]
                ),
                FormField(
                    name="username",
                    label="Username",
                    field_type=FieldType.EMAIL,
                    placeholder="user@company.com",
                    required=True,
                    group="credentials",
                    validation=[
                        ValidationRule(type="required", message="Username is required"),
                        ValidationRule(type="email", message="Must be a valid email")
                    ]
                ),
                FormField(
                    name="password",
                    label="Password",
                    field_type=FieldType.PASSWORD,
                    required=True,
                    group="credentials",
                    validation=[ValidationRule(type="required", message="Password is required")]
                ),
                FormField(
                    name="security_token",
                    label="Security Token",
                    field_type=FieldType.PASSWORD,
                    help_text="Your Salesforce security token",
                    required=True,
                    group="credentials",
                    validation=[ValidationRule(type="required", message="Security token is required")]
                ),
                FormField(
                    name="api_version",
                    label="API Version",
                    field_type=FieldType.SELECT,
                    default_value="v58.0",
                    help_text="Salesforce API version",
                    group="settings",
                    options=[
                        {"value": "v58.0", "label": "v58.0 (Latest)"},
                        {"value": "v57.0", "label": "v57.0"},
                        {"value": "v56.0", "label": "v56.0"}
                    ]
                ),
                FormField(
                    name="sandbox",
                    label="Sandbox Environment",
                    field_type=FieldType.BOOLEAN,
                    default_value=False,
                    help_text="Connect to Salesforce sandbox instead of production",
                    group="settings"
                )
            ]
        )
    }

    # File connector schemas
    FILE_SCHEMAS = {
        "csv_file": ConnectorConfigSchema(
            connector_type="csv_file",
            name="CSV File",
            description="Read from CSV files",
            icon="file-text",
            groups=[
                {"id": "file", "label": "File Configuration"},
                {"id": "format", "label": "Format Settings"}
            ],
            fields=[
                FormField(
                    name="file_path",
                    label="File Path",
                    field_type=FieldType.FILE,
                    help_text="Path to CSV file or upload file",
                    required=True,
                    group="file",
                    validation=[ValidationRule(type="required", message="File path is required")]
                ),
                FormField(
                    name="delimiter",
                    label="Delimiter",
                    field_type=FieldType.SELECT,
                    default_value=",",
                    help_text="Column delimiter character",
                    group="format",
                    options=[
                        {"value": ",", "label": "Comma (,)"},
                        {"value": ";", "label": "Semicolon (;)"},
                        {"value": "\t", "label": "Tab"},
                        {"value": "|", "label": "Pipe (|)"}
                    ]
                ),
                FormField(
                    name="has_header",
                    label="Has Header Row",
                    field_type=FieldType.BOOLEAN,
                    default_value=True,
                    help_text="First row contains column names",
                    group="format"
                ),
                FormField(
                    name="encoding",
                    label="File Encoding",
                    field_type=FieldType.SELECT,
                    default_value="utf-8",
                    help_text="Character encoding of the file",
                    group="format",
                    options=[
                        {"value": "utf-8", "label": "UTF-8"},
                        {"value": "latin1", "label": "Latin-1"},
                        {"value": "ascii", "label": "ASCII"}
                    ]
                ),
                FormField(
                    name="skip_rows",
                    label="Skip Rows",
                    field_type=FieldType.NUMBER,
                    default_value=0,
                    help_text="Number of rows to skip at the beginning",
                    group="format",
                    validation=[
                        ValidationRule(type="min", value=0, message="Cannot be negative")
                    ]
                )
            ]
        )
    }

    @classmethod
    def get_all_schemas(cls) -> Dict[str, ConnectorConfigSchema]:
        """Get all available connector schemas"""
        all_schemas = {}
        all_schemas.update(cls.DATABASE_SCHEMAS)
        all_schemas.update(cls.API_SCHEMAS)
        all_schemas.update(cls.SAAS_SCHEMAS)
        all_schemas.update(cls.FILE_SCHEMAS)
        return all_schemas

    @classmethod
    def get_schema(cls, connector_type: str) -> Optional[ConnectorConfigSchema]:
        """Get schema for a specific connector type"""
        all_schemas = cls.get_all_schemas()
        return all_schemas.get(connector_type)

    @classmethod
    def get_schemas_by_category(cls) -> Dict[str, Dict[str, ConnectorConfigSchema]]:
        """Get schemas grouped by category"""
        return {
            "databases": cls.DATABASE_SCHEMAS,
            "apis": cls.API_SCHEMAS,
            "saas": cls.SAAS_SCHEMAS,
            "files": cls.FILE_SCHEMAS
        }

    @classmethod
    def validate_configuration(
        cls,
        connector_type: str,
        config: Dict[str, Any]
    ) -> tuple[bool, List[str]]:
        """
        Validate configuration against schema

        Returns:
            (is_valid, list_of_errors)
        """
        schema = cls.get_schema(connector_type)
        if not schema:
            return False, [f"Unknown connector type: {connector_type}"]

        errors = []

        for field in schema.fields:
            field_value = config.get(field.name)

            # Check required fields
            if field.required and field_value is None:
                errors.append(f"{field.label} is required")
                continue

            # Skip validation if field is empty and not required
            if field_value is None:
                continue

            # Apply validation rules
            for rule in field.validation:
                if rule.type == "min" and isinstance(field_value, (int, float)):
                    if field_value < rule.value:
                        errors.append(f"{field.label}: {rule.message}")

                elif rule.type == "max" and isinstance(field_value, (int, float)):
                    if field_value > rule.value:
                        errors.append(f"{field.label}: {rule.message}")

                elif rule.type == "pattern":
                    import re
                    if not re.match(rule.value, str(field_value)):
                        errors.append(f"{field.label}: {rule.message}")

                elif rule.type == "url":
                    if not str(field_value).startswith(('http://', 'https://')):
                        errors.append(f"{field.label}: {rule.message}")

                elif rule.type == "email":
                    import re
                    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                    if not re.match(email_pattern, str(field_value)):
                        errors.append(f"{field.label}: {rule.message}")

        is_valid = len(errors) == 0
        return is_valid, errors

    @classmethod
    def get_form_metadata(cls, connector_type: str) -> Optional[Dict[str, Any]]:
        """Generate form metadata for frontend dynamic form rendering"""
        schema = cls.get_schema(connector_type)
        if not schema:
            return None

        return {
            "connector_type": schema.connector_type,
            "name": schema.name,
            "description": schema.description,
            "icon": schema.icon,
            "groups": schema.groups,
            "fields": [field.dict() for field in schema.fields]
        }

    @classmethod
    def get_configuration_template(cls, connector_type: str) -> Optional[Dict[str, Any]]:
        """Get configuration template with default values"""
        schema = cls.get_schema(connector_type)
        if not schema:
            return None

        template = {}
        for field in schema.fields:
            if field.default_value is not None:
                template[field.name] = field.default_value

        return template

    @classmethod
    def get_recommendations(
        cls,
        connector_type: str,
        partial_config: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Get configuration recommendations based on partial config"""
        recommendations = []

        # Example recommendations
        if connector_type in ["postgresql", "mysql"]:
            if "ssl_mode" not in partial_config or partial_config.get("ssl_mode") == "disable":
                recommendations.append({
                    "field": "ssl_mode",
                    "message": "Consider enabling SSL for secure connections",
                    "recommendation": "require"
                })

        if connector_type == "rest_api":
            if partial_config.get("auth_type") == "none":
                recommendations.append({
                    "field": "auth_type",
                    "message": "No authentication configured. This may not be secure.",
                    "recommendation": "api_key"
                })

        return recommendations
