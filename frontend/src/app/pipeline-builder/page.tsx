'use client';

import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PipelineCanvas } from '@/components/pipeline-builder/pipeline-canvas';
import { NodePalette } from '@/components/pipeline-builder/node-palette';
import { Node, Edge } from 'reactflow';

export default function PipelineBuilderPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);

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

  const handleSave = useCallback((savedNodes: Node[], savedEdges: Edge[]) => {
    console.log('Saving pipeline:', { nodes: savedNodes, edges: savedEdges });

    // In production, this would call an API to save the pipeline
    alert(`Pipeline saved with ${savedNodes.length} nodes and ${savedEdges.length} connections`);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">Visual Pipeline Builder</h1>
          <p className="mt-1 text-sm text-gray-600">
            Drag nodes from the palette to create your data processing pipeline
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node Palette */}
          <NodePalette onAddNode={handleAddNode} />

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-50">
            <PipelineCanvas
              initialNodes={nodes}
              initialEdges={edges}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
