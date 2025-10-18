"""
Unit tests for Pipeline Validation Service
Tests pipeline definition validation, node connections, and error detection
"""

import pytest
from backend.services.pipeline_validation_service import PipelineValidationService
from backend.schemas.pipeline_visual import (
    VisualPipelineDefinition,
    PipelineNode,
    PipelineEdge,
    NodeType,
    Position
)


class TestPipelineValidationService:
    """Test suite for PipelineValidationService"""

    @pytest.fixture
    def service(self):
        """Create a pipeline validation service instance"""
        return PipelineValidationService()

    def test_validate_empty_pipeline(self, service):
        """Test validation of empty pipeline (should fail)"""
        definition = VisualPipelineDefinition(
            nodes=[],
            edges=[]
        )

        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert len(result.errors) > 0
        assert "Pipeline must have at least one node" in result.errors

    def test_validate_pipeline_missing_source(self, service):
        """Test validation of pipeline without source node"""
        nodes = [
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=0, y=0),
                data={"name": "Destination"}
            )
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert "Pipeline must have at least one source node" in result.errors

    def test_validate_pipeline_missing_destination(self, service):
        """Test validation of pipeline without destination node"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source"}
            )
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert "Pipeline must have at least one destination node" in result.errors

    def test_validate_valid_simple_pipeline(self, service):
        """Test validation of valid simple pipeline (source -> destination)"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Database Source"}
            ),
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=400, y=0),
                data={"name": "Database Destination"}
            )
        ]

        edges = [
            PipelineEdge(
                id="edge1",
                source="source1",
                target="dest1"
            )
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_validate_pipeline_with_transformations(self, service):
        """Test validation of pipeline with transformation nodes"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.API_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "API Source"}
            ),
            PipelineNode(
                id="filter1",
                type=NodeType.FILTER,
                position=Position(x=200, y=0),
                data={"name": "Filter"}
            ),
            PipelineNode(
                id="map1",
                type=NodeType.MAP,
                position=Position(x=400, y=0),
                data={"name": "Map"}
            ),
            PipelineNode(
                id="dest1",
                type=NodeType.FILE_DESTINATION,
                position=Position(x=600, y=0),
                data={"name": "File Destination"}
            )
        ]

        edges = [
            PipelineEdge(id="edge1", source="source1", target="filter1"),
            PipelineEdge(id="edge2", source="filter1", target="map1"),
            PipelineEdge(id="edge3", source="map1", target="dest1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_validate_invalid_connection(self, service):
        """Test validation of invalid node connection"""
        nodes = [
            PipelineNode(
                id="sort1",
                type=NodeType.SORT,
                position=Position(x=0, y=0),
                data={"name": "Sort"}
            ),
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=200, y=0),
                data={"name": "Source"}
            )
        ]

        # SORT cannot connect to SOURCE (invalid connection)
        edges = [
            PipelineEdge(id="edge1", source="sort1", target="source1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert any("Invalid connection" in error for error in result.errors)

    def test_validate_edge_with_missing_source_node(self, service):
        """Test validation of edge referencing non-existent source node"""
        nodes = [
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=0, y=0),
                data={"name": "Destination"}
            )
        ]

        edges = [
            PipelineEdge(id="edge1", source="nonexistent", target="dest1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert any("source node" in error and "not found" in error for error in result.errors)

    def test_validate_edge_with_missing_target_node(self, service):
        """Test validation of edge referencing non-existent target node"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source"}
            )
        ]

        edges = [
            PipelineEdge(id="edge1", source="source1", target="nonexistent")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert any("target node" in error and "not found" in error for error in result.errors)

    def test_find_disconnected_nodes(self, service):
        """Test detection of disconnected nodes"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source"}
            ),
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=200, y=0),
                data={"name": "Destination"}
            ),
            PipelineNode(
                id="orphan",
                type=NodeType.FILTER,
                position=Position(x=400, y=0),
                data={"name": "Orphan Filter"}
            )
        ]

        edges = [
            PipelineEdge(id="edge1", source="source1", target="dest1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        # Should have warning about disconnected node
        assert len(result.warnings) > 0
        assert any("Disconnected" in warning and "orphan" in warning for warning in result.warnings)

    def test_detect_cycles(self, service):
        """Test detection of cycles in pipeline"""
        nodes = [
            PipelineNode(id="node1", type=NodeType.FILTER, position=Position(x=0, y=0), data={}),
            PipelineNode(id="node2", type=NodeType.MAP, position=Position(x=100, y=0), data={}),
            PipelineNode(id="node3", type=NodeType.AGGREGATE, position=Position(x=200, y=0), data={})
        ]

        # Create a cycle: node1 -> node2 -> node3 -> node1
        edges = [
            PipelineEdge(id="edge1", source="node1", target="node2"),
            PipelineEdge(id="edge2", source="node2", target="node3"),
            PipelineEdge(id="edge3", source="node3", target="node1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is False
        assert any("cycle" in error.lower() for error in result.errors)

    def test_detect_unreachable_destinations(self, service):
        """Test detection of unreachable destination nodes"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source"}
            ),
            PipelineNode(
                id="dest1",
                type=NodeType.DATABASE_DESTINATION,
                position=Position(x=200, y=0),
                data={"name": "Reachable Destination"}
            ),
            PipelineNode(
                id="dest2",
                type=NodeType.FILE_DESTINATION,
                position=Position(x=400, y=0),
                data={"name": "Unreachable Destination"}
            )
        ]

        # Only connect source to dest1, dest2 is unreachable
        edges = [
            PipelineEdge(id="edge1", source="source1", target="dest1")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        # Should have warning about unreachable destination
        assert len(result.warnings) > 0
        assert any("Unreachable destination" in warning for warning in result.warnings)

    def test_validate_complex_valid_pipeline(self, service):
        """Test validation of complex multi-branch pipeline"""
        nodes = [
            PipelineNode(id="source1", type=NodeType.DATABASE_SOURCE, position=Position(x=0, y=0), data={}),
            PipelineNode(id="filter1", type=NodeType.FILTER, position=Position(x=200, y=0), data={}),
            PipelineNode(id="map1", type=NodeType.MAP, position=Position(x=400, y=-100), data={}),
            PipelineNode(id="agg1", type=NodeType.AGGREGATE, position=Position(x=400, y=100), data={}),
            PipelineNode(id="dest1", type=NodeType.DATABASE_DESTINATION, position=Position(x=600, y=-100), data={}),
            PipelineNode(id="dest2", type=NodeType.FILE_DESTINATION, position=Position(x=600, y=100), data={})
        ]

        edges = [
            PipelineEdge(id="edge1", source="source1", target="filter1"),
            PipelineEdge(id="edge2", source="filter1", target="map1"),
            PipelineEdge(id="edge3", source="filter1", target="agg1"),
            PipelineEdge(id="edge4", source="map1", target="dest1"),
            PipelineEdge(id="edge5", source="agg1", target="dest2")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_suggestions_for_single_node_pipeline(self, service):
        """Test that suggestions are provided for minimal pipelines"""
        nodes = [
            PipelineNode(
                id="source1",
                type=NodeType.DATABASE_SOURCE,
                position=Position(x=0, y=0),
                data={"name": "Source"}
            )
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=[])
        result = service.validate_pipeline(definition)

        # Should have suggestions for single-node pipeline
        assert len(result.suggestions) > 0
        assert any("transformation" in suggestion.lower() for suggestion in result.suggestions)

    def test_all_source_types_valid(self, service):
        """Test that all source node types are recognized"""
        source_types = [
            NodeType.DATABASE_SOURCE,
            NodeType.API_SOURCE,
            NodeType.FILE_SOURCE
        ]

        for source_type in source_types:
            nodes = [
                PipelineNode(id="source", type=source_type, position=Position(x=0, y=0), data={}),
                PipelineNode(id="dest", type=NodeType.DATABASE_DESTINATION, position=Position(x=200, y=0), data={})
            ]
            edges = [PipelineEdge(id="edge1", source="source", target="dest")]

            definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
            result = service.validate_pipeline(definition)

            assert result.is_valid is True, f"Failed for source type: {source_type}"

    def test_all_destination_types_valid(self, service):
        """Test that all destination node types are recognized"""
        destination_types = [
            NodeType.DATABASE_DESTINATION,
            NodeType.FILE_DESTINATION,
            NodeType.API_DESTINATION,
            NodeType.WAREHOUSE_DESTINATION
        ]

        for dest_type in destination_types:
            nodes = [
                PipelineNode(id="source", type=NodeType.DATABASE_SOURCE, position=Position(x=0, y=0), data={}),
                PipelineNode(id="dest", type=dest_type, position=Position(x=200, y=0), data={})
            ]
            edges = [PipelineEdge(id="edge1", source="source", target="dest")]

            definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
            result = service.validate_pipeline(definition)

            assert result.is_valid is True, f"Failed for destination type: {dest_type}"

    def test_join_node_in_pipeline(self, service):
        """Test validation of pipeline with JOIN node"""
        nodes = [
            PipelineNode(id="source1", type=NodeType.DATABASE_SOURCE, position=Position(x=0, y=0), data={}),
            PipelineNode(id="source2", type=NodeType.API_SOURCE, position=Position(x=0, y=100), data={}),
            PipelineNode(id="join1", type=NodeType.JOIN, position=Position(x=200, y=50), data={}),
            PipelineNode(id="dest", type=NodeType.DATABASE_DESTINATION, position=Position(x=400, y=50), data={})
        ]

        edges = [
            PipelineEdge(id="edge1", source="source1", target="join1"),
            PipelineEdge(id="edge2", source="source2", target="join1"),
            PipelineEdge(id="edge3", source="join1", target="dest")
        ]

        definition = VisualPipelineDefinition(nodes=nodes, edges=edges)
        result = service.validate_pipeline(definition)

        assert result.is_valid is True
