"""
Enhanced Pipeline Execution Engine
Handles step-by-step execution with state tracking and rollback
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import asyncio
import logging

from backend.schemas.pipeline_visual import (
    VisualPipelineDefinition,
    PipelineExecutionStep,
    NodeType
)
from backend.services.realtime_pipeline_service import realtime_pipeline_service

logger = logging.getLogger(__name__)


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class PipelineExecutionState:
    """Tracks the state of pipeline execution"""

    def __init__(self, pipeline_id: int, definition: VisualPipelineDefinition):
        self.pipeline_id = pipeline_id
        self.definition = definition
        self.status = ExecutionStatus.PENDING
        self.steps: List[PipelineExecutionStep] = []
        self.current_step = 0
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.total_records_processed = 0
        self.execution_log: List[Dict[str, Any]] = []
        self.rollback_data: Dict[str, Any] = {}

    def add_log(self, level: str, message: str, metadata: Optional[Dict] = None):
        """Add entry to execution log"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "metadata": metadata or {}
        }
        self.execution_log.append(log_entry)


class PipelineExecutionEngine:
    """Enhanced pipeline execution engine"""

    def __init__(self):
        self.active_executions: Dict[int, PipelineExecutionState] = {}

    async def execute_pipeline(
        self,
        pipeline_id: int,
        definition: VisualPipelineDefinition,
        dry_run: bool = False
    ) -> PipelineExecutionState:
        """
        Execute a visual pipeline step by step
        """
        # Create execution state
        state = PipelineExecutionState(pipeline_id, definition)
        state.status = ExecutionStatus.RUNNING
        state.start_time = datetime.now()

        if not dry_run:
            self.active_executions[pipeline_id] = state

        try:
            # Broadcast pipeline started
            await realtime_pipeline_service.broadcast_pipeline_status(
                pipeline_id=pipeline_id,
                status="running",
                metadata={"dry_run": dry_run}
            )

            # Build execution plan
            execution_plan = self._build_execution_plan(definition)
            state.add_log("INFO", f"Execution plan built with {len(execution_plan)} steps")

            # Execute each step
            for step_number, node_id in enumerate(execution_plan, 1):
                node = next((n for n in definition.nodes if n.id == node_id), None)

                if not node:
                    raise Exception(f"Node {node_id} not found in definition")

                # Create execution step
                step = PipelineExecutionStep(
                    step_number=step_number,
                    node_id=node_id,
                    node_type=node.type,
                    status="running",
                    start_time=datetime.now().isoformat()
                )
                state.steps.append(step)
                state.current_step = step_number

                # Broadcast progress
                progress = (step_number / len(execution_plan)) * 100
                await realtime_pipeline_service.broadcast_pipeline_progress(
                    pipeline_id=pipeline_id,
                    progress_percent=progress,
                    current_step=node.label or node.type,
                    total_steps=len(execution_plan),
                    current_step_number=step_number,
                    records_processed=state.total_records_processed
                )

                # Execute the step
                if not dry_run:
                    records_processed = await self._execute_node(state, node)
                    step.records_processed = records_processed
                    state.total_records_processed += records_processed
                else:
                    # Simulate execution in dry run
                    await asyncio.sleep(0.1)
                    step.records_processed = 100  # Mock value

                # Mark step as completed
                step.status = "completed"
                step.end_time = datetime.now().isoformat()

                state.add_log(
                    "INFO",
                    f"Step {step_number} completed: {node.type}",
                    {"records_processed": step.records_processed}
                )

            # Mark pipeline as completed
            state.status = ExecutionStatus.COMPLETED
            state.end_time = datetime.now()

            duration = (state.end_time - state.start_time).total_seconds()

            await realtime_pipeline_service.broadcast_pipeline_completed(
                pipeline_id=pipeline_id,
                success=True,
                duration_seconds=duration,
                records_processed=state.total_records_processed,
                summary={
                    "total_steps": len(execution_plan),
                    "dry_run": dry_run
                }
            )

        except Exception as e:
            state.status = ExecutionStatus.FAILED
            state.end_time = datetime.now()
            state.add_log("ERROR", str(e))

            logger.error(f"Pipeline {pipeline_id} execution failed: {e}")

            await realtime_pipeline_service.broadcast_pipeline_error(
                pipeline_id=pipeline_id,
                error_message=str(e),
                error_type=type(e).__name__
            )

            # Attempt rollback if not dry run
            if not dry_run:
                await self._rollback_execution(state)

        finally:
            if not dry_run and pipeline_id in self.active_executions:
                del self.active_executions[pipeline_id]

        return state

    def _build_execution_plan(
        self,
        definition: VisualPipelineDefinition
    ) -> List[str]:
        """
        Build execution plan using topological sort
        """
        # Build dependency graph
        dependencies = {}
        in_degree = {}

        for node in definition.nodes:
            dependencies[node.id] = []
            in_degree[node.id] = 0

        for edge in definition.edges:
            dependencies[edge.source].append(edge.target)
            in_degree[edge.target] = in_degree.get(edge.target, 0) + 1

        # Topological sort
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        execution_plan = []

        while queue:
            current = queue.pop(0)
            execution_plan.append(current)

            for neighbor in dependencies.get(current, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return execution_plan

    async def _execute_node(
        self,
        state: PipelineExecutionState,
        node: Any
    ) -> int:
        """
        Execute a single pipeline node
        In production, this would interface with actual data processing
        """
        # Simulate node execution
        await asyncio.sleep(0.2)

        # Mock record processing based on node type
        if node.type in [NodeType.DATABASE_SOURCE, NodeType.API_SOURCE, NodeType.FILE_SOURCE]:
            return 1000  # Mock source records
        elif node.type == NodeType.FILTER:
            return 800  # Mock filtered records
        elif node.type == NodeType.MAP:
            return 1000  # Same as input
        elif node.type == NodeType.AGGREGATE:
            return 50  # Aggregated records
        else:
            return 1000  # Default

    async def _rollback_execution(self, state: PipelineExecutionState):
        """
        Rollback failed pipeline execution
        """
        try:
            state.add_log("INFO", "Starting rollback")

            # Reverse the completed steps
            for step in reversed(state.steps):
                if step.status == "completed":
                    state.add_log(
                        "INFO",
                        f"Rolling back step {step.step_number}: {step.node_type}"
                    )
                    # In production, this would undo the step's operations
                    await asyncio.sleep(0.1)

            state.status = ExecutionStatus.ROLLED_BACK
            state.add_log("INFO", "Rollback completed")

        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            state.add_log("ERROR", f"Rollback failed: {str(e)}")

    def get_execution_state(self, pipeline_id: int) -> Optional[PipelineExecutionState]:
        """Get current execution state for a pipeline"""
        return self.active_executions.get(pipeline_id)

    def cancel_execution(self, pipeline_id: int):
        """Cancel an active pipeline execution"""
        if pipeline_id in self.active_executions:
            state = self.active_executions[pipeline_id]
            state.status = ExecutionStatus.FAILED
            state.add_log("WARNING", "Execution cancelled by user")
            del self.active_executions[pipeline_id]


# Global engine instance
pipeline_execution_engine = PipelineExecutionEngine()
