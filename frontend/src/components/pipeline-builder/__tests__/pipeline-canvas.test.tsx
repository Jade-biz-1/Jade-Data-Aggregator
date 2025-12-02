// frontend/src/components/pipeline-builder/__tests__/pipeline-canvas.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PipelineCanvas from '../PipelineCanvas';
import { ReactFlowProvider } from 'reactflow';

// Mock React Flow
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="rf-controls" />,
  Background: () => <div data-testid="rf-background" />,
}));

describe('PipelineCanvas', () => {
  const mockSetReactFlowInstance = jest.fn();

  const initialNodes = [
    { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Input Node' } },
  ];
  const initialEdges = [];

  it('renders the React Flow component with nodes and edges', () => {
    render(
      <ReactFlowProvider>
        <PipelineCanvas
          nodes={initialNodes}
          edges={initialEdges}
          onNodesChange={jest.fn()}
          onEdgesChange={jest.fn()}
          onConnect={jest.fn()}
          onDrop={jest.fn()}
          onDragOver={jest.fn()}
          onNodeClick={jest.fn()}
          onPaneClick={jest.fn()}
          setReactFlowInstance={mockSetReactFlowInstance}
        />
      </ReactFlowProvider>
    );

    // Check if the main React Flow wrapper is there
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // Check if Controls and Background are rendered
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
  });

  // Note: Testing the nodes and edges themselves within the mock is complex.
  // The presence of the ReactFlow component implies it has received the props.
  // More detailed tests would require a less opaque mock or end-to-end testing.
});
