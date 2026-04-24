'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';

import { SourceNode } from './nodes/source-node';
import { TransformationNode } from './nodes/transformation-node';
import { DestinationNode } from './nodes/destination-node';
import { NodeConfigPanel } from './config/NodeConfigPanel';
import { ValidationErrorModal, ValidationResult } from './ValidationErrorModal';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import { Workflow } from 'lucide-react';
import { getLayoutedElements } from '@/lib/autoLayout';

const nodeTypes = {
  source: SourceNode,
  transformation: TransformationNode,
  destination: DestinationNode
};


interface PipelineCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: any) => void;
  onNodeConfigSave?: (nodeId: string, config: any, label: string) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

export function PipelineCanvas(props: PipelineCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onNodeConfigSave, onSave, readOnly = false } = props;
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      // React Flow expects onEdgesChange to receive a change array, not an updater
      onEdgesChange([{ type: 'add', item: { ...params, id: `${params.source}-${params.target}` } }]);
    },
    [onEdgesChange, readOnly]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    setSelectedNode(node);
  }, [readOnly]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await pipelineBuilderService.validatePipeline(nodes, edges);
      setValidationResult(result);

      // Auto-dismiss if valid and no notices
      if (result.is_valid && (!result.issues || result.issues.length === 0)) {
        setTimeout(() => setValidationResult(null), 2000);
      }
    } catch (error: any) {
      setValidationResult({
        is_valid: false,
        errors: [error.message || 'Validation failed'],
        warnings: [],
        suggestions: [],
      });
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges]);

  const handleFocusNode = useCallback((nodeId: string) => {
    setValidationResult(null);
    // Highlight the target node by selecting it
    onNodesChange([{ type: 'select', id: nodeId, selected: true }]);
  }, [onNodesChange]);

  const handleConfigSave = useCallback((nodeId: string, config: any, label: string) => {
    if (onNodeConfigSave) {
      onNodeConfigSave(nodeId, config, label);
    }
  }, [onNodeConfigSave]);

  const handleCloseConfig = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges, 'LR');
    const positionChanges: NodeChange[] = layouted.nodes.map((node) => ({
      type: 'position' as const,
      id: node.id,
      position: node.position,
      dragging: false,
    }));
    onNodesChange(positionChanges);
    // edges don't change position in dagre layout, no edge changes needed
  }, [nodes, edges, onNodesChange]);

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
              onClick={handleAutoLayout}
              disabled={nodes.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Auto-arrange nodes"
            >
              <Workflow className="h-4 w-4" />
              Auto-Layout
            </button>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Validate'}
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

      {/* Node Configuration Panel */}
      {selectedNode && !readOnly && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          allNodes={nodes}
          allEdges={edges}
          onClose={handleCloseConfig}
          onSave={handleConfigSave}
        />
      )}

      {/* Validation Result Modal */}
      {validationResult && (
        <ValidationErrorModal
          result={validationResult}
          onClose={() => setValidationResult(null)}
          onFocusNode={handleFocusNode}
        />
      )}
    </div>
  );
}
