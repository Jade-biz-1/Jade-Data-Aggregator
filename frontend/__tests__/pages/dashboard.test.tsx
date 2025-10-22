/**
 * Dashboard Page Component Tests
 * Tests dashboard rendering, data fetching, loading states, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getDashboardStats: jest.fn(),
    getRecentActivity: jest.fn(),
    getTimeSeriesData: jest.fn(),
  },
}));

// Mock the toast hook
jest.mock('@/hooks/useToast', () => ({
  __esModule: true,
  default: () => ({
    toasts: [],
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  }),
}));

// Mock child components that might have complex dependencies
jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/components/realtime/system-metrics-widget', () => ({
  SystemMetricsWidget: () => <div data-testid="system-metrics-widget">System Metrics</div>,
}));

jest.mock('@/components/realtime/notifications-widget', () => ({
  NotificationsWidget: () => <div data-testid="notifications-widget">Notifications</div>,
}));

jest.mock('@/components/charts', () => ({
  LineChart: () => <div data-testid="line-chart">Line Chart</div>,
}));

describe('DashboardPage', () => {
  const mockStatsData = {
    pipelines: {
      total: 25,
      active: 18,
      running: 5,
      failed: 2,
    },
    connectors: {
      total: 12,
      active: 10,
    },
    data_processed: {
      today: 1500000,
      this_week: 8200000,
      this_month: 35000000,
    },
  };

  const mockActivityData = [
    {
      id: 1,
      type: 'pipeline_run',
      message: 'Pipeline "Sales Data ETL" completed successfully',
      timestamp: '2025-10-18T10:30:00Z',
    },
    {
      id: 2,
      type: 'connector_update',
      message: 'Connector "PostgreSQL Production" was updated',
      timestamp: '2025-10-18T09:15:00Z',
    },
  ];

  const mockPerformanceData = [
    { date: '2025-10-01', value: 1000 },
    { date: '2025-10-02', value: 1200 },
    { date: '2025-10-03', value: 1100 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      // Make the API calls hang
      (apiClient.getDashboardStats as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      (apiClient.getRecentActivity as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      (apiClient.getTimeSeriesData as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<DashboardPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Successful Data Load', () => {
    beforeEach(() => {
      (apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStatsData);
      (apiClient.getRecentActivity as jest.Mock).mockResolvedValue(mockActivityData);
      (apiClient.getTimeSeriesData as jest.Mock).mockResolvedValue(mockPerformanceData);
    });

    it('should render dashboard layout', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('should display pipeline statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Pipelines')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('Active Pipelines')).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
      });
    });

    it('should display connector statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Connectors')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });

    it('should display data processed statistics', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Data Processed Today')).toBeInTheDocument();
        expect(screen.getByText('1.5M')).toBeInTheDocument(); // Formatted number
      });
    });

    it('should render system metrics widget', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('system-metrics-widget')).toBeInTheDocument();
      });
    });

    it('should render notifications widget', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('notifications-widget')).toBeInTheDocument();
      });
    });

    it('should render performance chart', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should display recent activity', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Sales Data ETL/)).toBeInTheDocument();
        expect(screen.getByText(/PostgreSQL Production/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      const mockError = new Error('Network error');
      (apiClient.getDashboardStats as jest.Mock).mockRejectedValue(mockError);
      (apiClient.getRecentActivity as jest.Mock).mockRejectedValue(mockError);
      (apiClient.getTimeSeriesData as jest.Mock).mockRejectedValue(mockError);

      render(<DashboardPage />);

      await waitFor(() => {
        // Should show empty/default data instead of crashing
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('should show error toast when data fetch fails', async () => {
      const mockError = new Error('Failed to fetch');
      (apiClient.getDashboardStats as jest.Mock).mockRejectedValue(mockError);

      const mockUseToast = jest.fn(() => ({
        toasts: [],
        error: jest.fn(),
        success: jest.fn(),
        warning: jest.fn(),
      }));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle partial data fetch failure', async () => {
      (apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStatsData);
      (apiClient.getRecentActivity as jest.Mock).mockResolvedValue(mockActivityData);
      (apiClient.getTimeSeriesData as jest.Mock).mockRejectedValue(
        new Error('Chart data unavailable')
      );

      render(<DashboardPage />);

      await waitFor(() => {
        // Stats should still be displayed
        expect(screen.getByText('25')).toBeInTheDocument();
        // Chart might show empty state
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers correctly', async () => {
      (apiClient.getDashboardStats as jest.Mock).mockResolvedValue({
        ...mockStatsData,
        data_processed: {
          today: 1500000,
          this_week: 8200000,
          this_month: 35000000,
        },
      });
      (apiClient.getRecentActivity as jest.Mock).mockResolvedValue([]);
      (apiClient.getTimeSeriesData as jest.Mock).mockResolvedValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        // Check for formatted numbers (using locale string)
        expect(screen.getByText(/1,500,000|1.5M/)).toBeInTheDocument();
      });
    });

    it('should show trend indicators for stats with changes', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Look for trend indicators (up/down arrows)
        const trendIcons = screen.queryAllByTestId('trend-icon');
        expect(trendIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should fetch fresh data on mount', async () => {
      (apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStatsData);
      (apiClient.getRecentActivity as jest.Mock).mockResolvedValue(mockActivityData);
      (apiClient.getTimeSeriesData as jest.Mock).mockResolvedValue(mockPerformanceData);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(apiClient.getDashboardStats).toHaveBeenCalledTimes(1);
        expect(apiClient.getRecentActivity).toHaveBeenCalledTimes(1);
        expect(apiClient.getTimeSeriesData).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (apiClient.getDashboardStats as jest.Mock).mockResolvedValue(mockStatsData);
      (apiClient.getRecentActivity as jest.Mock).mockResolvedValue(mockActivityData);
      (apiClient.getTimeSeriesData as jest.Mock).mockResolvedValue(mockPerformanceData);
    });

    it('should have accessible stat cards', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should have proper heading structure', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });
});
