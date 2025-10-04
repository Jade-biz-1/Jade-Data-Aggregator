"""
Pipeline Validation Service
Validates visual pipeline definitions
"""

from typing import List, Dict, Set
from backend.schemas.pipeline_visual import (
    VisualPipelineDefinition,
    PipelineValidationResult,
    NodeType
)


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
        definition: VisualPipelineDefinition
    ) -> PipelineValidationResult:
        """
        Validate a complete pipeline definition
        """
        errors = []
        warnings = []
        suggestions = []

        # Check if pipeline has nodes
        if not definition.nodes:
            errors.append("Pipeline must have at least one node")
            return PipelineValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions
            )

        # Create node lookup
        node_map = {node.id: node for node in definition.nodes}

        # Validate nodes
        has_source = False
        has_destination = False

        for node in definition.nodes:
            # Check for source and destination
            if node.type in self.source_nodes:
                has_source = True
            if node.type in self.destination_nodes:
                has_destination = True

        if not has_source:
            errors.append("Pipeline must have at least one source node")

        if not has_destination:
            errors.append("Pipeline must have at least one destination node")

        # Validate edges
        edge_validation = self._validate_edges(definition.edges, node_map)
        errors.extend(edge_validation["errors"])
        warnings.extend(edge_validation["warnings"])

        # Check for disconnected nodes
        disconnected = self._find_disconnected_nodes(definition.nodes, definition.edges)
        if disconnected:
            warnings.append(
                f"Disconnected nodes found: {', '.join(disconnected)}"
            )

        # Check for cycles
        if self._has_cycles(definition.edges):
            errors.append("Pipeline contains cycles - cyclic pipelines are not supported")

        # Check for unreachable destinations
        unreachable = self._find_unreachable_destinations(
            definition.nodes,
            definition.edges
        )
        if unreachable:
            warnings.append(
                f"Unreachable destination nodes: {', '.join(unreachable)}"
            )

        # Add suggestions
        if len(definition.nodes) == 1:
            suggestions.append("Consider adding transformation nodes to process your data")

        is_valid = len(errors) == 0

        return PipelineValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )

    def _validate_edges(
        self,
        edges: List,
        node_map: Dict
    ) -> Dict[str, List[str]]:
        """Validate edge connections"""
        errors = []
        warnings = []

        for edge in edges:
            # Check if source and target nodes exist
            if edge.source not in node_map:
                errors.append(f"Edge source node '{edge.source}' not found")
                continue

            if edge.target not in node_map:
                errors.append(f"Edge target node '{edge.target}' not found")
                continue

            source_node = node_map[edge.source]
            target_node = node_map[edge.target]

            # Check if connection is valid
            if source_node.type in self.valid_connections:
                valid_targets = self.valid_connections[source_node.type]
                if target_node.type not in valid_targets:
                    errors.append(
                        f"Invalid connection: {source_node.type} cannot connect to {target_node.type}"
                    )

        return {"errors": errors, "warnings": warnings}

    def _find_disconnected_nodes(
        self,
        nodes: List,
        edges: List
    ) -> List[str]:
        """Find nodes that are not connected to any other node"""
        connected_nodes = set()

        for edge in edges:
            connected_nodes.add(edge.source)
            connected_nodes.add(edge.target)

        disconnected = [
            node.id for node in nodes
            if node.id not in connected_nodes
        ]

        return disconnected

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

    def _find_unreachable_destinations(
        self,
        nodes: List,
        edges: List
    ) -> List[str]:
        """Find destination nodes that cannot be reached from source nodes"""
        # Build adjacency list
        graph = {}
        for edge in edges:
            if edge.source not in graph:
                graph[edge.source] = []
            graph[edge.source].append(edge.target)

        # Find all source nodes
        sources = [node.id for node in nodes if node.type in self.source_nodes]

        # Find all reachable nodes from sources
        reachable = set()

        def dfs(node: str):
            reachable.add(node)
            if node in graph:
                for neighbor in graph[node]:
                    if neighbor not in reachable:
                        dfs(neighbor)

        for source in sources:
            dfs(source)

        # Find unreachable destination nodes
        unreachable = [
            node.id for node in nodes
            if node.type in self.destination_nodes and node.id not in reachable
        ]

        return unreachable


# Global service instance
pipeline_validation_service = PipelineValidationService()
