"""
Integration tests for Pipeline CRUD operations
Tests full pipeline workflow through API endpoints with authentication
"""

import pytest
from httpx import AsyncClient
from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.core.security import get_password_hash


class TestPipelineCRUD:
    """Test suite for Pipeline CRUD API endpoints"""

    @pytest.fixture
    async def designer_user(self, test_session):
        """Create a designer user for testing"""
        user = User(
            username="designer",
            email="designer@test.com",
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
            username="viewer",
            email="viewer@test.com",
            hashed_password=get_password_hash("Viewer123!@#"),
            role="viewer",
            is_active=True
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    @pytest.fixture
    def pipeline_data(self):
        """Sample pipeline data for creation"""
        return {
            "name": "Test Pipeline",
            "description": "A test data pipeline",
            "source_config": {
                "type": "database",
                "host": "localhost",
                "port": 5432,
                "database": "source_db"
            },
            "destination_config": {
                "type": "s3",
                "bucket": "test-bucket",
                "region": "us-east-1"
            },
            "transformation_config": {
                "steps": ["normalize", "validate"]
            },
            "schedule": "0 0 * * *",
            "is_active": True
        }

    async def test_create_pipeline_success(self, test_client, designer_user, pipeline_data):
        """Test successful pipeline creation by designer"""
        response = await test_client.post(
            "/api/v1/pipelines/",
            json=pipeline_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}  # Mock auth
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == pipeline_data["name"]
        assert data["description"] == pipeline_data["description"]
        assert data["source_config"] == pipeline_data["source_config"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    async def test_create_pipeline_viewer_forbidden(self, test_client, viewer_user, pipeline_data):
        """Test that viewers cannot create pipelines"""
        response = await test_client.post(
            "/api/v1/pipelines/",
            json=pipeline_data,
            headers={"Authorization": f"Bearer {viewer_user.id}"}
        )

        assert response.status_code == 403
        assert "permission" in response.json()["detail"].lower()

    async def test_create_pipeline_missing_required_fields(self, test_client, designer_user):
        """Test pipeline creation with missing required fields"""
        invalid_data = {
            "name": "Invalid Pipeline"
            # Missing source_config and destination_config
        }

        response = await test_client.post(
            "/api/v1/pipelines/",
            json=invalid_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 422
        errors = response.json()["detail"]
        field_names = [error["loc"][-1] for error in errors]
        assert "source_config" in field_names
        assert "destination_config" in field_names

    async def test_get_pipeline_by_id(self, test_session, test_client, designer_user):
        """Test retrieving a pipeline by ID"""
        # Create a pipeline first
        pipeline = Pipeline(
            name="Get Test Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            owner_id=designer_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        response = await test_client.get(
            f"/api/v1/pipelines/{pipeline.id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == pipeline.id
        assert data["name"] == "Get Test Pipeline"

    async def test_get_pipeline_not_found(self, test_client, designer_user):
        """Test retrieving non-existent pipeline returns 404"""
        response = await test_client.get(
            "/api/v1/pipelines/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_list_pipelines(self, test_session, test_client, designer_user):
        """Test listing all pipelines"""
        # Create multiple pipelines
        pipelines = [
            Pipeline(
                name=f"Pipeline {i}",
                source_config={"type": "api"},
                destination_config={"type": "db"},
                owner_id=designer_user.id
            )
            for i in range(3)
        ]
        for pipeline in pipelines:
            test_session.add(pipeline)
        await test_session.commit()

        response = await test_client.get(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3
        assert all("name" in item for item in data)

    async def test_list_pipelines_viewer_can_access(self, test_session, test_client, designer_user, viewer_user):
        """Test that viewers can list pipelines"""
        # Create a pipeline as designer
        pipeline = Pipeline(
            name="Viewable Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()

        # View as viewer
        response = await test_client.get(
            "/api/v1/pipelines/",
            headers={"Authorization": f"Bearer {viewer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    async def test_update_pipeline_success(self, test_session, test_client, designer_user):
        """Test successful pipeline update"""
        # Create a pipeline
        pipeline = Pipeline(
            name="Original Name",
            description="Original description",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Update it
        update_data = {
            "name": "Updated Name",
            "description": "Updated description",
            "is_active": False
        }

        response = await test_client.put(
            f"/api/v1/pipelines/{pipeline.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated description"
        assert data["is_active"] is False
        assert data["source_config"] == {"type": "api"}  # Unchanged

    async def test_update_pipeline_partial(self, test_session, test_client, designer_user):
        """Test partial pipeline update (only some fields)"""
        pipeline = Pipeline(
            name="Test Pipeline",
            description="Original",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            is_active=True,
            owner_id=designer_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Update only description
        update_data = {"description": "Partially updated"}

        response = await test_client.put(
            f"/api/v1/pipelines/{pipeline.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Partially updated"
        assert data["name"] == "Test Pipeline"  # Unchanged
        assert data["is_active"] is True  # Unchanged

    async def test_update_pipeline_not_found(self, test_client, designer_user):
        """Test updating non-existent pipeline returns 404"""
        update_data = {"name": "Updated"}

        response = await test_client.put(
            "/api/v1/pipelines/99999",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_delete_pipeline_success(self, test_session, test_client, designer_user):
        """Test successful pipeline deletion"""
        pipeline = Pipeline(
            name="To Delete",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=designer_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        pipeline_id = pipeline.id

        response = await test_client.delete(
            f"/api/v1/pipelines/{pipeline_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200

        # Verify it's deleted
        get_response = await test_client.get(
            f"/api/v1/pipelines/{pipeline_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 404

    async def test_delete_pipeline_not_found(self, test_client, designer_user):
        """Test deleting non-existent pipeline returns 404"""
        response = await test_client.delete(
            "/api/v1/pipelines/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_full_pipeline_lifecycle(self, test_client, designer_user, pipeline_data):
        """Test complete pipeline lifecycle: create -> read -> update -> delete"""
        # Step 1: Create
        create_response = await test_client.post(
            "/api/v1/pipelines/",
            json=pipeline_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert create_response.status_code == 201
        created = create_response.json()
        pipeline_id = created["id"]

        # Step 2: Read
        get_response = await test_client.get(
            f"/api/v1/pipelines/{pipeline_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 200
        assert get_response.json()["name"] == pipeline_data["name"]

        # Step 3: Update
        update_data = {"description": "Updated in lifecycle test"}
        update_response = await test_client.put(
            f"/api/v1/pipelines/{pipeline_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["description"] == "Updated in lifecycle test"

        # Step 4: Delete
        delete_response = await test_client.delete(
            f"/api/v1/pipelines/{pipeline_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert delete_response.status_code == 200

        # Step 5: Verify deletion
        final_get = await test_client.get(
            f"/api/v1/pipelines/{pipeline_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert final_get.status_code == 404
