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
import { NodeConfigPanel } from './config/NodeConfigPanel';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import { AlertCircle, CheckCircle, X, Workflow } from 'lucide-react';
import { getLayoutedElements } from '@/lib/autoLayout';

const nodeTypes = {
  source: SourceNode,
  transformation: TransformationNode,
  destination: DestinationNode
};


interface PipelineCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

export function PipelineCanvas(props: PipelineCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onSave, readOnly = false } = props;
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
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

      setValidationResult({
        valid: result.is_valid,
        errors: result.errors || []
      });

      // Auto-hide success message after 3 seconds
      if (result.is_valid) {
        setTimeout(() => setValidationResult(null), 3000);
      }
    } catch (error: any) {
      setValidationResult({
        valid: false,
        errors: [error.message || 'Validation failed']
      });
    } finally {
      setIsValidating(false);
    }
  }, [nodes, edges]);

  const handleConfigSave = useCallback((nodeId: string, config: any) => {
    onNodesChange((nds: Node[]) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
              isConfigured: true
            }
          };
        }
        return node;
      })
    );
  }, [onNodesChange]);

  const handleCloseConfig = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges, 'LR');
    onNodesChange(layouted.nodes);
    onEdgesChange(layouted.edges);
  }, [nodes, edges, onNodesChange, onEdgesChange]);

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

        {/* Validation Result */}
        {validationResult && (
          <Panel position="top-left" className="max-w-md">
            <div className={`p-4 rounded-lg border shadow-lg ${
              validationResult.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${
                    validationResult.valid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                  </h4>
                  {!validationResult.valid && validationResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {validationResult.valid && (
                    <p className="mt-1 text-sm text-green-700">
                      Your pipeline is ready to save and execute
                    </p>
                  )}
                </div>
                {!validationResult.valid && (
                  <button
                    onClick={() => setValidationResult(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Node Configuration Panel */}
      {selectedNode && !readOnly && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          onClose={handleCloseConfig}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
}
