"""
Unit Tests for PipelineRun Model
Data Aggregator Platform - Testing Framework

Tests cover:
- Pipeline run creation
- Run status tracking (queued, running, completed, failed, cancelled)
- Run-pipeline relationship
- Execution metrics (records processed/failed)
- Execution timing (started_at, completed_at)
- Error handling
"""

from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.core.security import get_password_hash
from backend.models.pipeline import Pipeline
from backend.models.pipeline_run import PipelineRun
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
    """Create a test user"""
    user = User(
        username="runowner",
        email="run@example.com",
        hashed_password=get_password_hash("Pass123!"),
        role="developer"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_pipeline(db_session, test_user):
    """Create a test pipeline"""
    pipeline = Pipeline(
        name="Test Pipeline",
        source_config={"type": "database"},
        destination_config={"type": "file"},
        owner_id=test_user.id
    )
    db_session.add(pipeline)
    db_session.commit()
    return pipeline


class TestPipelineRunModelCreation:
    """Test pipeline run model creation and basic operations"""
    
    def test_create_pipeline_run_with_required_fields(self, db_session, test_pipeline):
        """Test creating a pipeline run with required fields"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued"
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.id is not None
        assert run.pipeline_id == test_pipeline.id
        assert run.status == "queued"
        assert run.started_at is not None
        assert run.records_processed == 0  # Default value
        assert run.records_failed == 0  # Default value
    
    def test_default_status_is_queued(self, db_session, test_pipeline):
        """Test that default status is queued"""
        run = PipelineRun(pipeline_id=test_pipeline.id)
        db_session.add(run)
        db_session.commit()
        
        assert run.status == "queued"
    
    def test_create_run_with_execution_config(self, db_session, test_pipeline):
        """Test creating a run with execution configuration"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            execution_config={"batch_size": 1000, "parallel": True}
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.execution_config == {"batch_size": 1000, "parallel": True}


class TestPipelineRunStatus:
    """Test pipeline run status tracking"""
    
    @pytest.mark.parametrize("status", [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled"
    ])
    def test_all_valid_statuses(self, db_session, test_pipeline, status):
        """Test all valid pipeline run statuses"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status=status
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.status == status
    
    def test_status_transition_queued_to_running(self, db_session, test_pipeline):
        """Test status transition from queued to running"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued"
        )
        db_session.add(run)
        db_session.commit()
        
        # Start the run
        run.status = "running"
        db_session.commit()
        
        assert run.status == "running"
    
    def test_status_transition_running_to_completed(self, db_session, test_pipeline):
        """Test status transition from running to completed"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running"
        )
        db_session.add(run)
        db_session.commit()
        
        # Complete the run
        run.status = "completed"
        run.completed_at = datetime.utcnow()
        db_session.commit()
        
        assert run.status == "completed"
        assert run.completed_at is not None


class TestPipelineRunMetrics:
    """Test pipeline run metrics tracking"""
    
    def test_track_records_processed(self, db_session, test_pipeline):
        """Test tracking number of records processed"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            records_processed=1000
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.records_processed == 1000
    
    def test_track_records_failed(self, db_session, test_pipeline):
        """Test tracking number of failed records"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            records_processed=1000,
            records_failed=50
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.records_failed == 50
    
    def test_calculate_success_rate(self, db_session, test_pipeline):
        """Test calculating success rate from metrics"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="completed",
            records_processed=1000,
            records_failed=50
        )
        db_session.add(run)
        db_session.commit()
        
        # Calculate success rate
        total = run.records_processed + run.records_failed
        success_rate = (run.records_processed / total) * 100 if total > 0 else 0
        
        assert success_rate == pytest.approx(95.24, rel=0.01)


class TestPipelineRunErrorHandling:
    """Test pipeline run error handling"""
    
    def test_failed_run_with_error_message(self, db_session, test_pipeline):
        """Test failed run with error message"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="failed",
            error_message="Connection timeout to database"
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.status == "failed"
        assert run.error_message == "Connection timeout to database"
    
    def test_run_with_execution_logs(self, db_session, test_pipeline):
        """Test run with execution logs"""
        logs = """
[2025-01-01 10:00:00] Pipeline started
[2025-01-01 10:00:05] Connected to source
[2025-01-01 10:00:10] Processing batch 1
"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="running",
            logs=logs
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.logs == logs


class TestPipelineRunRelationship:
    """Test pipeline-run relationship"""
    
    def test_run_has_pipeline_relationship(self, db_session, test_pipeline):
        """Test that run has relationship to pipeline"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued"
        )
        db_session.add(run)
        db_session.commit()
        db_session.refresh(run)
        
        assert run.pipeline is not None
        assert run.pipeline.id == test_pipeline.id
        assert run.pipeline.name == "Test Pipeline"
    
    def test_pipeline_has_runs_relationship(self, db_session, test_pipeline):
        """Test that pipeline can access its runs"""
        run1 = PipelineRun(pipeline_id=test_pipeline.id, status="completed")
        run2 = PipelineRun(pipeline_id=test_pipeline.id, status="running")
        run3 = PipelineRun(pipeline_id=test_pipeline.id, status="queued")
        
        db_session.add_all([run1, run2, run3])
        db_session.commit()
        db_session.refresh(test_pipeline)
        
        assert len(test_pipeline.runs) == 3
        statuses = [r.status for r in test_pipeline.runs]
        assert "completed" in statuses
        assert "running" in statuses
        assert "queued" in statuses


class TestPipelineRunTriggering:
    """Test pipeline run triggering metadata"""
    
    @pytest.mark.parametrize("trigger", ["manual", "scheduled", "webhook"])
    def test_run_triggered_by_different_sources(self, db_session, test_pipeline, trigger):
        """Test runs triggered by different sources"""
        run = PipelineRun(
            pipeline_id=test_pipeline.id,
            status="queued",
            triggered_by=trigger
        )
        db_session.add(run)
        db_session.commit()
        
        assert run.triggered_by == trigger


# Run with: pytest testing/backend-tests/unit/legacy_models/test_pipeline_run_model.py -v
