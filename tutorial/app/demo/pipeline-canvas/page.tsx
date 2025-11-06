'use client';

import React from 'react';
import { PipelineCanvas } from '@/components/sandbox';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, GitBranch, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { Node, Edge } from 'reactflow';

// Sample pipeline configuration
const sampleNodes: Node[] = [
  {
    id: 'source-1',
    type: 'source',
    position: { x: 50, y: 100 },
    data: { label: 'Sales Database', connector: 'PostgreSQL' },
  },
  {
    id: 'transform-1',
    type: 'transformation',
    position: { x: 350, y: 50 },
    data: { label: 'Clean Data', transformation: 'Remove nulls & duplicates' },
  },
  {
    id: 'transform-2',
    type: 'transformation',
    position: { x: 350, y: 150 },
    data: { label: 'Enrich Data', transformation: 'Add calculated fields' },
  },
  {
    id: 'dest-1',
    type: 'destination',
    position: { x: 650, y: 100 },
    data: { label: 'Data Warehouse', destination: 'Snowflake' },
  },
];

const sampleEdges: Edge[] = [
  { id: 'e1', source: 'source-1', target: 'transform-1', type: 'smoothstep', animated: true },
  { id: 'e2', source: 'transform-1', target: 'transform-2', type: 'smoothstep', animated: true },
  { id: 'e3', source: 'transform-2', target: 'dest-1', type: 'smoothstep', animated: true },
];

export default function PipelineCanvasDemo() {
  const handleSave = (nodes: Node[], edges: Edge[]) => {
    console.log('Pipeline saved:', { nodes, edges });
    // In a real app, this would save to the backend
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pipeline Canvas Demo
              </h1>
              <p className="text-gray-600">
                Visual pipeline builder with drag-and-drop interface
              </p>
            </div>
            <Badge variant="primary" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Module 4
            </Badge>
          </div>
        </div>

        {/* Features */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Visual Builder</h3>
                <p className="text-sm text-gray-600">
                  Drag and drop components to build pipelines visually
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Execution</h3>
                <p className="text-sm text-gray-600">
                  Execute pipelines and monitor progress in real-time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Validation</h3>
                <p className="text-sm text-gray-600">
                  Smart connection validation ensures pipeline integrity
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use the Pipeline Canvas
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <div>
                <strong>Add Components:</strong> Click the buttons in the left panel to add Source, Transformation, or Destination nodes to the canvas
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <div>
                <strong>Connect Nodes:</strong> Drag from a node&apos;s edge to another node to create connections. The system will validate connections automatically
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <div>
                <strong>Reposition:</strong> Drag nodes around the canvas to organize your pipeline layout
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <div>
                <strong>Execute:</strong> Click &quot;Execute Pipeline&quot; to simulate running your pipeline and see live execution logs
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                5
              </span>
              <div>
                <strong>Save/Export:</strong> Use the Save or Export buttons to persist your pipeline configuration
              </div>
            </li>
          </ol>
        </Card>

        {/* Canvas */}
        <div className="mb-6">
          <PipelineCanvas
            initialNodes={sampleNodes}
            initialEdges={sampleEdges}
            onSave={handleSave}
          />
        </div>

        {/* Connection Rules */}
        <Card className="bg-amber-50 border-amber-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Validation Rules
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Source nodes</strong> can only be at the beginning of a pipeline (no incoming connections)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Destination nodes</strong> can only be at the end of a pipeline (no outgoing connections)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Transformation nodes</strong> can be chained together in sequence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Nodes cannot connect to themselves (no circular connections)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>Duplicate connections between the same nodes are prevented</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
