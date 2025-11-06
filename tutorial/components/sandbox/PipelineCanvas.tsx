'use client';

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Database,
  Zap,
  Target,
  Play,
  Save,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

// Custom Node Components
const SourceNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-blue-500 border-2 border-blue-600 min-w-[180px]">
    <div className="flex items-center gap-2 text-white">
      <Database className="w-5 h-5" />
      <div>
        <div className="font-semibold text-sm">{data.label}</div>
        {data.connector && (
          <div className="text-xs opacity-90 mt-1">{data.connector}</div>
        )}
      </div>
    </div>
    {data.status && (
      <div className="mt-2 text-xs text-white flex items-center gap-1">
        {data.status === 'success' ? <CheckCircle className="w-3 h-3" /> :
         data.status === 'error' ? <XCircle className="w-3 h-3" /> :
         <Clock className="w-3 h-3" />}
        <span>{data.statusText || data.status}</span>
      </div>
    )}
  </div>
);

const TransformationNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-purple-500 border-2 border-purple-600 min-w-[180px]">
    <div className="flex items-center gap-2 text-white">
      <Zap className="w-5 h-5" />
      <div>
        <div className="font-semibold text-sm">{data.label}</div>
        {data.transformation && (
          <div className="text-xs opacity-90 mt-1">{data.transformation}</div>
        )}
      </div>
    </div>
    {data.status && (
      <div className="mt-2 text-xs text-white flex items-center gap-1">
        {data.status === 'success' ? <CheckCircle className="w-3 h-3" /> :
         data.status === 'error' ? <XCircle className="w-3 h-3" /> :
         <Clock className="w-3 h-3" />}
        <span>{data.statusText || data.status}</span>
      </div>
    )}
  </div>
);

const DestinationNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-green-500 border-2 border-green-600 min-w-[180px]">
    <div className="flex items-center gap-2 text-white">
      <Target className="w-5 h-5" />
      <div>
        <div className="font-semibold text-sm">{data.label}</div>
        {data.destination && (
          <div className="text-xs opacity-90 mt-1">{data.destination}</div>
        )}
      </div>
    </div>
    {data.status && (
      <div className="mt-2 text-xs text-white flex items-center gap-1">
        {data.status === 'success' ? <CheckCircle className="w-3 h-3" /> :
         data.status === 'error' ? <XCircle className="w-3 h-3" /> :
         <Clock className="w-3 h-3" />}
        <span>{data.statusText || data.status}</span>
      </div>
    )}
  </div>
);

const nodeTypes = {
  source: SourceNode,
  transformation: TransformationNode,
  destination: DestinationNode,
};

interface PipelineCanvasProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  nodeName: string;
  status: 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function PipelineCanvas({
  onSave,
  initialNodes = [],
  initialEdges = []
}: PipelineCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const nodeIdCounter = useRef(initialNodes.length);

  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Prevent connecting to itself
    if (connection.source === connection.target) return false;

    // Source nodes can only be at the start
    if (targetNode.type === 'source') return false;

    // Destination nodes can only be at the end
    if (sourceNode.type === 'destination') return false;

    // Check if connection already exists
    const connectionExists = edges.some(
      edge => edge.source === connection.source && edge.target === connection.target
    );

    return !connectionExists;
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }, eds));
      }
    },
    [isValidConnection, setEdges]
  );

  // Add node functions
  const addSourceNode = () => {
    const newNode: Node = {
      id: `node-${nodeIdCounter.current++}`,
      type: 'source',
      position: { x: 100, y: 100 + nodes.length * 50 },
      data: {
        label: 'Data Source',
        connector: 'PostgreSQL DB'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addTransformationNode = () => {
    const newNode: Node = {
      id: `node-${nodeIdCounter.current++}`,
      type: 'transformation',
      position: { x: 400, y: 100 + nodes.length * 50 },
      data: {
        label: 'Transformation',
        transformation: 'Field Mapping'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addDestinationNode = () => {
    const newNode: Node = {
      id: `node-${nodeIdCounter.current++}`,
      type: 'destination',
      position: { x: 700, y: 100 + nodes.length * 50 },
      data: {
        label: 'Destination',
        destination: 'Data Warehouse'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Clear canvas
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setExecutionLogs([]);
    nodeIdCounter.current = 0;
  };

  // Save pipeline
  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    // In a real app, this would save to backend
    console.log('Pipeline saved:', { nodes, edges });
  };

  // Export pipeline as JSON
  const exportPipeline = () => {
    const pipeline = {
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(pipeline, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pipeline.json';
    link.click();
  };

  // Execute pipeline simulation
  const executePipeline = async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to the pipeline first');
      return;
    }

    setIsExecuting(true);
    setShowMonitor(true);
    setExecutionLogs([]);

    // Reset all node statuses
    setNodes((nds) => nds.map(node => ({
      ...node,
      data: { ...node.data, status: undefined, statusText: undefined }
    })));

    // Topological sort to get execution order
    const executionOrder = getExecutionOrder(nodes, edges);

    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Mark as running
      setNodes((nds) => nds.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status: 'running', statusText: 'Processing...' }}
          : n
      ));

      addLog({
        nodeId,
        nodeName: node.data.label,
        status: 'running',
        message: `Starting ${node.data.label}...`,
        timestamp: new Date(),
      });

      // Simulate processing time
      const processingTime = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Simulate success (90% success rate)
      const success = Math.random() > 0.1;

      setNodes((nds) => nds.map(n =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                status: success ? 'success' : 'error',
                statusText: success ? 'Completed' : 'Failed'
              }
            }
          : n
      ));

      addLog({
        nodeId,
        nodeName: node.data.label,
        status: success ? 'success' : 'error',
        message: success
          ? `${node.data.label} completed successfully`
          : `${node.data.label} failed`,
        timestamp: new Date(),
        duration: Math.round(processingTime),
      });

      if (!success) {
        // Stop execution on error
        break;
      }
    }

    setIsExecuting(false);
  };

  // Helper to add execution log
  const addLog = (log: ExecutionLog) => {
    setExecutionLogs((logs) => [...logs, log]);
  };

  // Topological sort for execution order
  const getExecutionOrder = (nodes: Node[], edges: Edge[]): string[] => {
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build adjacency list and calculate in-degrees
    edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Start with nodes that have no dependencies
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      adjList.get(current)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  };

  return (
    <div className="pipeline-canvas-container">
      <div className="flex gap-4 mb-4">
        {/* Node Palette */}
        <Card className="flex-shrink-0 w-64">
          <h3 className="font-semibold text-gray-900 mb-3">Pipeline Components</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addSourceNode}
              className="w-full justify-start"
            >
              <Database className="w-4 h-4 mr-2 text-blue-600" />
              Add Source
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addTransformationNode}
              className="w-full justify-start"
            >
              <Zap className="w-4 h-4 mr-2 text-purple-600" />
              Add Transformation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addDestinationNode}
              className="w-full justify-start"
            >
              <Target className="w-4 h-4 mr-2 text-green-600" />
              Add Destination
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Pipeline Actions</h4>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={executePipeline}
                disabled={isExecuting || nodes.length === 0}
                className="w-full justify-start"
              >
                <Play className="w-4 h-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute Pipeline'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="w-full justify-start"
                disabled={nodes.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Pipeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPipeline}
                className="w-full justify-start"
                disabled={nodes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300"
                disabled={nodes.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Canvas
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Pipeline Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sources:</span>
                <Badge variant="default">{nodes.filter(n => n.type === 'source').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transformations:</span>
                <Badge variant="default">{nodes.filter(n => n.type === 'transformation').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Destinations:</span>
                <Badge variant="default">{nodes.filter(n => n.type === 'destination').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connections:</span>
                <Badge variant="default">{edges.length}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 min-h-[600px] p-0 overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === 'source') return '#3b82f6';
                  if (node.type === 'transformation') return '#a855f7';
                  if (node.type === 'destination') return '#22c55e';
                  return '#gray';
                }}
              />
              <Panel position="top-left" className="bg-white px-3 py-2 rounded shadow-sm">
                <div className="text-sm font-medium text-gray-700">
                  {nodes.length === 0 ? 'Add components to start building your pipeline' : 'Drag nodes to reposition, connect them to create flow'}
                </div>
              </Panel>
            </ReactFlow>
          </Card>

          {/* Execution Monitor */}
          {showMonitor && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Execution Monitor
                </h3>
                <button
                  onClick={() => setShowMonitor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {executionLogs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No execution logs yet. Run the pipeline to see logs.
                  </p>
                ) : (
                  executionLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2">
                      {log.status === 'running' && <Clock className="w-4 h-4 text-blue-600 mt-0.5" />}
                      {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                      {log.status === 'error' && <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{log.message}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {log.timestamp.toLocaleTimeString()}
                          {log.duration && ` • ${log.duration}ms`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
