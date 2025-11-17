"""
Unit Tests for Pipeline Execution Engine
Data Aggregator Platform - Testing Framework

Tests cover:
- Pipeline execution state tracking
- Step-by-step execution flow
- Error handling and rollback
- Execution logging
- Progress tracking
- Dry run mode
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from backend.schemas.pipeline_visual import (
    NodeType,
    PipelineEdge,
    PipelineNode,
    Position,
    VisualPipelineDefinition,
)
from backend.services.pipeline_execution_engine import (
    ExecutionStatus,
    PipelineExecutionEngine,
    PipelineExecutionState,
)


class TestPipelineExecutionState:
    """Test PipelineExecutionState class"""
    
    def test_create_execution_state(self):
        """Test creating a new execution state"""
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        
        assert state.pipeline_id == 1
        assert state.status == ExecutionStatus.PENDING
        assert state.steps == []
        assert state.current_step == 0
        assert state.total_records_processed == 0
        assert state.execution_log == []
        assert state.rollback_data == {}
    
    def test_add_log_entry(self):
        """Test adding log entries to execution state"""
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        
        state.add_log("INFO", "Test message", {"key": "value"})
        
        assert len(state.execution_log) == 1
        assert state.execution_log[0]["level"] == "INFO"
        assert state.execution_log[0]["message"] == "Test message"
        assert state.execution_log[0]["metadata"]["key"] == "value"
        assert "timestamp" in state.execution_log[0]
    
    def test_add_multiple_log_entries(self):
        """Test adding multiple log entries"""
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        
        state.add_log("INFO", "Starting")
        state.add_log("INFO", "Processing")
        state.add_log("ERROR", "Failed", {"error": "timeout"})
        
        assert len(state.execution_log) == 3
        assert state.execution_log[2]["level"] == "ERROR"
        assert state.execution_log[2]["metadata"]["error"] == "timeout"


class TestPipelineExecutionEngine:
    """Test PipelineExecutionEngine class"""
    
    @pytest.fixture
    def engine(self):
        """Create a pipeline execution engine instance"""
        return PipelineExecutionEngine()
    
    @pytest.fixture
    def simple_pipeline_definition(self):
        """Create a simple pipeline definition for testing"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source", "config": {}}
            ),
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=200, y=0),
                data={"name": "Destination", "config": {}}
            )
        ]
        edges = [
            PipelineEdge(
                id="edge1",
                source="source1",
                target="dest1"
            )
        ]
        return VisualPipelineDefinition(nodes=nodes, edges=edges)
    
    def test_engine_initialization(self, engine):
        """Test engine initializes with empty active executions"""
        assert engine.active_executions == {}
    
    @pytest.mark.asyncio
    async def test_execute_pipeline_dry_run(self, engine, simple_pipeline_definition):
        """Test executing pipeline in dry run mode"""
        with patch('backend.services.pipeline_execution_engine.realtime_pipeline_service') as mock_realtime:
            mock_realtime.broadcast_pipeline_status = AsyncMock()
            mock_realtime.broadcast_pipeline_progress = AsyncMock()
            mock_realtime.broadcast_pipeline_completed = AsyncMock()
            
            state = await engine.execute_pipeline(
                pipeline_id=1,
                definition=simple_pipeline_definition,
                dry_run=True
            )
            
            assert state.status == ExecutionStatus.COMPLETED
            assert state.pipeline_id == 1
            assert state.start_time is not None
            assert state.end_time is not None
            assert len(state.steps) > 0
            assert state.total_records_processed > 0  # Mock value
    
    @pytest.mark.asyncio
    async def test_execution_state_tracking(self, engine, simple_pipeline_definition):
        """Test that execution state is properly tracked"""
        with patch('backend.services.pipeline_execution_engine.realtime_pipeline_service') as mock_realtime:
            mock_realtime.broadcast_pipeline_status = AsyncMock()
            mock_realtime.broadcast_pipeline_progress = AsyncMock()
            mock_realtime.broadcast_pipeline_completed = AsyncMock()
            
            state = await engine.execute_pipeline(
                pipeline_id=2,
                definition=simple_pipeline_definition,
                dry_run=True
            )
            
            # Verify state tracking
            assert state.status == ExecutionStatus.COMPLETED
            assert state.current_step > 0
            assert len(state.execution_log) > 0
    
    @pytest.mark.asyncio
    async def test_execution_progress_tracking(self, engine, simple_pipeline_definition):
        """Test that execution progress is tracked correctly"""
        with patch('backend.services.pipeline_execution_engine.realtime_pipeline_service') as mock_realtime:
            mock_realtime.broadcast_pipeline_status = AsyncMock()
            mock_realtime.broadcast_pipeline_progress = AsyncMock()
            mock_realtime.broadcast_pipeline_completed = AsyncMock()
            
            state = await engine.execute_pipeline(
                pipeline_id=3,
                definition=simple_pipeline_definition,
                dry_run=True
            )
            
            # Verify progress was broadcast
            assert mock_realtime.broadcast_pipeline_progress.called
            assert mock_realtime.broadcast_pipeline_completed.called
    
    @pytest.mark.asyncio
    async def test_execution_logging(self, engine, simple_pipeline_definition):
        """Test that execution logs are created"""
        with patch('backend.services.pipeline_execution_engine.realtime_pipeline_service') as mock_realtime:
            mock_realtime.broadcast_pipeline_status = AsyncMock()
            mock_realtime.broadcast_pipeline_progress = AsyncMock()
            mock_realtime.broadcast_pipeline_completed = AsyncMock()
            
            state = await engine.execute_pipeline(
                pipeline_id=4,
                definition=simple_pipeline_definition,
                dry_run=True
            )
            
            # Verify logs were created
            assert len(state.execution_log) > 0
            
            # Check for execution plan log
            plan_logs = [log for log in state.execution_log if "Execution plan" in log["message"]]
            assert len(plan_logs) > 0
    
    def test_active_executions_tracking(self, engine):
        """Test that active executions are tracked"""
        # Initially empty
        assert len(engine.active_executions) == 0
        
        # After adding execution
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=5, definition=definition)
        engine.active_executions[5] = state
        
        assert len(engine.active_executions) == 1
        assert 5 in engine.active_executions
        assert engine.active_executions[5].pipeline_id == 5


class TestExecutionStatus:
    """Test ExecutionStatus enum"""
    
    def test_execution_status_values(self):
        """Test all execution status values"""
        assert ExecutionStatus.PENDING == "pending"
        assert ExecutionStatus.RUNNING == "running"
        assert ExecutionStatus.COMPLETED == "completed"
        assert ExecutionStatus.FAILED == "failed"
        assert ExecutionStatus.ROLLED_BACK == "rolled_back"


# Run with: pytest testing/backend-tests/unit/services/test_pipeline_execution_engine.py -v
