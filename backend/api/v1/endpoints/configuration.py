"""
Configuration API Endpoints
Provides dynamic configuration schemas and connection testing
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any
from pydantic import BaseModel

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated
from backend.services.config_schema_service import ConfigurationSchemaService
from backend.services.connection_test_service import ConnectionTestService

router = APIRouter()


# Pydantic models
class ConnectionTestRequest(BaseModel):
    connector_type: str
    configuration: Dict[str, Any]


class ConfigurationValidationRequest(BaseModel):
    connector_type: str
    configuration: Dict[str, Any]


# Configuration Schema Endpoints

@router.get("/schemas")
async def get_all_configuration_schemas(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get all available configuration schemas
    """
    schemas = ConfigurationSchemaService.get_all_schemas()

    return {
        "schemas": {
            key: {
                "connector_type": schema.connector_type,
                "name": schema.name,
                "description": schema.description,
                "icon": schema.icon
            }
            for key, schema in schemas.items()
        },
        "total_count": len(schemas)
    }


@router.get("/schemas/by-category")
async def get_schemas_by_category(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get configuration schemas grouped by category
    """
    schemas_by_category = ConfigurationSchemaService.get_schemas_by_category()

    result = {}
    for category, schemas in schemas_by_category.items():
        result[category] = {
            key: {
                "connector_type": schema.connector_type,
                "name": schema.name,
                "description": schema.description,
                "icon": schema.icon
            }
            for key, schema in schemas.items()
        }

    return result


@router.get("/schemas/{connector_type}")
async def get_configuration_schema(
    connector_type: str,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get configuration schema for a specific connector type
    Returns form metadata for dynamic form rendering
    """
    form_metadata = ConfigurationSchemaService.get_form_metadata(connector_type)

    if not form_metadata:
        raise HTTPException(
            status_code=404,
            detail=f"Configuration schema not found for connector type: {connector_type}"
        )

    return form_metadata


@router.get("/schemas/{connector_type}/template")
async def get_configuration_template(
    connector_type: str,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get configuration template with default values
    """
    template = ConfigurationSchemaService.get_configuration_template(connector_type)

    if template is None:
        raise HTTPException(
            status_code=404,
            detail=f"Configuration template not found for connector type: {connector_type}"
        )

    return {
        "connector_type": connector_type,
        "template": template
    }


# Configuration Validation Endpoints

@router.post("/validate")
async def validate_configuration(
    request: ConfigurationValidationRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Validate a configuration against its schema
    """
    is_valid, errors = ConfigurationSchemaService.validate_configuration(
        request.connector_type,
        request.configuration
    )

    return {
        "is_valid": is_valid,
        "errors": errors,
        "connector_type": request.connector_type
    }


@router.post("/recommendations")
async def get_configuration_recommendations(
    request: ConfigurationValidationRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get configuration recommendations based on partial configuration
    """
    recommendations = ConfigurationSchemaService.get_recommendations(
        request.connector_type,
        request.configuration
    )

    return {
        "connector_type": request.connector_type,
        "recommendations": recommendations,
        "recommendation_count": len(recommendations)
    }


# Connection Testing Endpoints

@router.post("/test-connection")
async def test_connection(
    request: ConnectionTestRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Test a connector connection with provided configuration
    """
    try:
        result = await ConnectionTestService.test_connection(
            request.connector_type,
            request.configuration
        )

        return result.to_dict()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Connection test failed: {str(e)}"
        )


@router.post("/preview")
async def get_configuration_preview(
    request: ConfigurationValidationRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get a preview of the configuration with sensitive data masked
    """
    preview = ConnectionTestService.get_configuration_preview(
        request.connector_type,
        request.configuration
    )

    return preview


# Connector Type Information

@router.get("/connector-types")
async def get_connector_types(
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Get list of all available connector types with metadata
    """
    schemas = ConfigurationSchemaService.get_all_schemas()

    connector_types = []
    for key, schema in schemas.items():
        connector_types.append({
            "type": schema.connector_type,
            "name": schema.name,
            "description": schema.description,
            "icon": schema.icon,
            "field_count": len(schema.fields)
        })

    # Group by category
    schemas_by_category = ConfigurationSchemaService.get_schemas_by_category()
    categories = {}

    for category, cat_schemas in schemas_by_category.items():
        categories[category] = [
            {
                "type": schema.connector_type,
                "name": schema.name,
                "description": schema.description,
                "icon": schema.icon
            }
            for schema in cat_schemas.values()
        ]

    return {
        "connector_types": connector_types,
        "categories": categories,
        "total_count": len(connector_types)
    }


@router.get("/health")
async def configuration_health_check() -> Dict[str, str]:
    """Health check for configuration service"""
    return {
        "status": "healthy",
        "service": "configuration",
        "schemas_loaded": str(len(ConfigurationSchemaService.get_all_schemas()))
    }
