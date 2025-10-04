"""
Schema Introspection and Mapping API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_any_authenticated
from backend.services.schema_introspector import (
    DatabaseSchemaIntrospector,
    APISchemaIntrospector,
    FileSchemaIntrospector,
    SchemaComparator
)
from backend.services.schema_mapper import (
    SchemaMapping,
    FieldMapping,
    MappingGenerator,
    MappingValidator,
    MappingTemplateManager,
    TransformationRuleGenerator,
    MappingType
)
from backend.models.schema_mapping import (
    SchemaDefinition,
    SchemaMappingDefinition,
    MappingTemplate
)

router = APIRouter()

# Initialize template manager (in production, use database-backed storage)
template_manager = MappingTemplateManager()


# Pydantic models for request validation
class DatabaseIntrospectionRequest(BaseModel):
    connection_string: str = Field(..., description="Database connection string")
    schema_name: Optional[str] = Field(None, description="Schema name (optional)")


class APIIntrospectionRequest(BaseModel):
    openapi_url: str = Field(..., description="URL to OpenAPI/Swagger spec")
    api_key: Optional[str] = Field(None, description="API key for authentication")


class JSONSampleRequest(BaseModel):
    json_data: Dict[str, Any] = Field(..., description="Sample JSON data")
    schema_name: str = Field(default="sample", description="Name for the schema")


class CSVIntrospectionRequest(BaseModel):
    sample_data: str = Field(..., description="Sample CSV data (first few lines)")
    delimiter: str = Field(default=",", description="CSV delimiter")
    has_header: bool = Field(default=True, description="Whether first row is header")


class SchemaComparisonRequest(BaseModel):
    schema1: Dict[str, Any] = Field(..., description="First schema")
    schema2: Dict[str, Any] = Field(..., description="Second schema")


class CreateSchemaMappingRequest(BaseModel):
    name: str
    source_schema_id: int
    destination_schema_id: int
    auto_generate: bool = Field(default=True, description="Auto-generate mappings")


class FieldMappingRequest(BaseModel):
    source_field: Optional[str] = None
    destination_field: str
    mapping_type: str = "direct"
    transformation: Optional[Dict[str, Any]] = None
    condition: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class SaveSchemaRequest(BaseModel):
    name: str
    source_type: str
    schema_data: Dict[str, Any]
    connection_info: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


# Schema Introspection Endpoints

@router.post("/introspect/database")
async def introspect_database_schema(
    request: DatabaseIntrospectionRequest,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Introspect a database schema

    Returns table structures, columns, types, and constraints
    """
    try:
        schema = DatabaseSchemaIntrospector.introspect_database(
            connection_string=request.connection_string,
            schema_name=request.schema_name
        )

        if "error" in schema:
            raise HTTPException(status_code=400, detail=schema["error"])

        return schema

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database introspection failed: {str(e)}")


@router.post("/introspect/api")
async def introspect_api_schema(
    request: APIIntrospectionRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Introspect an API schema from OpenAPI/Swagger specification
    """
    try:
        schema = APISchemaIntrospector.introspect_openapi(
            openapi_url=request.openapi_url,
            api_key=request.api_key
        )

        if "error" in schema:
            raise HTTPException(status_code=400, detail=schema["error"])

        return schema

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API introspection failed: {str(e)}")


@router.post("/introspect/json")
async def introspect_json_schema(
    request: JSONSampleRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Introspect schema from JSON sample data
    """
    try:
        schema = APISchemaIntrospector.introspect_json_sample(
            json_data=request.json_data,
            schema_name=request.schema_name
        )

        if "error" in schema:
            raise HTTPException(status_code=400, detail=schema["error"])

        return schema

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JSON introspection failed: {str(e)}")


@router.post("/introspect/csv")
async def introspect_csv_schema(
    request: CSVIntrospectionRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Introspect schema from CSV sample data
    """
    try:
        schema = FileSchemaIntrospector.introspect_csv_structure(
            sample_data=request.sample_data,
            delimiter=request.delimiter,
            has_header=request.has_header
        )

        if "error" in schema:
            raise HTTPException(status_code=400, detail=schema["error"])

        return schema

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV introspection failed: {str(e)}")


@router.post("/compare")
async def compare_schemas(
    request: SchemaComparisonRequest,
    current_user: User = Depends(require_any_authenticated())
) -> Dict[str, Any]:
    """
    Compare two schemas and return differences
    """
    try:
        comparison = SchemaComparator.compare_schemas(
            schema1=request.schema1,
            schema2=request.schema2
        )

        compatibility_score = SchemaComparator.calculate_compatibility_score(comparison)

        return {
            **comparison,
            "compatibility_score": compatibility_score
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema comparison failed: {str(e)}")


# Schema Storage Endpoints

@router.post("/schemas")
async def save_schema(
    request: SaveSchemaRequest,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Save a schema definition to database"""
    try:
        schema_def = SchemaDefinition(
            name=request.name,
            source_type=request.source_type,
            schema_data=request.schema_data,
            connection_info=request.connection_info,
            description=request.description
        )

        db.add(schema_def)
        await db.commit()
        await db.refresh(schema_def)

        return {
            "id": schema_def.id,
            "name": schema_def.name,
            "source_type": schema_def.source_type,
            "created_at": schema_def.created_at.isoformat()
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save schema: {str(e)}")


@router.get("/schemas")
async def list_schemas(
    source_type: Optional[str] = Query(None),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """List all saved schema definitions"""
    try:
        query = select(SchemaDefinition)

        if source_type:
            query = query.filter(SchemaDefinition.source_type == source_type)

        result = await db.execute(query)
        schemas = result.scalars().all()

        return {
            "schemas": [
                {
                    "id": s.id,
                    "name": s.name,
                    "source_type": s.source_type,
                    "description": s.description,
                    "created_at": s.created_at.isoformat() if s.created_at else None
                }
                for s in schemas
            ],
            "total_count": len(schemas)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list schemas: {str(e)}")


@router.get("/schemas/{schema_id}")
async def get_schema(
    schema_id: int,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific schema definition"""
    try:
        result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == schema_id)
        )
        schema = result.scalar_one_or_none()

        if not schema:
            raise HTTPException(status_code=404, detail="Schema not found")

        return {
            "id": schema.id,
            "name": schema.name,
            "source_type": schema.source_type,
            "schema_data": schema.schema_data,
            "description": schema.description,
            "created_at": schema.created_at.isoformat() if schema.created_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get schema: {str(e)}")


# Schema Mapping Endpoints

@router.post("/mappings")
async def create_schema_mapping(
    request: CreateSchemaMappingRequest,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new schema mapping"""
    try:
        # Get source and destination schemas
        source_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == request.source_schema_id)
        )
        source_schema = source_result.scalar_one_or_none()

        dest_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == request.destination_schema_id)
        )
        dest_schema = dest_result.scalar_one_or_none()

        if not source_schema or not dest_schema:
            raise HTTPException(status_code=404, detail="Source or destination schema not found")

        # Auto-generate mappings if requested
        field_mappings = []
        if request.auto_generate:
            generated_mappings = MappingGenerator.auto_generate_mappings(
                source_schema.schema_data,
                dest_schema.schema_data
            )
            field_mappings = [m.to_dict() for m in generated_mappings]

        # Create mapping definition
        mapping_def = SchemaMappingDefinition(
            name=request.name,
            source_schema_id=request.source_schema_id,
            destination_schema_id=request.destination_schema_id,
            field_mappings=field_mappings
        )

        db.add(mapping_def)
        await db.commit()
        await db.refresh(mapping_def)

        return {
            "id": mapping_def.id,
            "name": mapping_def.name,
            "source_schema_id": mapping_def.source_schema_id,
            "destination_schema_id": mapping_def.destination_schema_id,
            "field_mappings": mapping_def.field_mappings,
            "created_at": mapping_def.created_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create mapping: {str(e)}")


@router.get("/mappings")
async def list_schema_mappings(
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """List all schema mappings"""
    try:
        result = await db.execute(select(SchemaMappingDefinition))
        mappings = result.scalars().all()

        return {
            "mappings": [
                {
                    "id": m.id,
                    "name": m.name,
                    "source_schema_id": m.source_schema_id,
                    "destination_schema_id": m.destination_schema_id,
                    "is_active": m.is_active,
                    "is_validated": m.is_validated,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in mappings
            ],
            "total_count": len(mappings)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list mappings: {str(e)}")


@router.get("/mappings/{mapping_id}")
async def get_schema_mapping(
    mapping_id: int,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific schema mapping"""
    try:
        result = await db.execute(
            select(SchemaMappingDefinition).filter(SchemaMappingDefinition.id == mapping_id)
        )
        mapping = result.scalar_one_or_none()

        if not mapping:
            raise HTTPException(status_code=404, detail="Mapping not found")

        return {
            "id": mapping.id,
            "name": mapping.name,
            "source_schema_id": mapping.source_schema_id,
            "destination_schema_id": mapping.destination_schema_id,
            "field_mappings": mapping.field_mappings,
            "is_validated": mapping.is_validated,
            "validation_errors": mapping.validation_errors,
            "created_at": mapping.created_at.isoformat() if mapping.created_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mapping: {str(e)}")


@router.put("/mappings/{mapping_id}/fields")
async def update_field_mappings(
    mapping_id: int,
    field_mappings: List[FieldMappingRequest],
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Update field mappings for a schema mapping"""
    try:
        result = await db.execute(
            select(SchemaMappingDefinition).filter(SchemaMappingDefinition.id == mapping_id)
        )
        mapping = result.scalar_one_or_none()

        if not mapping:
            raise HTTPException(status_code=404, detail="Mapping not found")

        # Convert to dict
        mapping.field_mappings = [fm.dict() for fm in field_mappings]
        await db.commit()

        return {
            "message": "Field mappings updated successfully",
            "field_count": len(field_mappings)
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update mappings: {str(e)}")


@router.post("/mappings/{mapping_id}/validate")
async def validate_schema_mapping(
    mapping_id: int,
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Validate a schema mapping"""
    try:
        # Get mapping with schemas
        result = await db.execute(
            select(SchemaMappingDefinition).filter(SchemaMappingDefinition.id == mapping_id)
        )
        mapping_def = result.scalar_one_or_none()

        if not mapping_def:
            raise HTTPException(status_code=404, detail="Mapping not found")

        # Get schemas
        source_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == mapping_def.source_schema_id)
        )
        source_schema = source_result.scalar_one()

        dest_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == mapping_def.destination_schema_id)
        )
        dest_schema = dest_result.scalar_one()

        # Create SchemaMapping object
        field_mappings = [
            FieldMapping.from_dict(fm) for fm in mapping_def.field_mappings
        ]

        schema_mapping = SchemaMapping(
            name=mapping_def.name,
            source_schema=source_schema.schema_data,
            destination_schema=dest_schema.schema_data,
            field_mappings=field_mappings
        )

        # Validate
        is_valid, errors = MappingValidator.validate_mapping(schema_mapping)

        # Update mapping
        mapping_def.is_validated = is_valid
        mapping_def.validation_errors = errors if errors else None
        await db.commit()

        return {
            "is_valid": is_valid,
            "errors": errors
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/mappings/{mapping_id}/generate-code")
async def generate_transformation_code(
    mapping_id: int,
    language: str = Query("python", regex="^(python|sql)$"),
    current_user: User = Depends(require_any_authenticated()),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Generate transformation code from mapping"""
    try:
        result = await db.execute(
            select(SchemaMappingDefinition).filter(SchemaMappingDefinition.id == mapping_id)
        )
        mapping_def = result.scalar_one_or_none()

        if not mapping_def:
            raise HTTPException(status_code=404, detail="Mapping not found")

        # Get schemas
        source_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == mapping_def.source_schema_id)
        )
        source_schema = source_result.scalar_one()

        dest_result = await db.execute(
            select(SchemaDefinition).filter(SchemaDefinition.id == mapping_def.destination_schema_id)
        )
        dest_schema = dest_result.scalar_one()

        # Create SchemaMapping object
        field_mappings = [
            FieldMapping.from_dict(fm) for fm in mapping_def.field_mappings
        ]

        schema_mapping = SchemaMapping(
            name=mapping_def.name,
            source_schema=source_schema.schema_data,
            destination_schema=dest_schema.schema_data,
            field_mappings=field_mappings
        )

        # Generate code
        if language == "python":
            code = TransformationRuleGenerator.generate_python_code(schema_mapping)
        else:  # sql
            code = TransformationRuleGenerator.generate_sql_mapping(schema_mapping)

        return {
            "language": language,
            "code": code,
            "generated_at": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")


@router.get("/health")
async def schema_health_check() -> Dict[str, str]:
    """Health check for schema service"""
    return {
        "status": "healthy",
        "service": "schema_introspection",
        "timestamp": datetime.now().isoformat()
    }
