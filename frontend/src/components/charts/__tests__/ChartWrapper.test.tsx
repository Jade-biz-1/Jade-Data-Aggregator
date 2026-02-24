import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartWrapper } from '../chart-wrapper';

// Mock chart export functions
const mockExportToCSV = jest.fn();
const mockExportToPNG = jest.fn();
const mockExportToSVG = jest.fn();

jest.mock('@/lib/chart-export', () => ({
  exportToCSV: (...args: any[]) => mockExportToCSV(...args),
  exportToPNG: (...args: any[]) => mockExportToPNG(...args),
  exportToSVG: (...args: any[]) => mockExportToSVG(...args),
}));

const sampleData = [{ name: 'Jan', value: 100 }, { name: 'Feb', value: 200 }];

const defaultProps = {
  children: <div data-testid="chart-child">Chart</div>,
  data: sampleData,
  title: 'Monthly Revenue',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChartWrapper', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(<ChartWrapper {...defaultProps} />);
      expect(screen.getByTestId('chart-child')).toBeInTheDocument();
    });

    it('shows the download button when enableExport=true (default)', () => {
      render(<ChartWrapper {...defaultProps} />);
      const downloadButton = screen.getByTitle('Export Chart');
      expect(downloadButton).toBeInTheDocument();
    });

    it('does not show the download button when enableExport=false', () => {
      render(<ChartWrapper {...defaultProps} enableExport={false} />);
      expect(screen.queryByTitle('Export Chart')).not.toBeInTheDocument();
    });

    it('does not show zoom controls by default (enableZoom=false)', () => {
      render(<ChartWrapper {...defaultProps} />);
      expect(screen.queryByTitle('Zoom In')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Zoom Out')).not.toBeInTheDocument();
    });

    it('shows zoom controls when enableZoom=true', () => {
      render(<ChartWrapper {...defaultProps} enableZoom />);
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    });
  });

  describe('export menu', () => {
    it('opens export menu on download button click', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      expect(screen.getByText('Export as PNG')).toBeInTheDocument();
      expect(screen.getByText('Export as SVG')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    });

    it('closes export menu on second click', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByTitle('Export Chart'));
      expect(screen.queryByText('Export as PNG')).not.toBeInTheDocument();
    });

    it('calls exportToPNG with slugified title when PNG clicked', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByText('Export as PNG'));
      expect(mockExportToPNG).toHaveBeenCalledWith(
        expect.anything(),
        'monthly_revenue'
      );
    });

    it('calls exportToSVG with slugified title when SVG clicked', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByText('Export as SVG'));
      expect(mockExportToSVG).toHaveBeenCalledWith(
        expect.anything(),
        'monthly_revenue'
      );
    });

    it('calls exportToCSV with data and slugified title when CSV clicked', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByText('Export as CSV'));
      expect(mockExportToCSV).toHaveBeenCalledWith(
        sampleData,
        'monthly_revenue'
      );
    });

    it('closes export menu after PNG export', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByText('Export as PNG'));
      expect(screen.queryByText('Export as SVG')).not.toBeInTheDocument();
    });

    it('closes export menu after CSV export', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      fireEvent.click(screen.getByText('Export as CSV'));
      expect(screen.queryByText('Export as PNG')).not.toBeInTheDocument();
    });

    it('closes export menu when backdrop overlay is clicked', () => {
      render(<ChartWrapper {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Export Chart'));
      expect(screen.getByText('Export as PNG')).toBeInTheDocument();
      // The backdrop is the fixed inset-0 div
      const backdrop = document.querySelector('.fixed.inset-0.z-10') as HTMLElement;
      if (backdrop) fireEvent.click(backdrop);
      expect(screen.queryByText('Export as PNG')).not.toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('zoom in button increases scale (does not throw)', () => {
      render(<ChartWrapper {...defaultProps} enableZoom />);
      expect(() => fireEvent.click(screen.getByTitle('Zoom In'))).not.toThrow();
    });

    it('zoom out button decreases scale (does not throw)', () => {
      render(<ChartWrapper {...defaultProps} enableZoom />);
      expect(() => fireEvent.click(screen.getByTitle('Zoom Out'))).not.toThrow();
    });

    it('zoom in can be clicked multiple times', () => {
      render(<ChartWrapper {...defaultProps} enableZoom />);
      fireEvent.click(screen.getByTitle('Zoom In'));
      fireEvent.click(screen.getByTitle('Zoom In'));
      fireEvent.click(screen.getByTitle('Zoom In'));
      // Should still be in document (max zoom capped at 2)
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    });

    it('zoom out can be clicked multiple times', () => {
      render(<ChartWrapper {...defaultProps} enableZoom />);
      fireEvent.click(screen.getByTitle('Zoom Out'));
      fireEvent.click(screen.getByTitle('Zoom Out'));
      fireEvent.click(screen.getByTitle('Zoom Out'));
      // Should still be in document (min zoom capped at 0.6)
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    });
  });
});
