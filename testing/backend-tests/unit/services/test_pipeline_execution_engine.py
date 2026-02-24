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
    NodePosition,
    PipelineEdge,
    PipelineNode,
    VisualPipelineDefinition,
)

# Alias for backwards compatibility with existing tests
Position = NodePosition
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
            # In dry-run mode the engine sets step.records_processed but does NOT
            # accumulate into state.total_records_processed (only real runs do that).
            assert state.total_records_processed == 0
    
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


# ---------------------------------------------------------------------------
# TEST-007 Additional: TestBuildExecutionPlan (7 tests)
# ---------------------------------------------------------------------------

class TestBuildExecutionPlan:
    """Tests for PipelineExecutionEngine._build_execution_plan() topological sort"""

    def test_empty_pipeline_returns_empty_plan(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        plan = engine._build_execution_plan(definition)
        assert plan == []

    def test_single_node_returns_that_node(self):
        nodes = [
            PipelineNode(id="n1", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={})
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert plan == ["n1"]

    def test_linear_two_nodes_source_before_destination(self):
        nodes = [
            PipelineNode(id="src", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={}),
            PipelineNode(id="dst", type=NodeType.DATABASE_DESTINATION,
                         position=NodePosition(x=100, y=0), data={}),
        ]
        edges = [PipelineEdge(id="e1", source="src", target="dst")]
        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert plan.index("src") < plan.index("dst")

    def test_three_node_chain_respects_order(self):
        nodes = [
            PipelineNode(id="a", type=NodeType.FILE_SOURCE,
                         position=NodePosition(x=0, y=0), data={}),
            PipelineNode(id="b", type=NodeType.FILTER,
                         position=NodePosition(x=100, y=0), data={}),
            PipelineNode(id="c", type=NodeType.DATABASE_DESTINATION,
                         position=NodePosition(x=200, y=0), data={}),
        ]
        edges = [
            PipelineEdge(id="e1", source="a", target="b"),
            PipelineEdge(id="e2", source="b", target="c"),
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert plan.index("a") < plan.index("b") < plan.index("c")

    def test_no_edges_returns_all_nodes(self):
        nodes = [
            PipelineNode(id=f"n{i}", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=i * 10, y=0), data={})
            for i in range(3)
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert len(plan) == 3
        assert set(plan) == {"n0", "n1", "n2"}

    def test_fan_in_both_sources_before_destination(self):
        nodes = [
            PipelineNode(id="src1", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={}),
            PipelineNode(id="src2", type=NodeType.API_SOURCE,
                         position=NodePosition(x=0, y=50), data={}),
            PipelineNode(id="dst", type=NodeType.DATABASE_DESTINATION,
                         position=NodePosition(x=100, y=25), data={}),
        ]
        edges = [
            PipelineEdge(id="e1", source="src1", target="dst"),
            PipelineEdge(id="e2", source="src2", target="dst"),
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert plan.index("dst") > plan.index("src1")
        assert plan.index("dst") > plan.index("src2")

    def test_disconnected_node_still_included(self):
        nodes = [
            PipelineNode(id="connected", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={}),
            PipelineNode(id="isolated", type=NodeType.FILE_SOURCE,
                         position=NodePosition(x=100, y=0), data={}),
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        engine = PipelineExecutionEngine()
        plan = engine._build_execution_plan(definition)
        assert "isolated" in plan
        assert "connected" in plan


# ---------------------------------------------------------------------------
# TEST-007 Additional: TestExecuteNodeRecordCounts (7 tests)
# ---------------------------------------------------------------------------

class TestExecuteNodeRecordCounts:
    """Tests for PipelineExecutionEngine._execute_node() record count by node type"""

    @pytest.fixture
    def engine(self):
        return PipelineExecutionEngine()

    @pytest.fixture
    def state(self):
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        return PipelineExecutionState(pipeline_id=99, definition=definition)

    @pytest.mark.asyncio
    async def test_database_source_returns_1000(self, engine, state):
        node = Mock()
        node.type = NodeType.DATABASE_SOURCE
        result = await engine._execute_node(state, node)
        assert result == 1000

    @pytest.mark.asyncio
    async def test_api_source_returns_1000(self, engine, state):
        node = Mock()
        node.type = NodeType.API_SOURCE
        result = await engine._execute_node(state, node)
        assert result == 1000

    @pytest.mark.asyncio
    async def test_file_source_returns_1000(self, engine, state):
        node = Mock()
        node.type = NodeType.FILE_SOURCE
        result = await engine._execute_node(state, node)
        assert result == 1000

    @pytest.mark.asyncio
    async def test_filter_node_returns_800(self, engine, state):
        node = Mock()
        node.type = NodeType.FILTER
        result = await engine._execute_node(state, node)
        assert result == 800

    @pytest.mark.asyncio
    async def test_map_node_returns_1000(self, engine, state):
        node = Mock()
        node.type = NodeType.MAP
        result = await engine._execute_node(state, node)
        assert result == 1000

    @pytest.mark.asyncio
    async def test_aggregate_node_returns_50(self, engine, state):
        node = Mock()
        node.type = NodeType.AGGREGATE
        result = await engine._execute_node(state, node)
        assert result == 50

    @pytest.mark.asyncio
    async def test_destination_node_returns_default_1000(self, engine, state):
        node = Mock()
        node.type = NodeType.DATABASE_DESTINATION
        result = await engine._execute_node(state, node)
        assert result == 1000


# ---------------------------------------------------------------------------
# TEST-007 Additional: TestCancelAndGetExecution (6 tests)
# ---------------------------------------------------------------------------

class TestCancelAndGetExecution:
    """Tests for get_execution_state() and cancel_execution()"""

    def test_get_state_returns_none_when_not_active(self):
        engine = PipelineExecutionEngine()
        result = engine.get_execution_state(pipeline_id=999)
        assert result is None

    def test_get_state_returns_state_when_active(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        engine.active_executions[1] = state
        result = engine.get_execution_state(pipeline_id=1)
        assert result is state

    def test_cancel_removes_from_active_executions(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        engine.active_executions[1] = state
        engine.cancel_execution(pipeline_id=1)
        assert 1 not in engine.active_executions

    def test_cancel_sets_status_to_failed(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        engine.active_executions[1] = state
        engine.cancel_execution(pipeline_id=1)
        assert state.status == ExecutionStatus.FAILED

    def test_cancel_nonexistent_pipeline_does_nothing(self):
        engine = PipelineExecutionEngine()
        engine.cancel_execution(pipeline_id=999)  # should not raise
        assert len(engine.active_executions) == 0

    def test_cancel_logs_warning_message(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        engine.active_executions[1] = state
        engine.cancel_execution(pipeline_id=1)
        warning_logs = [l for l in state.execution_log if l["level"] == "WARNING"]
        assert len(warning_logs) > 0


# ---------------------------------------------------------------------------
# TEST-007 Additional: TestExecutionFailureHandling (5 tests)
# ---------------------------------------------------------------------------

class TestExecutionFailureHandling:
    """Tests for rollback and failure handling"""

    @pytest.mark.asyncio
    async def test_rollback_sets_status_to_rolled_back(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        await engine._rollback_execution(state)
        assert state.status == ExecutionStatus.ROLLED_BACK

    @pytest.mark.asyncio
    async def test_rollback_logs_start_message(self):
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        await engine._rollback_execution(state)
        rollback_logs = [
            l for l in state.execution_log
            if "rollback" in l["message"].lower()
        ]
        assert len(rollback_logs) > 0

    @pytest.mark.asyncio
    async def test_rollback_processes_completed_steps_in_reverse(self):
        from backend.schemas.pipeline_visual import PipelineExecutionStep
        engine = PipelineExecutionEngine()
        definition = VisualPipelineDefinition(nodes=[], edges=[])
        state = PipelineExecutionState(pipeline_id=1, definition=definition)
        step = PipelineExecutionStep(
            step_number=1,
            node_id="n1",
            node_type=NodeType.DATABASE_SOURCE,
            status="completed"
        )
        state.steps.append(step)
        await engine._rollback_execution(state)
        step_logs = [
            l for l in state.execution_log if "Rolling back step" in l["message"]
        ]
        assert len(step_logs) > 0

    @pytest.mark.asyncio
    async def test_missing_node_in_definition_causes_failure(self):
        engine = PipelineExecutionEngine()
        nodes = [
            PipelineNode(id="n1", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={})
        ]
        edges = [PipelineEdge(id="e1", source="n1", target="nonexistent")]
        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        with patch("backend.services.pipeline_execution_engine.realtime_pipeline_service") as mock_rt:
            mock_rt.broadcast_pipeline_status = AsyncMock()
            mock_rt.broadcast_pipeline_progress = AsyncMock()
            mock_rt.broadcast_pipeline_error = AsyncMock()
            state = await engine.execute_pipeline(
                pipeline_id=99, definition=definition, dry_run=False
            )
        # Failure triggers rollback, so final status is ROLLED_BACK
        assert state.status == ExecutionStatus.ROLLED_BACK

    @pytest.mark.asyncio
    async def test_dry_run_does_not_register_in_active_executions(self):
        engine = PipelineExecutionEngine()
        nodes = [
            PipelineNode(id="n1", type=NodeType.DATABASE_SOURCE,
                         position=NodePosition(x=0, y=0), data={})
        ]
        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        with patch("backend.services.pipeline_execution_engine.realtime_pipeline_service") as mock_rt:
            mock_rt.broadcast_pipeline_status = AsyncMock()
            mock_rt.broadcast_pipeline_progress = AsyncMock()
            mock_rt.broadcast_pipeline_completed = AsyncMock()
            await engine.execute_pipeline(
                pipeline_id=1, definition=definition, dry_run=True
            )
        assert 1 not in engine.active_executions


# Run with:
# POSTGRES_SERVER=localhost POSTGRES_USER=user POSTGRES_PASSWORD=pass POSTGRES_DB=db \
# REDIS_URL=redis://localhost:6379 PYTHONPATH=/Users/Deepak/Public/Jade-Data-Aggregator \
# poetry run pytest testing/backend-tests/unit/services/test_pipeline_execution_engine.py -v
