'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PipelineCanvas } from '@/components/pipeline-builder/pipeline-canvas';
import { NodePalette } from '@/components/pipeline-builder/node-palette';
import { DryRunModal } from '@/components/pipeline-builder/DryRunModal';
import { ExecutionPanel } from '@/components/pipeline-builder/ExecutionPanel';
import { TemplateBrowserModal } from '@/components/pipeline-builder/TemplateBrowserModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Node, Edge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Save, X, Edit2, ArrowLeft, Play, FileText } from 'lucide-react';

export default function PipelineBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, error, success, warning } = useToast();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
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

  // Load pipeline if ID is in URL
  useEffect(() => {
    const pipelineId = searchParams.get('id');
    if (pipelineId) {
      loadPipeline(parseInt(pipelineId));
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

  // React Flow expects onNodesChange/onEdgesChange handlers
  const handleNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const handleEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
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
}
