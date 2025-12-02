// frontend/src/components/pipeline-builder/__tests__/NodeConfigPanel.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NodeConfigPanel from '../NodeConfigPanel';
import { Node } from 'reactflow';

// Mock the child components to isolate the panel's logic
jest.mock('../config-panels/TransformationConfig', () => () => <div data-testid="transformation-config">TransformationConfig</div>);
jest.mock('../config-panels/InputConfig', () => () => <div data-testid="input-config">InputConfig</div>);
jest.mock('../config-panels/OutputConfig', () => () => <div data-testid="output-config">OutputConfig</div>);

describe('NodeConfigPanel', () => {
  const mockOnNodeConfigChange = jest.fn();

  const baseNode: Node = {
    id: '1',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Node',
      config: {},
    },
  };

  it('renders a message when no node is selected', () => {
    render(<NodeConfigPanel selectedNode={null} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByText('Select a node to configure it')).toBeInTheDocument();
  });

  it('renders the correct configuration panel based on node type', () => {
    // Test for 'transformation' node
    const transformationNode = { ...baseNode, type: 'transformation' };
    const { rerender } = render(<NodeConfigPanel selectedNode={transformationNode} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByTestId('transformation-config')).toBeInTheDocument();
    expect(screen.queryByTestId('input-config')).not.toBeInTheDocument();

    // Test for 'input' node
    const inputNode = { ...baseNode, type: 'input' };
    rerender(<NodeConfigPanel selectedNode={inputNode} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByTestId('input-config')).toBeInTheDocument();
    expect(screen.queryByTestId('transformation-config')).not.toBeInTheDocument();

    // Test for 'output' node
    const outputNode = { ...baseNode, type: 'output' };
    rerender(<NodeConfigPanel selectedNode={outputNode} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByTestId('output-config')).toBeInTheDocument();
    expect(screen.queryByTestId('input-config')).not.toBeInTheDocument();
  });

  it('displays the label of the selected node', () => {
    const node = { ...baseNode, data: { ...baseNode.data, label: 'My Custom Node' } };
    render(<NodeConfigPanel selectedNode={node} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByText('My Custom Node')).toBeInTheDocument();
  });

  it('renders a fallback message for unknown node types', () => {
    const unknownNode = { ...baseNode, type: 'unknown-type' };
    render(<NodeConfigPanel selectedNode={unknownNode} onNodeConfigChange={mockOnNodeConfigChange} />);
    expect(screen.getByText('Configuration for this node type is not available.')).toBeInTheDocument();
  });
});
