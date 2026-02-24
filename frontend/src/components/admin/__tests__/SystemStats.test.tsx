import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemStats, SystemStatsData } from '../SystemStats';

// Mock UI card components to simple divs
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

const sampleStats: SystemStatsData = {
  database: {
    size_mb: 128.5,
    tables_count: 24,
    total_records: 5000,
  },
  record_counts: {
    users: 50,
    pipelines: 200,
    connectors: 30,
    transformations: 100,
    pipeline_runs: 4000,
    activity_logs: 620,
  },
  temp_files: {
    file_count: 7,
    total_size_mb: 3.14,
    oldest_file_age_days: 5,
  },
};

describe('SystemStats', () => {
  describe('loading state', () => {
    it('renders loading skeleton cards when loading=true', () => {
      const { container } = render(<SystemStats stats={null} loading />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('does not render stats when loading=true', () => {
      render(<SystemStats stats={sampleStats} loading />);
      expect(screen.queryByText('Database Size')).not.toBeInTheDocument();
    });
  });

  describe('null stats', () => {
    it('shows "No statistics available" when stats is null', () => {
      render(<SystemStats stats={null} />);
      expect(screen.getByText('No statistics available')).toBeInTheDocument();
    });
  });

  describe('with stats', () => {
    beforeEach(() => {
      render(<SystemStats stats={sampleStats} />);
    });

    it('shows "Database Size" heading', () => {
      expect(screen.getByText('Database Size')).toBeInTheDocument();
    });

    it('shows database size in MB', () => {
      expect(screen.getByText('128.50 MB')).toBeInTheDocument();
    });

    it('shows tables count', () => {
      expect(screen.getByText('24 tables')).toBeInTheDocument();
    });

    it('shows "Total Records" heading', () => {
      expect(screen.getByText('Total Records')).toBeInTheDocument();
    });

    it('shows total records computed from record_counts', () => {
      // 50+200+30+100+4000+620 = 5000
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('shows "Temp Files" heading', () => {
      expect(screen.getByText('Temp Files')).toBeInTheDocument();
    });

    it('shows temp file count', () => {
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('shows temp file total size', () => {
      expect(screen.getByText('3.14 MB total')).toBeInTheDocument();
    });

    it('shows oldest file age when > 0 days', () => {
      expect(screen.getByText('Oldest: 5 days')).toBeInTheDocument();
    });

    it('shows "Record Distribution" section', () => {
      expect(screen.getByText('Record Distribution')).toBeInTheDocument();
    });

    it('shows "pipeline runs" in distribution (underscores replaced with spaces)', () => {
      expect(screen.getByText('pipeline runs')).toBeInTheDocument();
    });

    it('shows "activity logs" in distribution', () => {
      expect(screen.getByText('activity logs')).toBeInTheDocument();
    });

    it('shows user count in distribution', () => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('optional fields', () => {
    it('shows last vacuum date when provided', () => {
      const statsWithVacuum = {
        ...sampleStats,
        last_vacuum: '2025-12-01T00:00:00Z',
      };
      render(<SystemStats stats={statsWithVacuum} />);
      expect(screen.getByText(/Last vacuum:/i)).toBeInTheDocument();
    });

    it('shows last cleanup timestamp when provided', () => {
      const statsWithCleanup = {
        ...sampleStats,
        last_cleanup: '2025-12-15T10:30:00Z',
      };
      render(<SystemStats stats={statsWithCleanup} />);
      expect(screen.getByText('Last Cleanup')).toBeInTheDocument();
    });

    it('does not show last cleanup section when not provided', () => {
      render(<SystemStats stats={sampleStats} />);
      expect(screen.queryByText('Last Cleanup')).not.toBeInTheDocument();
    });
  });
});
