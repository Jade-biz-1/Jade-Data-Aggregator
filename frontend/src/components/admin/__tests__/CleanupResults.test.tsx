import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CleanupResults, CleanupResultsData } from '../CleanupResults';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

const successResults: CleanupResultsData = {
  timestamp: '2025-12-01T10:00:00Z',
  total_duration_seconds: 4.5,
  operations: [
    {
      operation: 'activity_logs',
      success: true,
      records_deleted: 1200,
      files_deleted: 0,
      space_freed_mb: 25.3,
      duration_seconds: 1.2,
    },
    {
      operation: 'temp_files',
      success: true,
      records_deleted: 0,
      files_deleted: 15,
      space_freed_mb: 10.0,
      duration_seconds: 0.8,
    },
  ],
  summary: {
    total_records_deleted: 1200,
    total_space_freed_mb: 35.3,
    successful_operations: 2,
    failed_operations: 0,
  },
};

const failedResults: CleanupResultsData = {
  timestamp: '2025-12-01T10:00:00Z',
  total_duration_seconds: 2.0,
  operations: [
    {
      operation: 'orphaned_data',
      success: false,
      error_message: 'Database connection timeout',
    },
  ],
  summary: {
    total_records_deleted: 0,
    total_space_freed_mb: 0,
    successful_operations: 0,
    failed_operations: 1,
  },
};

describe('CleanupResults', () => {
  describe('null results', () => {
    it('returns null when results prop is null', () => {
      const { container } = render(<CleanupResults results={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('summary section', () => {
    it('shows "Cleanup Complete" when summary is present', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Cleanup Complete')).toBeInTheDocument();
    });

    it('shows total records deleted from summary', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('1,200')).toBeInTheDocument();
    });

    it('shows space freed in MB', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('35.30 MB')).toBeInTheDocument();
    });

    it('shows successful operations count', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows total duration', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('4.5s')).toBeInTheDocument();
    });

    it('shows "Records Deleted" label', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Records Deleted')).toBeInTheDocument();
    });

    it('shows "Space Freed" label', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Space Freed')).toBeInTheDocument();
    });
  });

  describe('export button', () => {
    it('shows "Export Report" button when onExport provided', () => {
      render(<CleanupResults results={successResults} onExport={jest.fn()} />);
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    it('calls onExport when export button clicked', () => {
      const onExport = jest.fn();
      render(<CleanupResults results={successResults} onExport={onExport} />);
      fireEvent.click(screen.getByText('Export Report'));
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('does not show export button when onExport not provided', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.queryByText('Export Report')).not.toBeInTheDocument();
    });
  });

  describe('operation details', () => {
    it('shows "Operation Details" section', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Operation Details')).toBeInTheDocument();
    });

    it('shows "Activity Logs" as the mapped operation title', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    it('shows "Temporary Files" as the mapped operation title', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('Temporary Files')).toBeInTheDocument();
    });

    it('shows records deleted count for successful operation', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('1,200 deleted')).toBeInTheDocument();
    });

    it('shows files deleted count for successful operation', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('15 deleted')).toBeInTheDocument();
    });

    it('shows space freed for operation', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('25.30 MB freed')).toBeInTheDocument();
    });

    it('shows operation duration', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.getByText('1.20s')).toBeInTheDocument();
    });
  });

  describe('failed operations', () => {
    it('shows error message for failed operation', () => {
      render(<CleanupResults results={failedResults} />);
      expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
    });

    it('shows "Orphaned Data" as mapped title for orphaned_data operation', () => {
      render(<CleanupResults results={failedResults} />);
      expect(screen.getByText('Orphaned Data')).toBeInTheDocument();
    });

    it('shows failed operations warning when failed_operations > 0', () => {
      render(<CleanupResults results={failedResults} />);
      expect(screen.getByText('1 operation(s) failed')).toBeInTheDocument();
    });

    it('does not show failed operations warning when all succeeded', () => {
      render(<CleanupResults results={successResults} />);
      expect(screen.queryByText(/operation\(s\) failed/i)).not.toBeInTheDocument();
    });
  });

  describe('zero records cleaned', () => {
    it('shows "No items found to clean" when records_deleted and files_deleted are 0', () => {
      const emptyResults: CleanupResultsData = {
        timestamp: '2025-12-01T10:00:00Z',
        total_duration_seconds: 0.5,
        operations: [
          { operation: 'database_vacuum', success: true, records_deleted: 0, files_deleted: 0 },
        ],
      };
      render(<CleanupResults results={emptyResults} />);
      expect(screen.getByText('No items found to clean')).toBeInTheDocument();
    });
  });
});
