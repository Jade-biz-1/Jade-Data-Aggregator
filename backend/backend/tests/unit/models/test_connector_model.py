"""
Unit tests for Connector model
Tests connector creation, validation, types, and CRUD operations
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from backend.models.connector import Connector
from backend.models.user import User
from backend.core.security import get_password_hash


class TestConnectorModel:
    """Test suite for Connector model"""

    @pytest.fixture
    async def test_user(self, test_session):
        """Create a test user for connector ownership"""
        user = User(
            username="connectorowner",
            email="connectorowner@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="developer"
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    async def test_create_database_connector(self, test_session, test_user):
        """Test creating a database connector"""
        connector = Connector(
            name="PostgreSQL Connector",
            connector_type="database",
            config={
                "host": "localhost",
                "port": 5432,
                "database": "production_db",
                "username": "dbuser"
            },
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.id is not None
        assert connector.name == "PostgreSQL Connector"
        assert connector.connector_type == "database"
        assert connector.config["host"] == "localhost"
        assert connector.config["port"] == 5432
        assert connector.is_active is True
        assert connector.owner_id == test_user.id

    async def test_create_rest_api_connector(self, test_session, test_user):
        """Test creating a REST API connector"""
        connector = Connector(
            name="External API",
            connector_type="rest_api",
            config={
                "base_url": "https://api.example.com",
                "auth_type": "bearer",
                "headers": {"Content-Type": "application/json"}
            },
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.connector_type == "rest_api"
        assert connector.config["base_url"] == "https://api.example.com"
        assert connector.config["auth_type"] == "bearer"

    async def test_create_file_connector(self, test_session, test_user):
        """Test creating a file-based connector"""
        connector = Connector(
            name="CSV File Connector",
            connector_type="file",
            config={
                "file_type": "csv",
                "path": "/data/files",
                "delimiter": ",",
                "encoding": "utf-8"
            },
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.connector_type == "file"
        assert connector.config["file_type"] == "csv"
        assert connector.config["delimiter"] == ","

    async def test_create_saas_connector(self, test_session, test_user):
        """Test creating a SaaS platform connector"""
        connector = Connector(
            name="Salesforce Connector",
            connector_type="saas",
            config={
                "platform": "salesforce",
                "instance_url": "https://company.salesforce.com",
                "api_version": "v52.0",
                "oauth_config": {"client_id": "abc123"}
            },
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.connector_type == "saas"
        assert connector.config["platform"] == "salesforce"

    async def test_connector_missing_required_fields(self, test_session, test_user):
        """Test that required fields must be provided"""
        # Missing connector_type
        connector = Connector(
            name="Invalid Connector",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        test_session.add(connector)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_connector_missing_owner_id(self, test_session):
        """Test that owner_id is required"""
        connector = Connector(
            name="Orphan Connector",
            connector_type="database",
            config={"host": "localhost"}
        )
        test_session.add(connector)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_connector_user_relationship(self, test_session, test_user):
        """Test the relationship between Connector and User"""
        connector = Connector(
            name="Relationship Test",
            connector_type="api",
            config={"url": "http://test.com"},
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)
        await test_session.refresh(test_user)

        # Test forward relationship (connector -> user)
        assert connector.owner is not None
        assert connector.owner.id == test_user.id
        assert connector.owner.username == "connectorowner"

        # Test backward relationship (user -> connectors)
        assert len(test_user.connectors) > 0
        assert connector in test_user.connectors

    async def test_connector_is_active_flag(self, test_session, test_user):
        """Test connector activation/deactivation"""
        connector = Connector(
            name="Active Test",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.is_active is True

        # Deactivate connector
        connector.is_active = False
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.is_active is False

    async def test_connector_timestamps(self, test_session, test_user):
        """Test that timestamps are set automatically"""
        connector = Connector(
            name="Timestamp Test",
            connector_type="api",
            config={"url": "http://test.com"},
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        assert connector.created_at is not None
        assert isinstance(connector.created_at, datetime)

    async def test_connector_query_by_type(self, test_session, test_user):
        """Test querying connectors by type"""
        from sqlalchemy import select

        # Create multiple connectors of different types
        db_connector = Connector(
            name="DB Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        api_connector = Connector(
            name="API Connector",
            connector_type="rest_api",
            config={"url": "http://api.com"},
            owner_id=test_user.id
        )
        test_session.add_all([db_connector, api_connector])
        await test_session.commit()

        # Query for database connectors
        result = await test_session.execute(
            select(Connector).where(Connector.connector_type == "database")
        )
        db_connectors = result.scalars().all()

        assert len(db_connectors) >= 1
        assert all(c.connector_type == "database" for c in db_connectors)

    async def test_connector_delete(self, test_session, test_user):
        """Test deleting a connector"""
        from sqlalchemy import select

        connector = Connector(
            name="Delete Test",
            connector_type="api",
            config={"url": "http://test.com"},
            owner_id=test_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        connector_id = connector.id

        await test_session.delete(connector)
        await test_session.commit()

        result = await test_session.execute(
            select(Connector).where(Connector.id == connector_id)
        )
        deleted_connector = result.scalar_one_or_none()

        assert deleted_connector is None
