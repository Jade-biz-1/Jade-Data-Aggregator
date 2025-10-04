"""
Global Search API Endpoints

API endpoints for global search functionality.
Part of Phase 6: Advanced Search (F025)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from pydantic import BaseModel

from backend.core.database import get_db
from backend.services.search_service import GlobalSearchService


router = APIRouter(prefix="/search", tags=["search"])
search_service = GlobalSearchService()


class SearchRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None
    limit: int = 50
    offset: int = 0


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    entity_types: Optional[str] = Query(None, description="Comma-separated entity types"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Global search across all entities

    Search across pipelines, connectors, transformations, users, files, templates, etc.
    """
    types_list = None
    if entity_types:
        types_list = [t.strip() for t in entity_types.split(",")]

    results = await search_service.search_all(
        db=db,
        query=q,
        limit=limit,
        offset=offset,
        entity_types=types_list
    )

    return results


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    limit: int = Query(10, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get search suggestions based on partial query"""
    suggestions = await search_service.get_search_suggestions(
        db=db,
        partial_query=q,
        limit=limit
    )

    return {
        "query": q,
        "suggestions": suggestions
    }


@router.get("/pipelines")
async def search_pipelines(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Search pipelines only"""
    results = await search_service.search_pipelines(
        db=db,
        query=f"%{q}%",
        limit=limit,
        offset=offset
    )

    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


@router.get("/connectors")
async def search_connectors(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Search connectors only"""
    results = await search_service.search_connectors(
        db=db,
        query=f"%{q}%",
        limit=limit,
        offset=offset
    )

    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


@router.get("/users")
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Search users only"""
    results = await search_service.search_users(
        db=db,
        query=f"%{q}%",
        limit=limit,
        offset=offset
    )

    return {
        "query": q,
        "results": results,
        "count": len(results)
    }
