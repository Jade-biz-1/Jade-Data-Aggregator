from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.connector import Connector, ConnectorCreate, ConnectorUpdate
from backend.schemas.user import User
from backend.core.database import get_db
from backend.core.rbac import require_viewer, require_designer
from backend.services.connection_test_service import ConnectionTestService
from backend.services.cache_service import cache_service
from typing import Dict, Any, List, Optional
from backend import crud


router = APIRouter()


@router.get("/", response_model=list[Connector])
async def read_connectors(
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve connectors (all authenticated users can view)
    """
    connectors = await crud.connector.get_multi(db)
    return connectors


@router.post("/", response_model=Connector)
async def create_connector(
    connector: ConnectorCreate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new connector (Designer, Developer, Admin only)
    """
    connector.owner_id = connector.owner_id or current_user.id
    db_connector = await crud.connector.create(db, obj_in=connector)
    await cache_service.invalidate_api_cache("connectors")  # CACHE-001
    return db_connector


@router.get("/{connector_id}", response_model=Connector)
async def read_connector(
    connector_id: int,
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific connector by ID (all authenticated users can view)
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    return connector


@router.put("/{connector_id}", response_model=Connector)
async def update_connector(
    connector_id: int,
    connector_in: ConnectorUpdate,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a connector (Designer, Developer, Admin only)
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    connector = await crud.connector.update(db, db_obj=connector, obj_in=connector_in)
    await cache_service.invalidate_api_cache("connectors")  # CACHE-001
    return connector


@router.delete("/{connector_id}", response_model=Connector)
async def delete_connector(
    connector_id: int,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a connector (Designer, Developer, Admin only)
    """
    connector = await crud.connector.remove(db, id=connector_id)
    await cache_service.invalidate_api_cache("connectors")  # CACHE-001
    return connector


@router.post("/{connector_id}/test", response_model=Dict[str, Any])
async def test_connector_connection(
    connector_id: int,
    current_user: User = Depends(require_designer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Test connection for an existing connector
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    # Get configuration and type
    config = connector.config
    connector_type = connector.connector_type
    
    try:
        result = await ConnectionTestService.test_connection(
            connector_type,
            config
        )
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")


@router.get("/{connector_id}/columns", response_model=Dict[str, Any])
async def get_connector_columns(
    connector_id: int,
    table: Optional[str] = None,
    schema: str = "public",
    current_user: User = Depends(require_viewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Return column names and sample values for a connector (csv_file supported).
    """
    connector = await crud.connector.get(db, id=connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    if connector.connector_type == "csv_file":
        import csv as _csv
        import os

        file_path: str = connector.config.get("file_path", "")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(
                status_code=422,
                detail=f"Source file not found: {file_path or '(no path configured)'}",
            )

        encoding = connector.config.get("encoding", "utf-8")
        delimiter = connector.config.get("delimiter", ",")
        has_header = connector.config.get("has_header", True)
        sample_limit = 5

        columns: List[str] = []
        sample_values: Dict[str, List[Any]] = {}

        try:
            with open(file_path, "r", encoding=encoding, newline="") as f:
                if has_header:
                    reader = _csv.DictReader(f, delimiter=delimiter)
                    for i, row in enumerate(reader):
                        if i == 0:
                            columns = list(row.keys())
                            for col in columns:
                                sample_values[col] = []
                        for col in columns:
                            if len(sample_values[col]) < sample_limit:
                                val = row.get(col, "")
                                if val not in sample_values[col]:
                                    sample_values[col].append(val)
                        if i >= sample_limit - 1:
                            break
                else:
                    raw = list(_csv.reader(f, delimiter=delimiter))
                    if raw:
                        columns = [f"col_{i}" for i in range(len(raw[0]))]
                        for col in columns:
                            sample_values[col] = []
                        for row in raw[:sample_limit]:
                            for j, col in enumerate(columns):
                                val = row[j] if j < len(row) else ""
                                if val not in sample_values[col]:
                                    sample_values[col].append(val)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not read file: {e}")

        return {"columns": columns, "sample_values": sample_values}

    if connector.connector_type == "postgresql":
        import asyncpg

        if not table:
            raise HTTPException(
                status_code=422,
                detail="A 'table' query parameter is required for PostgreSQL connectors.",
            )

        ssl_req = connector.config.get("ssl_mode", "disable") in ("require", "verify-ca", "verify-full")
        try:
            conn = await asyncpg.connect(
                host=connector.config.get("host", "db"),
                port=int(connector.config.get("port", 5432)),
                database=connector.config.get("database"),
                user=connector.config.get("username"),
                password=connector.config.get("password"),
                ssl=ssl_req,
                timeout=10,
            )
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not connect: {e}")

        try:
            col_rows = await conn.fetch(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position",
                schema, table,
            )
            columns = [r["column_name"] for r in col_rows]

            sample_values: Dict[str, List[Any]] = {c: [] for c in columns}
            if columns:
                quoted = f'"{schema}"."{table}"'
                sample_rows = await conn.fetch(f"SELECT * FROM {quoted} LIMIT 5")
                for row in sample_rows:
                    for col in columns:
                        v = str(row[col]) if row[col] is not None else ""
                        if v and v not in sample_values[col]:
                            sample_values[col].append(v)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not read table columns: {e}")
        finally:
            await conn.close()

        return {"columns": columns, "sample_values": sample_values}

    raise HTTPException(
        status_code=422,
        detail=f"Column introspection is not supported for connector type '{connector.connector_type}'.",
    )