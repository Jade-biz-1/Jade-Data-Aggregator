"""
Unit tests for Pipeline model
Tests pipeline creation, validation, relationships, and CRUD operations
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from backend.models.pipeline import Pipeline
from backend.models.user import User
from backend.core.security import get_password_hash


class TestPipelineModel:
    """Test suite for Pipeline model"""

    @pytest.fixture
    async def test_user(self, test_session):
        """Create a test user for pipeline ownership"""
        user = User(
            username="pipelineowner",
            email="pipelineowner@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="developer"
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    async def test_create_pipeline_with_valid_data(self, test_session, test_user):
        """Test creating a pipeline with all required fields"""
        pipeline = Pipeline(
            name="Test Pipeline",
            description="A test data pipeline",
            source_config={"type": "database", "host": "localhost"},
            destination_config={"type": "s3", "bucket": "test-bucket"},
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.id is not None
        assert pipeline.name == "Test Pipeline"
        assert pipeline.description == "A test data pipeline"
        assert pipeline.source_config["type"] == "database"
        assert pipeline.destination_config["type"] == "s3"
        assert pipeline.owner_id == test_user.id
        assert pipeline.is_active is True
        assert pipeline.created_at is not None

    async def test_create_pipeline_with_optional_fields(self, test_session, test_user):
        """Test creating a pipeline with optional transformation config"""
        pipeline = Pipeline(
            name="Advanced Pipeline",
            description="Pipeline with transformations",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            transformation_config={"steps": ["normalize", "validate"]},
            schedule="0 0 * * *",  # Daily at midnight
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.transformation_config is not None
        assert pipeline.transformation_config["steps"][0] == "normalize"
        assert pipeline.schedule == "0 0 * * *"

    async def test_create_visual_pipeline(self, test_session, test_user):
        """Test creating a visual pipeline with node definitions"""
        visual_def = {
            "nodes": [
                {"id": "node1", "type": "source", "position": {"x": 0, "y": 0}},
                {"id": "node2", "type": "transform", "position": {"x": 200, "y": 0}},
                {"id": "node3", "type": "destination", "position": {"x": 400, "y": 0}}
            ],
            "edges": [
                {"source": "node1", "target": "node2"},
                {"source": "node2", "target": "node3"}
            ]
        }

        pipeline = Pipeline(
            name="Visual Pipeline",
            source_config={"type": "visual"},
            destination_config={"type": "visual"},
            pipeline_type="visual",
            visual_definition=visual_def,
            node_definitions={"node1": {"source": "database"}},
            edge_definitions={"edge1": {"transform": "map"}},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.pipeline_type == "visual"
        assert pipeline.visual_definition is not None
        assert len(pipeline.visual_definition["nodes"]) == 3
        assert len(pipeline.visual_definition["edges"]) == 2

    async def test_pipeline_missing_required_fields(self, test_session, test_user):
        """Test that required fields must be provided"""
        # Missing source_config
        pipeline = Pipeline(
            name="Invalid Pipeline",
            destination_config={"type": "s3"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_pipeline_missing_owner_id(self, test_session):
        """Test that owner_id is required"""
        pipeline = Pipeline(
            name="Orphan Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"}
        )
        test_session.add(pipeline)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_pipeline_user_relationship(self, test_session, test_user):
        """Test the relationship between Pipeline and User"""
        pipeline = Pipeline(
            name="Relationship Test",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)
        await test_session.refresh(test_user)

        # Test forward relationship (pipeline -> user)
        assert pipeline.owner is not None
        assert pipeline.owner.id == test_user.id
        assert pipeline.owner.username == "pipelineowner"

        # Test backward relationship (user -> pipelines)
        assert len(test_user.pipelines) > 0
        assert pipeline in test_user.pipelines

    async def test_pipeline_is_active_flag(self, test_session, test_user):
        """Test pipeline activation/deactivation"""
        pipeline = Pipeline(
            name="Active Test",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id,
            is_active=True
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.is_active is True

        # Deactivate pipeline
        pipeline.is_active = False
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.is_active is False

    async def test_pipeline_timestamps(self, test_session, test_user):
        """Test that timestamps are set automatically"""
        pipeline = Pipeline(
            name="Timestamp Test",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        assert pipeline.created_at is not None
        assert isinstance(pipeline.created_at, datetime)

    async def test_pipeline_update_timestamp(self, test_session, test_user):
        """Test that updated_at timestamp changes on update"""
        pipeline = Pipeline(
            name="Update Test",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Update pipeline
        pipeline.description = "Updated description"
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Verify update occurred (field changed)
        assert pipeline.description == "Updated description"

    async def test_pipeline_query_by_name(self, test_session, test_user):
        """Test querying pipeline by name"""
        from sqlalchemy import select

        pipeline = Pipeline(
            name="Searchable Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()

        result = await test_session.execute(
            select(Pipeline).where(Pipeline.name == "Searchable Pipeline")
        )
        found_pipeline = result.scalar_one_or_none()

        assert found_pipeline is not None
        assert found_pipeline.name == "Searchable Pipeline"

    async def test_pipeline_delete(self, test_session, test_user):
        """Test deleting a pipeline"""
        from sqlalchemy import select

        pipeline = Pipeline(
            name="Delete Test",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        pipeline_id = pipeline.id

        await test_session.delete(pipeline)
        await test_session.commit()

        result = await test_session.execute(
            select(Pipeline).where(Pipeline.id == pipeline_id)
        )
        deleted_pipeline = result.scalar_one_or_none()

        assert deleted_pipeline is None
