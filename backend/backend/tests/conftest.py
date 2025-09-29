import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.core.database import get_db, Base
from backend.core.config import settings
from backend.models import user, pipeline, connector, transformation


# Test database URL - using in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_maker() as session:
        yield session


@pytest.fixture
async def test_client(test_session):
    """Create a test client with dependency overrides."""

    def get_test_db():
        return test_session

    app.dependency_overrides[get_db] = get_test_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user_data():
    """Sample user data for tests."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpassword123"
    }


@pytest.fixture
async def test_pipeline_data():
    """Sample pipeline data for tests."""
    return {
        "name": "Test Pipeline",
        "description": "A test pipeline for unit testing",
        "source_config": {"type": "test", "data": "test_source"},
        "destination_config": {"type": "test", "data": "test_dest"},
        "is_active": True
    }


@pytest.fixture
async def test_connector_data():
    """Sample connector data for tests."""
    return {
        "name": "Test Connector",
        "connector_type": "database",
        "config": {"host": "localhost", "port": 5432, "database": "test"},
        "is_active": True
    }


@pytest.fixture
async def test_transformation_data():
    """Sample transformation data for tests."""
    return {
        "name": "Test Transformation",
        "transformation_type": "mapping",
        "config": {"source_field": "name", "target_field": "full_name"},
        "is_active": True
    }