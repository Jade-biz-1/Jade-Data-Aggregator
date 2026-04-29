'use client';
export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PipelineCanvas } from '@/components/pipeline-builder/pipeline-canvas';
import { NodePalette } from '@/components/pipeline-builder/node-palette';
import { DryRunModal } from '@/components/pipeline-builder/DryRunModal';
import { ExecutionPanel } from '@/components/pipeline-builder/ExecutionPanel';
import { TemplateBrowserModal } from '@/components/pipeline-builder/TemplateBrowserModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Save, X, Edit2, ArrowLeft, Play, FileText } from 'lucide-react';

import { Suspense } from 'react';

// ── Schema propagation utilities ──────────────────────────────────────────────

const PB_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return document.cookie.split('; ').find(r => r.startsWith('access_token='))?.split('=')[1];
}

async function fetchNodeSchema(connectorId: string, tableName?: string, schemaName?: string) {
  const params = new URLSearchParams();
  if (tableName) params.set('table', tableName);
  if (schemaName) params.set('schema', schemaName);
  const qs = params.toString();
  const token = getAuthToken();
  const res = await fetch(`${PB_API}/connectors/${connectorId}/columns${qs ? `?${qs}` : ''}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const columns: string[] = data.columns || [];
  const columnTypes: Record<string, string> = data.column_types || {};
  return {
    source_type: 'connector',
    connector_id: connectorId,
    table_name: tableName,
    fields: columns.map((col: string) => ({
      name: col,
      data_type: columnTypes[col] || 'unknown',
      nullable: true,
    })),
  };
}

/**
 * Walk forward from a node, copying its outputSchema into every directly
 * downstream node's inputSchema. For transformation nodes, also set
 * outputSchema to match inputSchema unless they already have one configured.
 */
function propagateSchemaForward(fromNodeId: string, nodes: Node[], edges: Edge[]): Node[] {
  const fromNode = nodes.find(n => n.id === fromNodeId);
  const outputSchema = (fromNode?.data as any)?.outputSchema;
  if (!outputSchema) return nodes;

  let updated = nodes;
  const outEdges = edges.filter(e => e.source === fromNodeId);

  for (const edge of outEdges) {
    const targetHasOwnOutput = !!(nodes.find(n => n.id === edge.target)?.data as any)?.outputSchema;
    updated = updated.map(n => {
      if (n.id !== edge.target) return n;
      return {
        ...n,
        data: {
          ...n.data,
          inputSchema: outputSchema,
          // Transformation nodes adopt the incoming schema as their output
          // unless they have a custom output (e.g. an aggregate changes shape)
          ...(n.type === 'transformation' && !targetHasOwnOutput ? { outputSchema } : {}),
        },
      };
    });
    // Cascade
    updated = propagateSchemaForward(edge.target, updated, edges);
  }

  return updated;
}

/**
 * Walk forward from a node that has just lost an upstream connection.
 * Clears inputSchema and (for non-source nodes) outputSchema.
 *
 * A node is only cleared if ALL of its remaining upstream nodes have no
 * valid outputSchema (i.e. none can still provide a schema). This handles
 * the cascade correctly: if tx is cleared, dst is also cleared even though
 * the tx→dst edge still exists, because tx no longer has a valid outputSchema.
 */
function clearSchemaDownstream(fromNodeId: string, nodes: Node[], remainingEdges: Edge[]): Node[] {
  const upstreamEdges = remainingEdges.filter(e => e.target === fromNodeId);

  if (upstreamEdges.length > 0) {
    // Check whether any upstream node still provides a valid schema
    const hasValidUpstream = upstreamEdges.some(e => {
      const upNode = nodes.find(n => n.id === e.source);
      return !!(upNode?.data as any)?.outputSchema;
    });
    if (hasValidUpstream) return nodes; // at least one upstream is still valid — leave this node
  }

  // Clear this node's schema
  let updated = nodes.map(n => {
    if (n.id !== fromNodeId) return n;
    const data = { ...n.data } as any;
    delete data.inputSchema;
    if (n.type !== 'source') delete data.outputSchema;
    return { ...n, data };
  });

  // Cascade to downstream nodes — they may also need clearing
  const outEdges = remainingEdges.filter(e => e.source === fromNodeId);
  for (const edge of outEdges) {
    updated = clearSchemaDownstream(edge.target, updated, remainingEdges);
  }

  return updated;
}

// ──────────────────────────────────────────────────────────────────────────────

const PipelineBuilderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, error, success, warning } = useToast();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Mutable refs so edge/node change handlers can always see current state
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  const [nodeIdCounter, setNodeIdCounter] = useState(1);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPipelineId, setCurrentPipelineId] = useState<number | null>(null);
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDryRunModalOpen, setIsDryRunModalOpen] = useState(false);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Load pipeline if ID is in URL, or pre-fill name if provided
  useEffect(() => {
    const pipelineId = searchParams.get('id');
    const nameParam = searchParams.get('name');
    if (pipelineId) {
      loadPipeline(parseInt(pipelineId));
    } else if (nameParam) {
      setPipelineName(decodeURIComponent(nameParam));
    }
  }, [searchParams]);

  const loadPipeline = async (pipelineId: number) => {
    try {
      setIsLoading(true);
      const { nodes: loadedNodes, edges: loadedEdges, metadata } = await pipelineBuilderService.loadPipeline(pipelineId);

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setCurrentPipelineId(metadata.id);
      setPipelineName(metadata.name);
      setPipelineDescription(metadata.description || '');
      setIsEditMode(true);

      // Update node counter to avoid ID conflicts
      const maxNodeId = loadedNodes.reduce((max, node) => {
        const match = node.id.match(/node-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      setNodeIdCounter(maxNodeId + 1);

      success('Pipeline loaded successfully', 'Success');
    } catch (err: any) {
      error(err.message || 'Failed to load pipeline', 'Error');
      console.error('Error loading pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNode = useCallback(
    (type: string, subtype: string, label: string) => {
      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100
        },
        data: {
          label: label,
          [`${type}Type`]: subtype
        }
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter]
  );

  // React Flow node change handler
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // React Flow edge change handler — handles add (propagate schema) and remove (clear schema)
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const newEdges = applyEdgeChanges(changes, currentEdges);
    setEdges(newEdges);

    let updatedNodes = currentNodes;
    let nodesDirty = false;

    for (const change of changes) {
      if (change.type === 'add') {
        const item = (change as any).item as Edge;
        const afterPropagate = propagateSchemaForward(item.source, updatedNodes, newEdges);
        if (afterPropagate !== updatedNodes) { updatedNodes = afterPropagate; nodesDirty = true; }
      }

      if (change.type === 'remove') {
        const removed = currentEdges.find(e => e.id === (change as any).id);
        if (removed) {
          const afterClear = clearSchemaDownstream(removed.target, updatedNodes, newEdges);
          if (afterClear !== updatedNodes) { updatedNodes = afterClear; nodesDirty = true; }
        }
      }
    }

    if (nodesDirty) setNodes(updatedNodes);
  }, []);

  const handleSave = useCallback(async (savedNodes: Node[], savedEdges: Edge[]) => {
    // Check if pipeline has a name
    if (!pipelineName.trim()) {
      setIsEditingName(true);
      warning('Please enter a pipeline name', 'Name Required');
      return;
    }

    try {
      setIsSaving(true);

      if (isEditMode && currentPipelineId) {
        // Update existing pipeline
        await pipelineBuilderService.updatePipeline(
          currentPipelineId,
          savedNodes,
          savedEdges,
          {
            name: pipelineName,
            description: pipelineDescription,
          }
        );
        success('Pipeline updated successfully', 'Success');
      } else {
        // Create new pipeline
        const result = await pipelineBuilderService.savePipeline(
          savedNodes,
          savedEdges,
          {
            name: pipelineName,
            description: pipelineDescription,
          }
        );

        success('Pipeline saved successfully', 'Success');

        // Switch to edit mode
        setIsEditMode(true);
        setCurrentPipelineId(result.id);

        // Update URL to include pipeline ID
        router.replace(`/pipeline-builder?id=${result.id}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to save pipeline', 'Error');
      console.error('Error saving pipeline:', err);
    } finally {
      setIsSaving(false);
    }
  }, [pipelineName, pipelineDescription, isEditMode, currentPipelineId, router, success, error, warning]);

  const handleNodeConfigSave = useCallback(async (nodeId: string, config: any, label: string) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const savedNode = currentNodes.find(n => n.id === nodeId);

    let updatedNodes = currentNodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, config, isConfigured: true, label: label || node.data.label } };
      }
      return node;
    });

    // Fetch schema for source and destination nodes so it can propagate to transformations
    if (savedNode?.type === 'source' && config?.connector_id) {
      try {
        const schema = await fetchNodeSchema(
          config.connector_id,
          config.table_name,
          config.schema
        );
        if (schema) {
          updatedNodes = updatedNodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, outputSchema: schema } } : n
          );
          updatedNodes = propagateSchemaForward(nodeId, updatedNodes, currentEdges);
        }
      } catch { /* best-effort */ }
    }

    if (savedNode?.type === 'destination' && config?.connector_id) {
      try {
        const schema = await fetchNodeSchema(
          config.connector_id,
          config.table_name,
          config.schema
        );
        if (schema) {
          updatedNodes = updatedNodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, inputSchema: schema } } : n
          );
        }
      } catch { /* best-effort */ }
    }

    setNodes(updatedNodes);

    // Auto-persist to the backend whenever a node config is saved on an existing pipeline
    if (isEditMode && currentPipelineId && pipelineName.trim()) {
      try {
        await pipelineBuilderService.updatePipeline(
          currentPipelineId,
          updatedNodes,
          edges,
          { name: pipelineName, description: pipelineDescription },
        );
      } catch {
        // silent — the user can still click Update manually
      }
    }
  }, [isEditMode, currentPipelineId, pipelineName, pipelineDescription]);

  const handleCancel = () => {
    router.push('/pipelines');
  };

  const handleSelectTemplate = (templateNodes: Node[], templateEdges: Edge[], metadata: any) => {
    setNodes(templateNodes);
    setEdges(templateEdges);
    setPipelineName(metadata.name);
    setPipelineDescription(metadata.description || '');
    setIsEditingName(true);

    // Update node counter
    const maxNodeId = templateNodes.reduce((max, node) => {
      const match = node.id.match(/node-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    setNodeIdCounter(maxNodeId + 1);

    success('Template loaded successfully. Update the name to save as a new pipeline.', 'Success');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pipeline...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="flex flex-col h-full">
        {/* Header with Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    type="text"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="Pipeline name"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsEditingName(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {pipelineName || 'New Pipeline'}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="p-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditMode && nodes.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsTemplateModalOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsDryRunModalOpen(true)}
                disabled={!currentPipelineId}
                title={!currentPipelineId ? 'Save the pipeline first to enable dry-run testing' : 'Test pipeline with sample data'}
              >
                <Play className="h-4 w-4 mr-2" />
                Dry-Run Test
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => handleSave(nodes, edges)}
                disabled={isSaving || !pipelineName.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : (isEditMode ? 'Update' : 'Save')}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input
              type="text"
              value={pipelineDescription}
              onChange={(e) => setPipelineDescription(e.target.value)}
              placeholder="Add a description (optional)"
              className="max-w-xl text-sm"
            />
            {isEditMode && currentPipelineId && (
              <span className="text-xs text-gray-500">
                ID: {currentPipelineId}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node Palette */}
          <NodePalette onAddNode={handleAddNode} />

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-50">
            <PipelineCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeConfigSave={handleNodeConfigSave}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>

      {/* Dry-Run Testing Modal */}
      <DryRunModal
        isOpen={isDryRunModalOpen}
        onClose={() => setIsDryRunModalOpen(false)}
        pipelineId={currentPipelineId}
        nodes={nodes}
        edges={edges}
      />

      {/* Execution Status Panel */}
      <ExecutionPanel
        pipelineId={currentPipelineId}
        nodes={nodes}
        edges={edges}
        isOpen={isExecutionPanelOpen}
        onToggle={() => setIsExecutionPanelOpen(!isExecutionPanelOpen)}
      />

      {/* Template Browser Modal */}
      <TemplateBrowserModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </DashboardLayout>
  );
};

export default function PipelineBuilderPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pipeline builder...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <PipelineBuilderContent />
    </Suspense>
  );
}
