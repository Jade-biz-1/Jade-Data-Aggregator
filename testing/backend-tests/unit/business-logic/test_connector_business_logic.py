"""
Unit Tests for Connector Business Logic
Data Aggregator Platform - Testing Framework - Week 95 TEST-007

Tests cover:
- Connector CRUD operations
- Connection testing (database, API, file)
- Configuration validation
- Connector type validation
- Owner relationship management

Total: 20 tests for connector business logic
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch, MagicMock

import pytest

from backend.crud.connector import CRUDConnector, connector
from backend.models.connector import Connector
from backend.schemas.connector import ConnectorCreate, ConnectorUpdate
from backend.services.connection_test_service import ConnectionTestService, ConnectionTestResult


class TestConnectorCRUDOperations:
    """Test connector CRUD operations"""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session"""
        session = AsyncMock()
        return session

    @pytest.fixture
    def sample_connector(self):
        """Create a sample connector"""
        return Connector(
            id=1,
            name="Test Database Connector",
            connector_type="database",
            config={
                "host": "localhost",
                "port": 5432,
                "database": "test_db",
                "username": "test_user"
            },
            is_active=True,
            owner_id=1
        )

    # CRUD Tests

    @pytest.mark.asyncio
    async def test_create_connector(self, mock_db_session):
        """Test creating a new connector"""
        crud = CRUDConnector()

        connector_create = ConnectorCreate(
            name="API Connector",
            connector_type="rest_api",
            config={
                "base_url": "https://api.example.com",
                "api_key": "secret_key"
            },
            is_active=True,
            owner_id=1
        )

        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.create(db=mock_db_session, obj_in=connector_create)

        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()
        assert result.name == "API Connector"
        assert result.connector_type == "rest_api"

    @pytest.mark.asyncio
    async def test_get_connector_by_id(self, mock_db_session, sample_connector):
        """Test retrieving connector by ID"""
        crud = CRUDConnector()

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_connector
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get(db=mock_db_session, id=1)

        assert result is not None
        assert result.id == 1
        assert result.name == "Test Database Connector"

    @pytest.mark.asyncio
    async def test_get_connector_not_found(self, mock_db_session):
        """Test retrieving non-existent connector"""
        crud = CRUDConnector()

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get(db=mock_db_session, id=99999)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_multiple_connectors(self, mock_db_session):
        """Test retrieving multiple connectors with pagination"""
        crud = CRUDConnector()

        connectors = [
            Connector(id=1, name="DB Connector", connector_type="database", config={}, owner_id=1),
            Connector(id=2, name="API Connector", connector_type="rest_api", config={}, owner_id=1),
            Connector(id=3, name="File Connector", connector_type="file", config={}, owner_id=1)
        ]

        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = connectors
        mock_db_session.execute = AsyncMock(return_value=mock_result)

        result = await crud.get_multi(db=mock_db_session, skip=0, limit=10)

        assert len(result) == 3
        assert result[0].connector_type == "database"
        assert result[1].connector_type == "rest_api"

    @pytest.mark.asyncio
    async def test_update_connector(self, mock_db_session, sample_connector):
        """Test updating connector"""
        crud = CRUDConnector()

        connector_update = ConnectorUpdate(
            name="Updated Connector",
            is_active=False
        )

        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()

        result = await crud.update(
            db=mock_db_session,
            db_obj=sample_connector,
            obj_in=connector_update
        )

        assert sample_connector.name == "Updated Connector"
        assert sample_connector.is_active == False
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_connector(self, mock_db_session, sample_connector):
        """Test deleting connector"""
        crud = CRUDConnector()

        # Mock get to return the connector
        crud.get = AsyncMock(return_value=sample_connector)
        mock_db_session.delete = AsyncMock()
        mock_db_session.commit = AsyncMock()

        result = await crud.remove(db=mock_db_session, id=1)

        assert result == sample_connector
        mock_db_session.delete.assert_called_once_with(sample_connector)
        mock_db_session.commit.assert_called_once()


class TestDatabaseConnectionTesting:
    """Test database connection testing functionality"""

    @pytest.mark.asyncio
    async def test_test_database_connection_success(self):
        """Test successful database connection"""
        config = {
            "connector_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database": "test_db",
            "username": "test_user",
            "password": "test_pass"
        }

        # Mock successful database connection
        with patch('sqlalchemy.create_engine') as mock_create_engine:
            mock_engine = MagicMock()
            mock_connection = MagicMock()
            mock_result = MagicMock()
            mock_result.fetchone.return_value = ("PostgreSQL 14.0",)

            mock_connection.execute.return_value = mock_result
            mock_connection.__enter__.return_value = mock_connection
            mock_connection.__exit__.return_value = None
            mock_engine.connect.return_value = mock_connection
            mock_engine.dispose = Mock()
            mock_create_engine.return_value = mock_engine

            result = await ConnectionTestService.test_database_connection(config)

            assert result.success is True
            assert "Successfully connected" in result.message
            assert result.details["database_type"] == "postgresql"
            assert result.duration_ms is not None

    @pytest.mark.asyncio
    async def test_test_database_connection_failure(self):
        """Test failed database connection"""
        config = {
            "connector_type": "postgresql",
            "host": "invalid_host",
            "port": 5432,
            "database": "test_db",
            "username": "test_user",
            "password": "wrong_pass"
        }

        # Mock connection failure
        with patch('sqlalchemy.create_engine', side_effect=Exception("Connection refused")):
            result = await ConnectionTestService.test_database_connection(config)

            assert result.success is False
            assert "error" in result.message.lower() or "failed" in result.message.lower()

    @pytest.mark.asyncio
    async def test_test_mysql_connection(self):
        """Test MySQL connection testing"""
        config = {
            "connector_type": "mysql",
            "host": "localhost",
            "port": 3306,
            "database": "test_db",
            "username": "root",
            "password": "password"
        }

        with patch('sqlalchemy.create_engine') as mock_create_engine:
            mock_engine = MagicMock()
            mock_connection = MagicMock()
            mock_result = MagicMock()
            mock_result.fetchone.return_value = ("8.0.30",)

            mock_connection.execute.return_value = mock_result
            mock_connection.__enter__.return_value = mock_connection
            mock_connection.__exit__.return_value = None
            mock_engine.connect.return_value = mock_connection
            mock_engine.dispose = Mock()
            mock_create_engine.return_value = mock_engine

            result = await ConnectionTestService.test_database_connection(config)

            assert result.success is True
            assert result.details["database_type"] == "mysql"

    @pytest.mark.asyncio
    async def test_unsupported_database_type(self):
        """Test unsupported database type"""
        config = {
            "connector_type": "oracle",  # Unsupported
            "host": "localhost"
        }

        result = await ConnectionTestService.test_database_connection(config)

        assert result.success is False
        assert "Unsupported" in result.message


class TestAPIConnectionTesting:
    """Test API connection testing functionality"""

    @pytest.mark.asyncio
    async def test_test_api_connection_success(self):
        """Test successful API connection"""
        config = {
            "base_url": "https://api.example.com",
            "api_key": "test_key",
            "timeout": 30
        }

        # Mock successful API response
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"status": "ok"}
            mock_get.return_value = mock_response

            result = await ConnectionTestService.test_api_connection(config)

            assert result.success is True
            assert result.details["status_code"] == 200

    @pytest.mark.asyncio
    async def test_test_api_connection_timeout(self):
        """Test API connection timeout"""
        config = {
            "base_url": "https://slow-api.example.com",
            "timeout": 1
        }

        # Mock timeout
        with patch('requests.get', side_effect=requests.exceptions.Timeout("Request timeout")):
            result = await ConnectionTestService.test_api_connection(config)

            assert result.success is False
            assert "timeout" in result.message.lower()

    @pytest.mark.asyncio
    async def test_test_api_connection_invalid_url(self):
        """Test API connection with invalid URL"""
        config = {
            "base_url": "not-a-valid-url",
            "api_key": "test"
        }

        with patch('requests.get', side_effect=requests.exceptions.InvalidURL("Invalid URL")):
            result = await ConnectionTestService.test_api_connection(config)

            assert result.success is False


class TestFileConnectionTesting:
    """Test file connector testing functionality"""

    @pytest.mark.asyncio
    async def test_test_file_connection_success(self):
        """Test successful file connection (path exists)"""
        config = {
            "file_path": "/tmp/test_file.csv",
            "file_type": "csv"
        }

        with patch('os.path.exists', return_value=True):
            with patch('os.access', return_value=True):
                result = await ConnectionTestService.test_file_connection(config)

                assert result.success is True
                assert "accessible" in result.message.lower()

    @pytest.mark.asyncio
    async def test_test_file_connection_not_found(self):
        """Test file connection when file doesn't exist"""
        config = {
            "file_path": "/nonexistent/path/file.csv"
        }

        with patch('os.path.exists', return_value=False):
            result = await ConnectionTestService.test_file_connection(config)

            assert result.success is False
            assert "not found" in result.message.lower() or "does not exist" in result.message.lower()

    @pytest.mark.asyncio
    async def test_test_file_connection_no_permission(self):
        """Test file connection with no read permission"""
        config = {
            "file_path": "/protected/file.csv"
        }

        with patch('os.path.exists', return_value=True):
            with patch('os.access', return_value=False):
                result = await ConnectionTestService.test_file_connection(config)

                assert result.success is False
                assert "permission" in result.message.lower() or "access" in result.message.lower()


class TestConnectorBusinessRules:
    """Test connector business rules and constraints"""

    def test_connector_name_required(self):
        """Test that connector name is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            ConnectorCreate(
                name=None,  # Invalid: name required
                connector_type="database",
                config={},
                owner_id=1
            )

    def test_connector_type_required(self):
        """Test that connector type is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            ConnectorCreate(
                name="Test",
                connector_type=None,  # Invalid: required
                config={},
                owner_id=1
            )

    def test_connector_config_required(self):
        """Test that connector configuration is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            ConnectorCreate(
                name="Test",
                connector_type="database",
                config=None,  # Invalid: required
                owner_id=1
            )

    def test_connector_active_state_default(self):
        """Test that connector is active by default"""
        connector_create = ConnectorCreate(
            name="Test",
            connector_type="database",
            config={},
            owner_id=1
        )

        # Should default to True
        assert connector_create.is_active == True


class TestConnectionTestResult:
    """Test connection test result class"""

    def test_connection_test_result_creation(self):
        """Test creating connection test result"""
        result = ConnectionTestResult(
            success=True,
            message="Connection successful",
            details={"version": "14.0"},
            duration_ms=150.5
        )

        assert result.success is True
        assert result.message == "Connection successful"
        assert result.details["version"] == "14.0"
        assert result.duration_ms == 150.5
        assert result.tested_at is not None

    def test_connection_test_result_to_dict(self):
        """Test converting connection test result to dictionary"""
        result = ConnectionTestResult(
            success=True,
            message="Test message",
            details={"key": "value"},
            duration_ms=100.0
        )

        result_dict = result.to_dict()

        assert result_dict["success"] is True
        assert result_dict["message"] == "Test message"
        assert result_dict["details"]["key"] == "value"
        assert result_dict["duration_ms"] == 100.0
        assert "tested_at" in result_dict


# Run with: pytest testing/backend-tests/unit/business-logic/test_connector_business_logic.py -v
# Run with coverage: pytest testing/backend-tests/unit/business-logic/test_connector_business_logic.py -v --cov=backend.crud.connector --cov=backend.services.connection_test_service --cov-report=term-missing
