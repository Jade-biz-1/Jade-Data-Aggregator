"""
Unit tests for Model Relationships
Tests foreign key constraints, cascade deletes, and relationship integrity
"""

import pytest
from sqlalchemy.exc import IntegrityError
from backend.models.user import User
from backend.models.pipeline import Pipeline
from backend.models.connector import Connector
from backend.models.transformation import Transformation
from backend.models.pipeline_run import PipelineRun
from backend.core.security import get_password_hash


class TestModelRelationships:
    """Test suite for model relationships and constraints"""

    @pytest.fixture
    async def test_user(self, test_session):
        """Create a test user"""
        user = User(
            username="reltest",
            email="reltest@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="developer"
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    async def test_user_pipeline_relationship(self, test_session, test_user):
        """Test one-to-many relationship between User and Pipeline"""
        # Create multiple pipelines for one user
        pipeline1 = Pipeline(
            name="Pipeline 1",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        pipeline2 = Pipeline(
            name="Pipeline 2",
            source_config={"type": "file"},
            destination_config={"type": "s3"},
            owner_id=test_user.id
        )
        test_session.add_all([pipeline1, pipeline2])
        await test_session.commit()
        await test_session.refresh(test_user)

        # Verify user has multiple pipelines
        assert len(test_user.pipelines) >= 2
        pipeline_names = [p.name for p in test_user.pipelines]
        assert "Pipeline 1" in pipeline_names
        assert "Pipeline 2" in pipeline_names

        # Verify each pipeline knows its owner
        await test_session.refresh(pipeline1)
        assert pipeline1.owner.username == "reltest"

    async def test_user_connector_relationship(self, test_session, test_user):
        """Test one-to-many relationship between User and Connector"""
        # Create multiple connectors for one user
        connector1 = Connector(
            name="Connector 1",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=test_user.id
        )
        connector2 = Connector(
            name="Connector 2",
            connector_type="rest_api",
            config={"url": "http://api.com"},
            owner_id=test_user.id
        )
        test_session.add_all([connector1, connector2])
        await test_session.commit()
        await test_session.refresh(test_user)

        # Verify user has multiple connectors
        assert len(test_user.connectors) >= 2
        connector_names = [c.name for c in test_user.connectors]
        assert "Connector 1" in connector_names
        assert "Connector 2" in connector_names

    async def test_user_transformation_relationship(self, test_session, test_user):
        """Test one-to-many relationship between User and Transformation"""
        # Create multiple transformations for one user
        transform1 = Transformation(
            name="Transform 1",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=test_user.id
        )
        transform2 = Transformation(
            name="Transform 2",
            transformation_type="normalization",
            source_fields=["c"],
            target_fields=["d"],
            owner_id=test_user.id
        )
        test_session.add_all([transform1, transform2])
        await test_session.commit()
        await test_session.refresh(test_user)

        # Verify user has multiple transformations
        assert len(test_user.transformations) >= 2
        transform_names = [t.name for t in test_user.transformations]
        assert "Transform 1" in transform_names
        assert "Transform 2" in transform_names

    async def test_pipeline_run_relationship(self, test_session, test_user):
        """Test one-to-many relationship between Pipeline and PipelineRun"""
        pipeline = Pipeline(
            name="Multi-Run Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Create multiple runs for one pipeline
        run1 = PipelineRun(
            pipeline_id=pipeline.id,
            status="completed",
            triggered_by="manual",
            records_processed=1000
        )
        run2 = PipelineRun(
            pipeline_id=pipeline.id,
            status="failed",
            triggered_by="scheduled",
            records_processed=500
        )
        run3 = PipelineRun(
            pipeline_id=pipeline.id,
            status="running",
            triggered_by="webhook"
        )
        test_session.add_all([run1, run2, run3])
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Verify pipeline has multiple runs
        assert len(pipeline.runs) >= 3
        statuses = [r.status for r in pipeline.runs]
        assert "completed" in statuses
        assert "failed" in statuses
        assert "running" in statuses

    async def test_cascade_delete_pipeline_runs(self, test_session, test_user):
        """Test that deleting a pipeline cascades to delete its runs"""
        from sqlalchemy import select

        pipeline = Pipeline(
            name="Cascade Test Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)

        # Create runs for the pipeline
        run1 = PipelineRun(pipeline_id=pipeline.id, status="completed", triggered_by="manual")
        run2 = PipelineRun(pipeline_id=pipeline.id, status="failed", triggered_by="manual")
        test_session.add_all([run1, run2])
        await test_session.commit()

        run1_id = run1.id
        run2_id = run2.id

        # Delete the pipeline
        await test_session.delete(pipeline)
        await test_session.commit()

        # Verify runs are also deleted (cascade)
        result = await test_session.execute(
            select(PipelineRun).where(PipelineRun.id.in_([run1_id, run2_id]))
        )
        remaining_runs = result.scalars().all()

        assert len(remaining_runs) == 0

    async def test_foreign_key_constraint_pipeline_owner(self, test_session):
        """Test that pipeline cannot reference non-existent user"""
        pipeline = Pipeline(
            name="Orphan Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=99999  # Non-existent user ID
        )
        test_session.add(pipeline)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_foreign_key_constraint_connector_owner(self, test_session):
        """Test that connector cannot reference non-existent user"""
        connector = Connector(
            name="Orphan Connector",
            connector_type="database",
            config={"host": "localhost"},
            owner_id=99999  # Non-existent user ID
        )
        test_session.add(connector)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_foreign_key_constraint_transformation_owner(self, test_session):
        """Test that transformation cannot reference non-existent user"""
        transformation = Transformation(
            name="Orphan Transform",
            transformation_type="mapping",
            source_fields=["a"],
            target_fields=["b"],
            owner_id=99999  # Non-existent user ID
        )
        test_session.add(transformation)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_foreign_key_constraint_pipeline_run(self, test_session):
        """Test that pipeline run cannot reference non-existent pipeline"""
        run = PipelineRun(
            pipeline_id=99999,  # Non-existent pipeline ID
            status="queued",
            triggered_by="manual"
        )
        test_session.add(run)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_multiple_users_with_resources(self, test_session):
        """Test multiple users each owning their own resources"""
        # Create two users
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password=get_password_hash("Test123!@#")
        )
        test_session.add_all([user1, user2])
        await test_session.commit()
        await test_session.refresh(user1)
        await test_session.refresh(user2)

        # Create resources for each user
        pipeline1 = Pipeline(
            name="User1 Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "db"},
            owner_id=user1.id
        )
        pipeline2 = Pipeline(
            name="User2 Pipeline",
            source_config={"type": "file"},
            destination_config={"type": "s3"},
            owner_id=user2.id
        )
        test_session.add_all([pipeline1, pipeline2])
        await test_session.commit()
        await test_session.refresh(user1)
        await test_session.refresh(user2)

        # Verify each user only sees their own pipelines
        user1_pipeline_names = [p.name for p in user1.pipelines]
        user2_pipeline_names = [p.name for p in user2.pipelines]

        assert "User1 Pipeline" in user1_pipeline_names
        assert "User1 Pipeline" not in user2_pipeline_names
        assert "User2 Pipeline" in user2_pipeline_names
        assert "User2 Pipeline" not in user1_pipeline_names
