'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { SourceNode } from './nodes/source-node';
import { TransformationNode } from './nodes/transformation-node';
import { DestinationNode } from './nodes/destination-node';

const nodeTypes = {
  source: SourceNode,
  transformation: TransformationNode,
  destination: DestinationNode
};

interface PipelineCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

export function PipelineCanvas({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readOnly = false
}: PipelineCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, readOnly]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const handleValidate = useCallback(() => {
    // Validation logic
    const hasSource = nodes.some(n => n.type === 'source');
    const hasDestination = nodes.some(n => n.type === 'destination');

    if (!hasSource) {
      alert('Pipeline must have at least one source node');
      return false;
    }

    if (!hasDestination) {
      alert('Pipeline must have at least one destination node');
      return false;
    }

    alert('Pipeline validation passed!');
    return true;
  }, [nodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'source') return '#3b82f6';
            if (n.type === 'transformation') return '#8b5cf6';
            if (n.type === 'destination') return '#10b981';
            return '#6b7280';
          }}
          nodeColor={(n) => {
            if (n.type === 'source') return '#dbeafe';
            if (n.type === 'transformation') return '#ede9fe';
            if (n.type === 'destination') return '#d1fae5';
            return '#f3f4f6';
          }}
          nodeBorderRadius={8}
        />

        {!readOnly && (
          <Panel position="top-right" className="space-x-2">
            <button
              onClick={handleValidate}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm"
            >
              Validate
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm"
            >
              Save Pipeline
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
