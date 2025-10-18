"""
Integration tests for Transformation CRUD operations
Tests full transformation workflow through API endpoints with authentication
"""

import pytest
from httpx import AsyncClient
from backend.models.user import User
from backend.models.transformation import Transformation
from backend.core.security import get_password_hash


class TestTransformationCRUD:
    """Test suite for Transformation CRUD API endpoints"""

    @pytest.fixture
    async def designer_user(self, test_session):
        """Create a designer user for testing"""
        user = User(
            username="designer_trans",
            email="designer_trans@test.com",
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
            username="viewer_trans",
            email="viewer_trans@test.com",
            hashed_password=get_password_hash("Viewer123!@#"),
            role="viewer",
            is_active=True
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    @pytest.fixture
    def mapping_transformation_data(self):
        """Sample mapping transformation data"""
        return {
            "name": "Field Mapper",
            "description": "Maps source fields to target fields",
            "transformation_type": "mapping",
            "source_fields": ["source_name", "source_email"],
            "target_fields": ["name", "email"],
            "transformation_rules": {
                "mappings": {
                    "source_name": "name",
                    "source_email": "email"
                }
            },
            "is_active": True
        }

    @pytest.fixture
    def normalization_transformation_data(self):
        """Sample normalization transformation data"""
        return {
            "name": "Data Normalizer",
            "description": "Normalizes customer data",
            "transformation_type": "data_normalization",
            "source_fields": ["first_name", "last_name", "email"],
            "target_fields": ["full_name", "email_normalized"],
            "transformation_rules": {
                "join_fields": ["first_name", "last_name"],
                "separator": " "
            },
            "is_active": True
        }

    async def test_create_mapping_transformation(self, test_client, designer_user, mapping_transformation_data):
        """Test creating a mapping transformation"""
        response = await test_client.post(
            "/api/v1/transformations/",
            json=mapping_transformation_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == mapping_transformation_data["name"]
        assert data["transformation_type"] == "mapping"
        assert data["source_fields"] == ["source_name", "source_email"]
        assert "id" in data

    async def test_create_normalization_transformation(self, test_client, designer_user, normalization_transformation_data):
        """Test creating a data normalization transformation"""
        response = await test_client.post(
            "/api/v1/transformations/",
            json=normalization_transformation_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["transformation_type"] == "data_normalization"
        assert data["transformation_rules"]["separator"] == " "

    async def test_create_currency_conversion_transformation(self, test_client, designer_user):
        """Test creating a currency conversion transformation"""
        currency_transform = {
            "name": "EUR to USD Converter",
            "description": "Convert EUR prices to USD",
            "transformation_type": "currency_conversion",
            "source_fields": ["price_eur"],
            "target_fields": ["price_usd"],
            "transformation_rules": {
                "from_currency": "EUR",
                "to_currency": "USD",
                "exchange_rate": 1.18
            },
            "is_active": True
        }

        response = await test_client.post(
            "/api/v1/transformations/",
            json=currency_transform,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["transformation_type"] == "currency_conversion"
        assert data["transformation_rules"]["exchange_rate"] == 1.18

    async def test_create_custom_code_transformation(self, test_client, designer_user):
        """Test creating a transformation with custom Python code"""
        custom_transform = {
            "name": "Custom Transformer",
            "description": "Custom Python transformation",
            "transformation_type": "custom_code",
            "transformation_code": "def transform(data):\n    return data.upper()",
            "source_fields": ["text"],
            "target_fields": ["uppercase_text"],
            "transformation_rules": {},
            "is_active": True
        }

        response = await test_client.post(
            "/api/v1/transformations/",
            json=custom_transform,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["transformation_type"] == "custom_code"
        assert "def transform" in data["transformation_code"]

    async def test_create_transformation_viewer_forbidden(self, test_client, viewer_user, mapping_transformation_data):
        """Test that viewers cannot create transformations"""
        response = await test_client.post(
            "/api/v1/transformations/",
            json=mapping_transformation_data,
            headers={"Authorization": f"Bearer {viewer_user.id}"}
        )

        assert response.status_code == 403

    async def test_create_transformation_missing_fields(self, test_client, designer_user):
        """Test transformation creation with missing required fields"""
        invalid_data = {
            "name": "Invalid Transformation"
            # Missing transformation_type, source_fields, target_fields
        }

        response = await test_client.post(
            "/api/v1/transformations/",
            json=invalid_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 422
        errors = response.json()["detail"]
        field_names = [error["loc"][-1] for error in errors]
        assert "transformation_type" in field_names

    async def test_get_transformation_by_id(self, test_session, test_client, designer_user):
        """Test retrieving a transformation by ID"""
        transformation = Transformation(
            name="Test Transform",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=designer_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        response = await test_client.get(
            f"/api/v1/transformations/{transformation.id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == transformation.id
        assert data["name"] == "Test Transform"

    async def test_get_transformation_not_found(self, test_client, designer_user):
        """Test retrieving non-existent transformation returns 404"""
        response = await test_client.get(
            "/api/v1/transformations/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_list_transformations(self, test_session, test_client, designer_user):
        """Test listing all transformations"""
        # Create multiple transformations
        transformations = [
            Transformation(
                name=f"Transform {i}",
                transformation_type="mapping",
                source_fields=["a"],
                target_fields=["b"],
                owner_id=designer_user.id
            )
            for i in range(3)
        ]
        for trans in transformations:
            test_session.add(trans)
        await test_session.commit()

        response = await test_client.get(
            "/api/v1/transformations/",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    async def test_list_transformations_by_type(self, test_session, test_client, designer_user):
        """Test filtering transformations by type"""
        # Create transformations of different types
        mapping = Transformation(
            name="Mapper",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=designer_user.id
        )
        normalizer = Transformation(
            name="Normalizer",
            transformation_type="data_normalization",
            source_fields=["c"],
            target_fields=["d"],
            owner_id=designer_user.id
        )
        test_session.add_all([mapping, normalizer])
        await test_session.commit()

        # Filter by type
        response = await test_client.get(
            "/api/v1/transformations/?transformation_type=mapping",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert all(t["transformation_type"] == "mapping" for t in data)

    async def test_update_transformation_success(self, test_session, test_client, designer_user):
        """Test successful transformation update"""
        transformation = Transformation(
            name="Original Name",
            description="Original description",
            transformation_type="mapping",
            source_fields=["old"],
            target_fields=["old_target"],
            is_active=True,
            owner_id=designer_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        update_data = {
            "name": "Updated Name",
            "description": "Updated description",
            "source_fields": ["new"],
            "target_fields": ["new_target"],
            "is_active": False
        }

        response = await test_client.put(
            f"/api/v1/transformations/{transformation.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["source_fields"] == ["new"]
        assert data["is_active"] is False

    async def test_update_transformation_partial(self, test_session, test_client, designer_user):
        """Test partial transformation update"""
        transformation = Transformation(
            name="Test Transform",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            is_active=True,
            owner_id=designer_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        # Update only description
        update_data = {"description": "Partially updated"}

        response = await test_client.put(
            f"/api/v1/transformations/{transformation.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Partially updated"
        assert data["name"] == "Test Transform"  # Unchanged

    async def test_update_transformation_not_found(self, test_client, designer_user):
        """Test updating non-existent transformation returns 404"""
        update_data = {"name": "Updated"}

        response = await test_client.put(
            "/api/v1/transformations/99999",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_delete_transformation_success(self, test_session, test_client, designer_user):
        """Test successful transformation deletion"""
        transformation = Transformation(
            name="To Delete",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=designer_user.id
        )
        test_session.add(transformation)
        await test_session.commit()
        await test_session.refresh(transformation)

        transformation_id = transformation.id

        response = await test_client.delete(
            f"/api/v1/transformations/{transformation_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 200

        # Verify deletion
        get_response = await test_client.get(
            f"/api/v1/transformations/{transformation_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 404

    async def test_delete_transformation_not_found(self, test_client, designer_user):
        """Test deleting non-existent transformation returns 404"""
        response = await test_client.delete(
            "/api/v1/transformations/99999",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )

        assert response.status_code == 404

    async def test_full_transformation_lifecycle(self, test_client, designer_user, mapping_transformation_data):
        """Test complete transformation lifecycle: create -> read -> update -> delete"""
        # Step 1: Create
        create_response = await test_client.post(
            "/api/v1/transformations/",
            json=mapping_transformation_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert create_response.status_code == 201
        created = create_response.json()
        transformation_id = created["id"]

        # Step 2: Read
        get_response = await test_client.get(
            f"/api/v1/transformations/{transformation_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert get_response.status_code == 200

        # Step 3: Update
        update_data = {"description": "Updated in lifecycle"}
        update_response = await test_client.put(
            f"/api/v1/transformations/{transformation_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["description"] == "Updated in lifecycle"

        # Step 4: Delete
        delete_response = await test_client.delete(
            f"/api/v1/transformations/{transformation_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert delete_response.status_code == 200

        # Step 5: Verify deletion
        final_get = await test_client.get(
            f"/api/v1/transformations/{transformation_id}",
            headers={"Authorization": f"Bearer {designer_user.id}"}
        )
        assert final_get.status_code == 404
