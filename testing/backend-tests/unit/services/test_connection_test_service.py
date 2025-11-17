from unittest.mock import MagicMock, patch

import pytest

from backend.services.connection_test_service import ConnectionTestService


@pytest.mark.asyncio
async def test_mysql_connection_success():
    config = {
        "connector_type": "mysql",
        "host": "db",
        "port": 3306,
        "database": "testdb",
        "username": "user",
        "password": "secret",
        "charset": "utf8mb4",
    }

    engine_mock = MagicMock()
    connection_mock = MagicMock()

    context_manager = MagicMock()
    context_manager.__enter__.return_value = connection_mock
    context_manager.__exit__.return_value = False
    engine_mock.connect.return_value = context_manager

    health_result = MagicMock()
    health_result.fetchone.return_value = (1,)

    version_result = MagicMock()
    version_result.fetchone.return_value = ("MySQL 8.0",)

    connection_mock.execute.side_effect = [health_result, version_result]

    with patch("backend.services.connection_test_service.create_engine", return_value=engine_mock) as create_engine_mock:
        result = await ConnectionTestService.test_connection("mysql", config)

    create_engine_mock.assert_called_once()
    engine_mock.dispose.assert_called_once()

    assert result.success is True
    assert result.details["database_type"] == "mysql"
    assert result.details["database"] == "testdb"
    assert "Successfully connected" in result.message


@pytest.mark.asyncio
async def test_mysql_connection_failure():
    config = {
        "connector_type": "mysql",
        "host": "db",
        "port": 3306,
        "database": "testdb",
        "username": "user",
        "password": "secret",
    }

    with patch("backend.services.connection_test_service.create_engine", side_effect=Exception("boom")):
        result = await ConnectionTestService.test_connection("mysql", config)

    assert result.success is False
    assert "Connection failed" in result.message
    assert result.details["error_type"] == "Exception"


def test_build_mysql_connection_string_includes_charset():
    connection_string = ConnectionTestService._build_mysql_connection_string(
        {
            "host": "db",
            "port": 3307,
            "database": "analytics",
            "username": "alice",
            "password": "secret",
            "charset": "latin1",
        }
    )

    assert connection_string == "mysql+pymysql://alice:secret@db:3307/analytics?charset=latin1"


def test_build_postgres_connection_string_with_ssl():
    connection_string = ConnectionTestService._build_postgres_connection_string(
        {
            "host": "postgres",
            "port": 5432,
            "database": "datasvc",
            "username": "bob",
            "password": "s3cr3t",
            "ssl_mode": "require",
        }
    )

    assert connection_string == "postgresql://bob:s3cr3t@postgres:5432/datasvc?sslmode=require"


def test_build_postgres_connection_string_without_ssl():
    connection_string = ConnectionTestService._build_postgres_connection_string(
        {
            "host": "postgres",
            "port": 5432,
            "database": "datasvc",
            "username": "bob",
            "password": "s3cr3t",
            "ssl_mode": "disable",
        }
    )

    assert connection_string == "postgresql://bob:s3cr3t@postgres:5432/datasvc"


@pytest.mark.asyncio
async def test_unsupported_connector_type_returns_failure():
    result = await ConnectionTestService.test_connection("unknown", {"connector_type": "unknown"})

    assert result.success is False
    assert "not implemented" in result.message
