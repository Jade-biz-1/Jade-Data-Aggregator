"""
Integration tests for Connector CRUD operations
Tests full connector workflow through API endpoints with authentication
"""

import pytest
from httpx import AsyncClient
from backend.models.user import User
from backend.models.connector import Connector
from backend.core.security import get_password_hash


class TestConnectorCRUD:
    """Test suite for Connector CRUD API endpoints"""

    @pytest.fixture
    async def designer_user(self, test_session):
        """Create a designer user for testing"""
        user = User(
            username="designer_conn",
            email="designer_conn@test.com",
            hashed_password=get_password_hash("Designer123!@#"),
            role="designer",
            is_active=True
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    @pytest.fixture
    async def viewer_user(self, test_session):
        """Create a viewer user for testing"""
        user = User(
            username="viewer_conn",
            email="viewer_conn@test.com",
            hashed_password=get_password_hash("Viewer123!@#"),
            role="viewer",
            is_active=True
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    @pytest.fixture
    def database_connector_data(self):
        """Sample database connector data"""
        return {
            "name": "PostgreSQL Production",
            "connector_type": "database",
            "config": {
                "host": "prod-db.example.com",
                "port": 5432,
                "database": "production",
                "username": "dbuser",
                "ssl": True
            },
            "is_active": True
        }

    @pytest.fixture
    def api_connector_data(self):
        """Sample API connector data"""
        return {
            "name": "External REST API",
            "connector_type": "rest_api",
            "config": {
                "base_url": "https://api.example.com/v1",
                "auth_type": "bearer",
                "timeout": 30,
                "retry_count": 3
            },
            "is_active": True
        }

    async def test_create_database_connector(self, test_client, designer_user, database_connector_data):
        """Test creating a database connector"""
        response = await test_client.post(
            "/api/v1/connectors/",
            json=database_connector_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == database_connector_data["name"]
        assert data["connector_type"] == "database"
        assert data["config"]["host"] == "prod-db.example.com"
        assert data["is_active"] is True
        assert "id" in data

    async def test_create_api_connector(self, test_client, designer_user, api_connector_data):
        """Test creating an API connector"""
        response = await test_client.post(
            "/api/v1/connectors/",
            json=api_connector_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["connector_type"] == "rest_api"
        assert data["config"]["base_url"] == "https://api.example.com/v1"

    async def test_create_file_connector(self, test_client, designer_user):
        """Test creating a file connector"""
        file_connector = {
            "name": "CSV File Source",
            "connector_type": "file",
            "config": {
                "file_type": "csv",
                "path": "/data/files",
                "delimiter": ",",
                "encoding": "utf-8"
            },
            "is_active": True
        }

        response = await test_client.post(
            "/api/v1/connectors/",
            json=file_connector,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["connector_type"] == "file"
        assert data["config"]["file_type"] == "csv"

    async def test_create_saas_connector(self, test_client, designer_user):
        """Test creating a SaaS connector"""
        saas_connector = {
            "name": "Salesforce Connector",
            "connector_type": "saas",
            "config": {
                "platform": "salesforce",
                "instance_url": "https://company.salesforce.com",
                "api_version": "v52.0",
                "oauth_client_id": "abc123"
            },
            "is_active": True
        }

        response = await test_client.post(
            "/api/v1/connectors/",
            json=saas_connector,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["connector_type"] == "saas"
        assert data["config"]["platform"] == "salesforce"

    async def test_create_connector_viewer_forbidden(self, test_client, viewer_user, database_connector_data):
        """Test that viewers cannot create connectors"""
        response = await test_client.post(
            "/api/v1/connectors/",
            json=database_connector_data,
            headers={"Authorization": f"Bearer {viewer_user.id}"}
        )

        assert response.status_code == 403

    async def test_create_connector_missing_fields(self, test_client, designer_user):
        """Test connector creation with missing required fields"""
        invalid_data = {
            "name": "Invalid Connector"
            # Missing connector_type and config
        }

        response = await test_client.post(
            "/api/v1/connectors/",
            json=invalid_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 422
        errors = response.json()["detail"]
        field_names = [error["loc"][-1] for error in errors]
        assert "connector_type" in field_names
        assert "config" in field_names

    async def test_get_connector_by_id(self, test_session, test_client, designer_user):
        """Test retrieving a connector by ID"""
        connector = Connector(
            name="Test Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=designer_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        response = await test_client.get(
            f"/api/v1/connectors/{connector.id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == connector.id
        assert data["name"] == "Test Connector"

    async def test_get_connector_not_found(self, test_client, designer_user):
        """Test retrieving non-existent connector returns 404"""
        response = await test_client.get(
            "/api/v1/connectors/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_list_connectors(self, test_session, test_client, designer_user):
        """Test listing all connectors"""
        # Create multiple connectors
        connectors = [
            Connector(
                name=f"Connector {i}",
                connector_type="database",
                config={"host": f"host{i}"},
                owner_id=designer_user.id
            )
            for i in range(3)
        ]
        for connector in connectors:
            test_session.add(connector)
        await test_session.commit()

        response = await test_client.get(
            "/api/v1/connectors/",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    async def test_list_connectors_by_type(self, test_session, test_client, designer_user):
        """Test filtering connectors by type"""
        # Create connectors of different types
        db_connector = Connector(
            name="DB Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=designer_user.id
        )
        api_connector = Connector(
            name="API Connector",
            connector_type="rest_api",
            config={"url": "http://api.com"},
            owner_id=designer_user.id
        )
        test_session.add_all([db_connector, api_connector])
        await test_session.commit()

        # Filter by database type
        response = await test_client.get(
            "/api/v1/connectors/?connector_type=database",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert all(c["connector_type"] == "database" for c in data)

    async def test_update_connector_success(self, test_session, test_client, designer_user):
        """Test successful connector update"""
        connector = Connector(
            name="Original Name",
            connector_type="database",
            config={"host": "oldhost"},
            is_active=True,
            owner_id=designer_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        update_data = {
            "name": "Updated Name",
            "config": {"host": "newhost", "port": 5432},
            "is_active": False
        }

        response = await test_client.put(
            f"/api/v1/connectors/{connector.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["config"]["host"] == "newhost"
        assert data["is_active"] is False

    async def test_update_connector_partial(self, test_session, test_client, designer_user):
        """Test partial connector update"""
        connector = Connector(
            name="Test Connector",
            connector_type="database",
            config={"host": "localhost"},
            is_active=True,
            owner_id=designer_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        # Update only name
        update_data = {"name": "New Name Only"}

        response = await test_client.put(
            f"/api/v1/connectors/{connector.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name Only"
        assert data["connector_type"] == "database"  # Unchanged
        assert data["is_active"] is True  # Unchanged

    async def test_update_connector_not_found(self, test_client, designer_user):
        """Test updating non-existent connector returns 404"""
        update_data = {"name": "Updated"}

        response = await test_client.put(
            "/api/v1/connectors/99999",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_delete_connector_success(self, test_session, test_client, designer_user):
        """Test successful connector deletion"""
        connector = Connector(
            name="To Delete",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=designer_user.id
        )
        test_session.add(connector)
        await test_session.commit()
        await test_session.refresh(connector)

        connector_id = connector.id

        response = await test_client.delete(
            f"/api/v1/connectors/{connector_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200

        # Verify deletion
        get_response = await test_client.get(
            f"/api/v1/connectors/{connector_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 404

    async def test_delete_connector_not_found(self, test_client, designer_user):
        """Test deleting non-existent connector returns 404"""
        response = await test_client.delete(
            "/api/v1/connectors/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_full_connector_lifecycle(self, test_client, designer_user, database_connector_data):
        """Test complete connector lifecycle: create -> read -> update -> delete"""
        # Step 1: Create
        create_response = await test_client.post(
            "/api/v1/connectors/",
            json=database_connector_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert create_response.status_code == 201
        created = create_response.json()
        connector_id = created["id"]

        # Step 2: Read
        get_response = await test_client.get(
            f"/api/v1/connectors/{connector_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 200

        # Step 3: Update
        update_data = {"name": "Updated in lifecycle"}
        update_response = await test_client.put(
            f"/api/v1/connectors/{connector_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated in lifecycle"

        # Step 4: Delete
        delete_response = await test_client.delete(
            f"/api/v1/connectors/{connector_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert delete_response.status_code == 200

        # Step 5: Verify deletion
        final_get = await test_client.get(
            f"/api/v1/connectors/{connector_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert final_get.status_code == 404
