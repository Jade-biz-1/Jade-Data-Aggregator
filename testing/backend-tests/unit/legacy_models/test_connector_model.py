"""
Unit Tests for Connector Model
Data Aggregator Platform - Testing Framework

Tests cover:
- Connector creation with valid data
- Connector types (database, api, saas, file)
- Connector configuration validation
- Connector-user relationship (owner)
- Connector active status
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.core.security import get_password_hash
from backend.models.connector import Connector
from backend.models.user import User


@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory database for each test"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user for connector ownership"""
    user = User(
        username="connectorowner",
        email="connectorowner@example.com",
        hashed_password=get_password_hash("Pass123!"),
        role="developer"
    )
    db_session.add(user)
    db_session.commit()
    return user


class TestConnectorModelCreation:
    """Test connector model creation and basic operations"""
    
    def test_create_connector_with_required_fields(self, db_session, test_user):
        """Test creating a connector with all required fields"""
        connector = Connector(
            name="Test Connector",
            connector_type="database",
            config={"host": "localhost", "port": 5432, "database": "test"},
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.id is not None
        assert connector.name == "Test Connector"
        assert connector.connector_type == "database"
        assert connector.config == {"host": "localhost", "port": 5432, "database": "test"}
        assert connector.owner_id == test_user.id
        assert connector.is_active is True  # Default value
    
    def test_connector_requires_owner(self, db_session):
        """Test that connector requires an owner_id"""
        connector = Connector(
            name="Orphan Connector",
            connector_type="api",
            config={"url": "https://api.example.com"}
        )
        db_session.add(connector)
        
        with pytest.raises(Exception):  # IntegrityError
            db_session.commit()
    
    def test_connector_timestamps_created(self, db_session, test_user):
        """Test that created_at timestamp is set automatically"""
        connector = Connector(
            name="Time Connector",
            connector_type="file",
            config={"path": "/data"},
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.created_at is not None


class TestConnectorTypes:
    """Test different connector types"""
    
    @pytest.mark.parametrize("connector_type,config", [
        ("database", {"host": "localhost", "port": 5432}),
        ("rest_api", {"url": "https://api.example.com"}),
        ("saas", {"provider": "salesforce", "api_key": "secret"}),
        ("file", {"path": "/data/files", "format": "csv"}),
    ])
    def test_create_connector_with_different_types(self, db_session, test_user, connector_type, config):
        """Test creating connectors of different types"""
        connector = Connector(
            name=f"{connector_type.upper()} Connector",
            connector_type=connector_type,
            config=config,
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.connector_type == connector_type
        assert connector.config == config
    
    def test_database_connector_config(self, db_session, test_user):
        """Test database connector with specific config"""
        connector = Connector(
            name="PostgreSQL Connector",
            connector_type="database",
            config={
                "host": "db.example.com",
                "port": 5432,
                "database": "production",
                "username": "dbuser",
                "ssl": True
            },
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.config["host"] == "db.example.com"
        assert connector.config["ssl"] is True
    
    def test_api_connector_config(self, db_session, test_user):
        """Test REST API connector with authentication"""
        connector = Connector(
            name="API Connector",
            connector_type="rest_api",
            config={
                "base_url": "https://api.example.com/v1",
                "auth_type": "bearer",
                "headers": {"Content-Type": "application/json"}
            },
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.config["auth_type"] == "bearer"


class TestConnectorActiveStatus:
    """Test connector active status functionality"""
    
    def test_connector_is_active_by_default(self, db_session, test_user):
        """Test that connectors are active by default"""
        connector = Connector(
            name="Active Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.is_active is True
    
    def test_connector_can_be_deactivated(self, db_session, test_user):
        """Test that connectors can be deactivated"""
        connector = Connector(
            name="Inactive Connector",
            connector_type="api",
            config={"url": "https://old-api.example.com"},
            is_active=False,
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.is_active is False
    
    def test_connector_can_be_reactivated(self, db_session, test_user):
        """Test that deactivated connectors can be reactivated"""
        connector = Connector(
            name="Reactivate Connector",
            connector_type="file",
            config={"path": "/data"},
            is_active=False,
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        
        assert connector.is_active is False
        
        # Reactivate
        connector.is_active = True
        db_session.commit()
        
        assert connector.is_active is True


class TestConnectorUserRelationship:
    """Test connector-user relationship (ownership)"""
    
    def test_connector_has_owner_relationship(self, db_session, test_user):
        """Test that connector has owner relationship to user"""
        connector = Connector(
            name="Owned Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        db_session.add(connector)
        db_session.commit()
        db_session.refresh(connector)
        
        assert connector.owner is not None
        assert connector.owner.id == test_user.id
        assert connector.owner.username == "connectorowner"
    
    def test_user_has_connectors_relationship(self, db_session, test_user):
        """Test that user can access their connectors"""
        connector1 = Connector(
            name="DB Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        connector2 = Connector(
            name="API Connector",
            connector_type="rest_api",
            config={"url": "https://api.example.com"},
            owner_id=test_user.id
        )
        db_session.add_all([connector1, connector2])
        db_session.commit()
        db_session.refresh(test_user)
        
        assert len(test_user.connectors) == 2
        connector_names = [c.name for c in test_user.connectors]
        assert "DB Connector" in connector_names
        assert "API Connector" in connector_names


# Run with: pytest testing/backend-tests/unit/legacy_models/test_connector_model.py -v
