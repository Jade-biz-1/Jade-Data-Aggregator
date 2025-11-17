"""
Unit Tests for Pipeline Model
Data Aggregator Platform - Testing Framework

Tests cover:
- Pipeline creation with valid data
- Pipeline configuration validation
- Pipeline-user relationship (owner)
- Pipeline types (traditional vs visual)
- Pipeline active status
- Pipeline scheduling
- Cascade delete behavior
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.core.security import get_password_hash
from backend.models.pipeline import Pipeline
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
    """Create a test user for pipeline ownership"""
    user = User(
        username="pipelineowner",
        email="owner@example.com",
        hashed_password=get_password_hash("Pass123!"),
        role="developer"
    )
    db_session.add(user)
    db_session.commit()
    return user


class TestPipelineModelCreation:
    """Test pipeline model creation and basic operations"""
    
    def test_create_pipeline_with_required_fields(self, db_session, test_user):
        """Test creating a pipeline with all required fields"""
        pipeline = Pipeline(
            name="Test Pipeline",
            description="A test pipeline",
            source_config={"type": "database", "host": "localhost"},
            destination_config={"type": "file", "path": "/output"},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.id is not None
        assert pipeline.name == "Test Pipeline"
        assert pipeline.description == "A test pipeline"
        assert pipeline.source_config == {"type": "database", "host": "localhost"}
        assert pipeline.destination_config == {"type": "file", "path": "/output"}
        assert pipeline.owner_id == test_user.id
        assert pipeline.is_active is True
        assert pipeline.pipeline_type == "traditional"
    
    def test_create_pipeline_with_transformations(self, db_session, test_user):
        """Test creating a pipeline with transformation config"""
        pipeline = Pipeline(
            name="Transform Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            transformation_config={"steps": ["filter", "map", "reduce"]},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.transformation_config == {"steps": ["filter", "map", "reduce"]}
    
    def test_create_pipeline_with_schedule(self, db_session, test_user):
        """Test creating a pipeline with cron schedule"""
        pipeline = Pipeline(
            name="Scheduled Pipeline",
            source_config={"type": "file"},
            destination_config={"type": "database"},
            schedule="0 0 * * *",
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.schedule == "0 0 * * *"
    
    def test_pipeline_requires_owner(self, db_session):
        """Test that pipeline requires an owner_id"""
        pipeline = Pipeline(
            name="Orphan Pipeline",
            source_config={"type": "file"},
            destination_config={"type": "database"}
        )
        db_session.add(pipeline)
        
        with pytest.raises(Exception):
            db_session.commit()
    
    def test_pipeline_timestamps_created(self, db_session, test_user):
        """Test that created_at timestamp is set automatically"""
        pipeline = Pipeline(
            name="Time Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "file"},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.created_at is not None


class TestPipelineTypes:
    """Test pipeline type functionality"""
    
    def test_default_pipeline_type_is_traditional(self, db_session, test_user):
        """Test that default pipeline type is traditional"""
        pipeline = Pipeline(
            name="Default Type",
            source_config={"type": "database"},
            destination_config={"type": "file"},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.pipeline_type == "traditional"
    
    def test_create_visual_pipeline(self, db_session, test_user):
        """Test creating a visual pipeline with node definitions"""
        pipeline = Pipeline(
            name="Visual Pipeline",
            source_config={"type": "visual"},
            destination_config={"type": "visual"},
            pipeline_type="visual",
            visual_definition={"nodes": [{"id": "1"}], "edges": []},
            node_definitions=[{"id": "1", "type": "database"}],
            edge_definitions=[{"source": "1", "target": "2"}],
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.pipeline_type == "visual"
        assert pipeline.visual_definition is not None


class TestPipelineActiveStatus:
    """Test pipeline active status functionality"""
    
    def test_pipeline_is_active_by_default(self, db_session, test_user):
        """Test that pipelines are active by default"""
        pipeline = Pipeline(
            name="Active Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.is_active is True
    
    def test_pipeline_can_be_deactivated(self, db_session, test_user):
        """Test that pipelines can be deactivated"""
        pipeline = Pipeline(
            name="Inactive Pipeline",
            source_config={"type": "file"},
            destination_config={"type": "api"},
            is_active=False,
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        
        assert pipeline.is_active is False


class TestPipelineUserRelationship:
    """Test pipeline-user relationship"""
    
    def test_pipeline_has_owner_relationship(self, db_session, test_user):
        """Test that pipeline has owner relationship to user"""
        pipeline = Pipeline(
            name="Owned Pipeline",
            source_config={"type": "api"},
            destination_config={"type": "database"},
            owner_id=test_user.id
        )
        db_session.add(pipeline)
        db_session.commit()
        db_session.refresh(pipeline)
        
        assert pipeline.owner is not None
        assert pipeline.owner.id == test_user.id
    
    def test_user_has_pipelines_relationship(self, db_session, test_user):
        """Test that user can access their pipelines"""
        pipeline1 = Pipeline(
            name="Pipeline 1",
            source_config={"type": "api"},
            destination_config={"type": "file"},
            owner_id=test_user.id
        )
        pipeline2 = Pipeline(
            name="Pipeline 2",
            source_config={"type": "database"},
            destination_config={"type": "api"},
            owner_id=test_user.id
        )
        db_session.add_all([pipeline1, pipeline2])
        db_session.commit()
        db_session.refresh(test_user)
        
        assert len(test_user.pipelines) == 2


# Run with: pytest testing/backend-tests/unit/legacy_models/test_pipeline_model.py -v
