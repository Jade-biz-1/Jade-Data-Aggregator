# testing/backend-tests/unit/services/test_search_service.py

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm.exc import NoResultFound
import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')))

from backend.services.search_service import SearchService, SearchResult
from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector

@pytest.fixture
def mock_db_session():
    """Provides a mock SQLAlchemy AsyncSession."""
    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    return session

@pytest.fixture
def search_service(mock_db_session):
    """Provides an instance of SearchService with a mocked DB session."""
    return SearchService(mock_db_session)

@pytest.mark.asyncio
async def test_search_with_empty_query(search_service: SearchService):
    """
    Test that searching with an empty or whitespace query returns no results.
    """
    results = await search_service.search("")
    assert results == []

    results_ws = await search_service.search("   ")
    assert results_ws == []

@pytest.mark.asyncio
async def test_search_finds_users(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that the search function can find users by username, email, or full name.
    """
    mock_user = User(id=1, username="testuser", email="test@example.com", full_name="Test User Name")
    
    # Mock the database response
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_user]
    mock_db_session.execute.return_value = mock_result

    # Search for username
    results = await search_service.search("testuser")
    
    assert len(results) == 1
    assert isinstance(results[0], SearchResult)
    assert results[0].type == "User"
    assert results[0].title == "testuser"
    assert "test@example.com" in results[0].description
    assert results[0].url == "/admin/users/1"

@pytest.mark.asyncio
async def test_search_finds_pipelines(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that the search function can find pipelines by name or description.
    """
    mock_pipeline = Pipeline(id=1, name="My ETL Pipeline", description="Processes daily sales data.")
    
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_pipeline]
    # To simulate other models not being found
    mock_db_session.execute.side_effect = [
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))), # For Users
        mock_result, # For Pipelines
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))), # For Connectors
    ]

    results = await search_service.search("ETL")
    
    assert len(results) == 1
    assert results[0].type == "Pipeline"
    assert results[0].title == "My ETL Pipeline"
    assert "Processes daily sales data" in results[0].description
    assert results[0].url == "/pipelines/1"

@pytest.mark.asyncio
async def test_search_finds_connectors(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that the search function can find connectors by name.
    """
    mock_connector = Connector(id=1, name="PostgreSQL Source Connector", connector_type="source")

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_connector]
    mock_db_session.execute.side_effect = [
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
        mock_result,
    ]

    results = await search_service.search("PostgreSQL")
    
    assert len(results) == 1
    assert results[0].type == "Connector"
    assert results[0].title == "PostgreSQL Source Connector"
    assert "source" in results[0].description
    assert results[0].url == "/connectors/1"

@pytest.mark.asyncio
async def test_search_returns_multiple_result_types(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that a single query can return results from multiple tables.
    """
    mock_user = User(id=1, username="test_admin")
    mock_pipeline = Pipeline(id=2, name="Admin Data Pipeline")

    mock_user_result = MagicMock()
    mock_user_result.scalars.return_value.all.return_value = [mock_user]
    
    mock_pipeline_result = MagicMock()
    mock_pipeline_result.scalars.return_value.all.return_value = [mock_pipeline]
    
    mock_db_session.execute.side_effect = [
        mock_user_result,
        mock_pipeline_result,
        MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))), # No connectors
    ]

    results = await search_service.search("Admin")
    
    assert len(results) == 2
    
    result_types = {res.type for res in results}
    assert "User" in result_types
    assert "Pipeline" in result_types

@pytest.mark.asyncio
async def test_search_with_no_results(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that an empty list is returned when a query matches nothing.
    """
    mock_empty_result = MagicMock()
    mock_empty_result.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_empty_result

    results = await search_service.search("nonexistent_term_xyz")
    
    assert results == []

@pytest.mark.asyncio
async def test_search_handles_database_error(search_service: SearchService, mock_db_session: AsyncMock):
    """
    Test that the search function gracefully handles database exceptions.
    """
    mock_db_session.execute.side_effect = Exception("Database connection failed")

    # The service should catch the exception and return an empty list or re-raise a specific app exception
    # For this test, we assume it logs the error and returns empty.
    results = await search_service.search("any_query")
    
    assert results == []
