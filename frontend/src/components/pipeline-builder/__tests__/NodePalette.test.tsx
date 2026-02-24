import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NodePalette } from '../node-palette';

// Lucide icons render as SVGs; jest handles them via next/jest transforms
// No external service mocks needed for NodePalette

describe('NodePalette', () => {
  const mockOnAddNode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('structure', () => {
    it('renders the "Node Palette" heading', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Node Palette')).toBeInTheDocument();
    });

    it('renders the "Sources" category', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Sources')).toBeInTheDocument();
    });

    it('renders the "Transformations" category', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Transformations')).toBeInTheDocument();
    });

    it('renders the "Destinations" category', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Destinations')).toBeInTheDocument();
    });

    it('renders all 12 node buttons in total', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      const nodeLabels = [
        'Database Source', 'API Source', 'File Source',
        'Filter', 'Map', 'Aggregate', 'Join', 'Sort',
        'Database', 'File Output', 'API Destination', 'Data Warehouse',
      ];
      nodeLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('source nodes', () => {
    it('renders "Database Source" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Database Source')).toBeInTheDocument();
    });

    it('renders "API Source" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('API Source')).toBeInTheDocument();
    });

    it('renders "File Source" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('File Source')).toBeInTheDocument();
    });
  });

  describe('transformation nodes', () => {
    it('renders "Filter" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('renders "Map" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Map')).toBeInTheDocument();
    });

    it('renders "Aggregate" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Aggregate')).toBeInTheDocument();
    });

    it('renders "Join" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    it('renders "Sort" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Sort')).toBeInTheDocument();
    });
  });

  describe('destination nodes', () => {
    it('renders "File Output" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('File Output')).toBeInTheDocument();
    });

    it('renders "API Destination" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('API Destination')).toBeInTheDocument();
    });

    it('renders "Data Warehouse" node button', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      expect(screen.getByText('Data Warehouse')).toBeInTheDocument();
    });
  });

  describe('onAddNode callback', () => {
    it('calls onAddNode with correct args when Database Source is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('Database Source'));
      expect(mockOnAddNode).toHaveBeenCalledWith('source', 'database', 'Database Source');
    });

    it('calls onAddNode with correct args when API Source is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('API Source'));
      expect(mockOnAddNode).toHaveBeenCalledWith('source', 'api', 'API Source');
    });

    it('calls onAddNode with correct args when File Source is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('File Source'));
      expect(mockOnAddNode).toHaveBeenCalledWith('source', 'file', 'File Source');
    });

    it('calls onAddNode with correct args when Filter is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('Filter'));
      expect(mockOnAddNode).toHaveBeenCalledWith('transformation', 'filter', 'Filter');
    });

    it('calls onAddNode with correct args when Aggregate is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('Aggregate'));
      expect(mockOnAddNode).toHaveBeenCalledWith('transformation', 'aggregate', 'Aggregate');
    });

    it('calls onAddNode with correct args when File Output is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('File Output'));
      expect(mockOnAddNode).toHaveBeenCalledWith('destination', 'file', 'File Output');
    });

    it('calls onAddNode with correct args when Data Warehouse is clicked', () => {
      render(<NodePalette onAddNode={mockOnAddNode} />);
      fireEvent.click(screen.getByText('Data Warehouse'));
      expect(mockOnAddNode).toHaveBeenCalledWith('destination', 'warehouse', 'Data Warehouse');
    });
  });
});
