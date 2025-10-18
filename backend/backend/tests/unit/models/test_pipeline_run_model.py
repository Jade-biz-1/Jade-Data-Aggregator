"""
Unit tests for PipelineRun model
Tests pipeline run tracking, status management, and metrics
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from backend.models.pipeline_run import PipelineRun
from backend.models.pipeline import Pipeline
from backend.models.user import User
from backend.core.security import get_password_hash


class TestPipelineRunModel:
    """Test suite for PipelineRun model"""

    @pytest.fixture
    async def test_user(self, test_session):
        """Create a test user"""
        user = User(
            username="runowner",
            email="runowner@example.com",
            hashed_password=get_password_hash("Test123!@#"),
            role="developer"
        )
        test_session.add(user)
        await test_session.commit()
        await test_session.refresh(user)
        return user

    @pytest.fixture
    async def test_pipeline(self, test_session, test_user):
        """Create a test pipeline"""
        pipeline = Pipeline(
            name="Test Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            owner_id=test_user.id
        )
        test_session.add(pipeline)
        await test_session.commit()
        await test_session.refresh(pipeline)
        return pipeline

    async def test_create_pipeline_run_with_valid_data(self, test_session, test_pipeline):
        """Test creating a pipeline run with required fields"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        assert run.id is not None
        assert run.pipeline_id == test_pipeline.id
        assert run.status == "queued"
        assert run.triggered_by == "manual"
        assert run.records_processed == 0
        assert run.records_failed == 0
        assert run.started_at is not None

    async def test_create_running_pipeline_run(self, test_session, test_pipeline):
        """Test creating a pipeline run in running status"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            triggered_by="scheduled",
            execution_config={"batch_size": 1000}
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        assert run.status == "running"
        assert run.triggered_by == "scheduled"
        assert run.execution_config is not None
        assert run.execution_config["batch_size"] == 1000

    async def test_complete_pipeline_run_success(self, test_session, test_pipeline):
        """Test completing a pipeline run successfully"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        # Complete the run
        run.status = "completed"
        run.records_processed = 5000
        run.records_failed = 10
        run.completed_at = datetime.utcnow()
        await test_session.commit()
        await test_session.refresh(run)

        assert run.status == "completed"
        assert run.records_processed == 5000
        assert run.records_failed == 10
        assert run.completed_at is not None

    async def test_fail_pipeline_run(self, test_session, test_pipeline):
        """Test failing a pipeline run with error message"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            triggered_by="webhook"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        # Fail the run
        run.status = "failed"
        run.error_message = "Connection timeout to source API"
        run.records_processed = 1500
        run.records_failed = 500
        run.completed_at = datetime.utcnow()
        await test_session.commit()
        await test_session.refresh(run)

        assert run.status == "failed"
        assert run.error_message == "Connection timeout to source API"
        assert run.records_processed == 1500
        assert run.records_failed == 500

    async def test_cancel_pipeline_run(self, test_session, test_pipeline):
        """Test cancelling a running pipeline"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        # Cancel the run
        run.status = "cancelled"
        run.completed_at = datetime.utcnow()
        await test_session.commit()
        await test_session.refresh(run)

        assert run.status == "cancelled"
        assert run.completed_at is not None

    async def test_pipeline_run_with_logs(self, test_session, test_pipeline):
        """Test storing execution logs in pipeline run"""
        logs = """
        [2025-01-01 10:00:00] Starting pipeline execution
        [2025-01-01 10:00:05] Connected to source
        [2025-01-01 10:05:30] Processing batch 1 of 10
        [2025-01-01 10:15:00] Completed successfully
        """

        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            triggered_by="scheduled",
            logs=logs,
            records_processed=10000
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        assert run.logs is not None
        assert "Starting pipeline execution" in run.logs
        assert "Completed successfully" in run.logs

    async def test_pipeline_run_missing_pipeline_id(self, test_session):
        """Test that pipeline_id is required"""
        run = PipelineRun(
            status="queued"
        )
        test_session.add(run)

        with pytest.raises(IntegrityError):
            await test_session.commit()
        await test_session.rollback()

    async def test_pipeline_run_pipeline_relationship(self, test_session, test_pipeline):
        """Test the relationship between PipelineRun and Pipeline"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)
        await test_session.refresh(test_pipeline)

        # Test forward relationship (run -> pipeline)
        assert run.pipeline is not None
        assert run.pipeline.id == test_pipeline.id
        assert run.pipeline.name == "Test Pipeline"

        # Test backward relationship (pipeline -> runs)
        assert len(test_pipeline.runs) > 0
        assert run in test_pipeline.runs

    async def test_pipeline_run_timestamps(self, test_session, test_pipeline):
        """Test that timestamps are managed correctly"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        assert run.started_at is not None
        assert run.created_at is not None
        assert isinstance(run.started_at, datetime)
        assert run.completed_at is None  # Not completed yet

    async def test_pipeline_run_status_values(self, test_session, test_pipeline):
        """Test all valid status values"""
        statuses = ["queued", "running", "completed", "failed", "cancelled"]

        for status in statuses:
            run = PipelineRun(
                pipeline_id=test_pipeline.id,
                status=status,
                triggered_by="manual"
            )
            test_session.add(run)
            await test_session.commit()
            await test_session.refresh(run)

            assert run.status == status

    async def test_pipeline_run_delete(self, test_session, test_pipeline):
        """Test deleting a pipeline run"""
        from sqlalchemy import select

        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            triggered_by="manual"
        )
        test_session.add(run)
        await test_session.commit()
        await test_session.refresh(run)

        run_id = run.id

        await test_session.delete(run)
        await test_session.commit()

        result = await test_session.execute(
            select(PipelineRun).where(PipelineRun.id == run_id)
        )
        deleted_run = result.scalar_one_or_none()

        assert deleted_run is None
