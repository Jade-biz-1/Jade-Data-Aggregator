"""
API-001: Shared pagination response schema.

All list endpoints that support offset/limit pagination return this wrapper
so the frontend can drive paginated tables without additional count requests.
"""

from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    page: int          # 1-based page number (skip // limit + 1)
    pages: int         # total number of pages (ceil(total / limit))
    has_more: bool     # True when there are more items beyond this page

    class Config:
        from_attributes = True
