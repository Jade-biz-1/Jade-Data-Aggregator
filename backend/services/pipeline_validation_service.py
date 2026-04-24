"""
Pipeline Validation Service
Validates visual pipeline definitions
"""

from typing import List, Dict, Optional
from backend.schemas.pipeline_visual import (
    VisualPipelineDefinition,
    PipelineValidationResult,
    ValidationIssue,
    PipelineNode,
    NodeType,
)

_NODE_LABELS: Dict[NodeType, str] = {
    NodeType.DATABASE_SOURCE: "Database Source",
    NodeType.API_SOURCE: "API Source",
    NodeType.FILE_SOURCE: "File Source",
    NodeType.FILTER: "Filter",
    NodeType.MAP: "Map / Field Mapping",
    NodeType.AGGREGATE: "Aggregate",
    NodeType.JOIN: "Join",
    NodeType.SORT: "Sort",
    NodeType.DATABASE_DESTINATION: "Database Destination",
    NodeType.FILE_DESTINATION: "File Destination",
    NodeType.API_DESTINATION: "API Destination",
    NodeType.WAREHOUSE_DESTINATION: "Warehouse Destination",
}


def _node_display(node: PipelineNode) -> str:
    nt = node.resolve_node_type()
    label = node.data.get("label") or (
        _NODE_LABELS.get(nt, str(nt)) if nt else node.type
    )
    return f'"{label}" ({node.id})'


class PipelineValidationService:
    """Service for validating pipeline definitions"""

    def __init__(self):
        # Define valid connections between node types
        self.valid_connections = {
            NodeType.DATABASE_SOURCE: [
                NodeType.FILTER, NodeType.MAP, NodeType.AGGREGATE,
                NodeType.JOIN, NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION
            ],
            NodeType.API_SOURCE: [
                NodeType.FILTER, NodeType.MAP, NodeType.AGGREGATE,
                NodeType.JOIN, NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.API_DESTINATION
            ],
            NodeType.FILE_SOURCE: [
                NodeType.FILTER, NodeType.MAP, NodeType.AGGREGATE,
                NodeType.JOIN, NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION
            ],
            NodeType.FILTER: [
                NodeType.MAP, NodeType.AGGREGATE, NodeType.JOIN,
                NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION,
                NodeType.API_DESTINATION
            ],
            NodeType.MAP: [
                NodeType.FILTER, NodeType.AGGREGATE, NodeType.JOIN,
                NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION,
                NodeType.API_DESTINATION
            ],
            NodeType.AGGREGATE: [
                NodeType.MAP, NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION,
                NodeType.API_DESTINATION
            ],
            NodeType.JOIN: [
                NodeType.FILTER, NodeType.MAP, NodeType.AGGREGATE,
                NodeType.SORT, NodeType.DATABASE_DESTINATION,
                NodeType.FILE_DESTINATION, NodeType.WAREHOUSE_DESTINATION,
                NodeType.API_DESTINATION
            ],
            NodeType.SORT: [
                NodeType.DATABASE_DESTINATION, NodeType.FILE_DESTINATION,
                NodeType.WAREHOUSE_DESTINATION, NodeType.API_DESTINATION
            ]
        }

        self.source_nodes = {
            NodeType.DATABASE_SOURCE,
            NodeType.API_SOURCE,
            NodeType.FILE_SOURCE
        }

        self.destination_nodes = {
            NodeType.DATABASE_DESTINATION,
            NodeType.FILE_DESTINATION,
            NodeType.API_DESTINATION,
            NodeType.WAREHOUSE_DESTINATION
        }

    def validate_pipeline(
        self,
        definition: VisualPipelineDefinition,
    ) -> PipelineValidationResult:
        """Validate a complete pipeline definition."""
        issues: List[ValidationIssue] = []

        def error(msg: str, suggestion: str = "", node: Optional[PipelineNode] = None) -> None:
            issues.append(ValidationIssue(
                severity="error", message=msg, suggestion=suggestion,
                node_id=node.id if node else None,
                node_label=node.data.get("label") if node else None,
            ))

        def warning(msg: str, suggestion: str = "", node: Optional[PipelineNode] = None) -> None:
            issues.append(ValidationIssue(
                severity="warning", message=msg, suggestion=suggestion,
                node_id=node.id if node else None,
                node_label=node.data.get("label") if node else None,
            ))

        def suggestion(msg: str) -> None:
            issues.append(ValidationIssue(severity="suggestion", message=msg, suggestion=""))

        if not definition.nodes:
            error(
                "Pipeline has no nodes.",
                "Open the Node Palette on the left and drag at least one Source, "
                "one Transformation (optional), and one Destination node onto the canvas.",
            )
            return self._build_result(issues)

        node_map = {n.id: n for n in definition.nodes}
        type_map = {n.id: n.resolve_node_type() for n in definition.nodes}

        # ── Source / destination presence ─────────────────────────────────────
        has_source = any(t in self.source_nodes for t in type_map.values() if t)
        has_destination = any(t in self.destination_nodes for t in type_map.values() if t)

        if not has_source:
            error(
                "Pipeline has no source node.",
                "Drag a Source node (Database, File, or API) from the Node Palette "
                "onto the canvas and configure it with a connector.",
            )

        if not has_destination:
            error(
                "Pipeline has no destination node.",
                "Drag a Destination node (File, Database, or API) from the Node Palette "
                "onto the canvas and configure it with an output path or connector.",
            )

        # ── Unknown node types ────────────────────────────────────────────────
        for node in definition.nodes:
            if type_map[node.id] is None:
                error(
                    f"Node {_node_display(node)} has an unrecognised type: '{node.type}'.",
                    "Delete this node and replace it with a node from the Node Palette.",
                    node,
                )

        # ── Unconfigured nodes ────────────────────────────────────────────────
        for node in definition.nodes:
            if not node.data.get("isConfigured"):
                nt = type_map[node.id]
                if nt in self.source_nodes:
                    hint = "Click the node and select a connector."
                elif nt in self.destination_nodes:
                    hint = "Click the node and set the output path or connector."
                else:
                    hint = "Click the node to open its configuration panel and fill in the required fields."
                warning(
                    f"Node {_node_display(node)} is not configured.",
                    hint,
                    node,
                )

        # ── Edge validation ───────────────────────────────────────────────────
        for edge in definition.edges:
            if edge.source not in node_map:
                error(
                    f"Edge references missing source node '{edge.source}'.",
                    "Delete and re-draw this connection.",
                )
                continue
            if edge.target not in node_map:
                error(
                    f"Edge references missing target node '{edge.target}'.",
                    "Delete and re-draw this connection.",
                )
                continue

            src_type = type_map[edge.source]
            tgt_type = type_map[edge.target]

            if src_type and tgt_type and src_type in self.valid_connections:
                if tgt_type not in self.valid_connections[src_type]:
                    src_label = _NODE_LABELS.get(src_type, str(src_type))
                    tgt_label = _NODE_LABELS.get(tgt_type, str(tgt_type))
                    valid_targets = ", ".join(
                        _NODE_LABELS.get(t, str(t))
                        for t in self.valid_connections[src_type]
                    )
                    error(
                        f"Invalid connection: {src_label} → {tgt_label}.",
                        f"A {src_label} node can only connect to: {valid_targets}.",
                        node_map[edge.source],
                    )

        # ── Disconnected nodes ────────────────────────────────────────────────
        connected = set()
        for e in definition.edges:
            connected.add(e.source)
            connected.add(e.target)
        for node in definition.nodes:
            if node.id not in connected and len(definition.nodes) > 1:
                nt = type_map[node.id]
                if nt in self.source_nodes:
                    hint = "Draw an edge from this source node to a Transformation or Destination node."
                elif nt in self.destination_nodes:
                    hint = "Draw an edge from a Source or Transformation node into this destination node."
                else:
                    hint = "Connect this node to the pipeline by drawing edges to/from neighbouring nodes."
                warning(
                    f"Node {_node_display(node)} is not connected to any other node.",
                    hint,
                    node,
                )

        # ── Cycles ────────────────────────────────────────────────────────────
        if self._has_cycles(definition.edges):
            error(
                "Pipeline contains a cycle.",
                "Data pipelines must flow in one direction. Remove the edge that "
                "creates the loop — hover over edges to reveal delete buttons.",
            )

        # ── Unreachable destinations ──────────────────────────────────────────
        unreachable = self._find_unreachable_destinations(definition.nodes, definition.edges)
        for node_id in unreachable:
            node = node_map.get(node_id)
            if node:
                warning(
                    f"Destination node {_node_display(node)} cannot be reached from any source.",
                    "Ensure there is an unbroken chain of edges from a Source node to this destination.",
                    node,
                )

        # ── Filter node config check ──────────────────────────────────────────
        for node in definition.nodes:
            if type_map[node.id] == NodeType.FILTER:
                cfg = node.data.get("config") or {}
                if not cfg.get("condition", "").strip():
                    warning(
                        f"Filter node {_node_display(node)} has no condition set.",
                        "Click the node, enter a condition such as  make == 'BMW'  or  "
                        "mileage > 20000  in the Filter Condition field, then save.",
                        node,
                    )

        # ── Suggestions ───────────────────────────────────────────────────────
        transform_count = sum(
            1 for t in type_map.values() if t and t not in self.source_nodes | self.destination_nodes
        )
        if transform_count == 0 and has_source and has_destination:
            suggestion(
                "No transformation nodes are present. Consider adding a Filter or Map node "
                "between the source and destination to shape your data."
            )

        return self._build_result(issues)

    @staticmethod
    def _build_result(issues: List[ValidationIssue]) -> PipelineValidationResult:
        errors = [i.message for i in issues if i.severity == "error"]
        warnings = [i.message for i in issues if i.severity == "warning"]
        suggestions = [i.message for i in issues if i.severity == "suggestion"]
        return PipelineValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            issues=issues,
        )

    def _has_cycles(self, edges: List) -> bool:
        """Check if the pipeline has cycles using DFS"""
        # Build adjacency list
        graph = {}
        for edge in edges:
            if edge.source not in graph:
                graph[edge.source] = []
            graph[edge.source].append(edge.target)

        visited = set()
        rec_stack = set()

        def has_cycle_util(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)

            if node in graph:
                for neighbor in graph[node]:
                    if neighbor not in visited:
                        if has_cycle_util(neighbor):
                            return True
                    elif neighbor in rec_stack:
                        return True

            rec_stack.remove(node)
            return False

        for node in graph:
            if node not in visited:
                if has_cycle_util(node):
                    return True

        return False

    def _find_unreachable_destinations(self, nodes: List, edges: List) -> List[str]:
        graph: Dict[str, List[str]] = {}
        for edge in edges:
            graph.setdefault(edge.source, []).append(edge.target)

        sources = [n.id for n in nodes if n.resolve_node_type() in self.source_nodes]
        reachable: set = set()

        def dfs(nid: str) -> None:
            reachable.add(nid)
            for nb in graph.get(nid, []):
                if nb not in reachable:
                    dfs(nb)

        for src in sources:
            dfs(src)

        return [
            n.id for n in nodes
            if n.resolve_node_type() in self.destination_nodes and n.id not in reachable
        ]


# Global service instance
pipeline_validation_service = PipelineValidationService()
