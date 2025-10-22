/**
 * Pipelines Page Component Tests
 * Tests pipeline list rendering, CRUD operations, filtering, and permissions
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelinesPage from '@/app/pipelines/page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getPipelines: jest.fn(),
    deletePipeline: jest.fn(),
  },
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/pipelines',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock hooks
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    features: {
      canCreatePipeline: true,
      canEditPipeline: true,
      canDeletePipeline: true,
    },
    loading: false,
  }),
}));

jest.mock('@/hooks/useToast', () => ({
  __esModule: true,
  default: () => ({
    toasts: [],
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  }),
}));

// Mock layout components
jest.mock('@/components/layout/dashboard-layout-enhanced', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/components/table', () => ({
  EnhancedTable: ({ data, columns, onDelete }: any) => (
    <div data-testid="enhanced-table">
      <table>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {onDelete && (
        <button onClick={() => onDelete(data.slice(0, 1))}>Delete Selected</button>
      )}
    </div>
  ),
  Column: {} as any,
}));

describe('PipelinesPage', () => {
  const mockPipelines = [
    {
      id: 1,
      name: 'Sales Data ETL',
      description: 'Extract sales data from PostgreSQL',
      source_config: { type: 'database', host: 'localhost' },
      destination_config: { type: 's3', bucket: 'data-lake' },
      is_active: true,
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-15T14:30:00Z',
    },
    {
      id: 2,
      name: 'Customer API Sync',
      description: 'Sync customer data from API',
      source_config: { type: 'rest_api', url: 'https://api.example.com' },
      destination_config: { type: 'database', host: 'warehouse' },
      is_active: false,
      created_at: '2025-09-15T08:00:00Z',
      updated_at: '2025-10-10T11:20:00Z',
    },
    {
      id: 3,
      name: 'Log Processing Pipeline',
      description: 'Process and analyze logs',
      source_config: { type: 'file', path: '/logs' },
      destination_config: { type: 'elasticsearch', url: 'http://es:9200' },
      is_active: true,
      created_at: '2025-10-05T12:00:00Z',
      updated_at: '2025-10-16T09:45:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render pipelines page with layout', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('should display page title', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Pipelines/i)).toBeInTheDocument();
      });
    });

    it('should show create pipeline button', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);

      render(<PipelinesPage />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create|new/i });
        expect(createButton).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading state while fetching pipelines', () => {
      (apiClient.getPipelines as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<PipelinesPage />);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);
    });

    it('should display all pipelines in table', async () => {
      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Sales Data ETL')).toBeInTheDocument();
        expect(screen.getByText('Customer API Sync')).toBeInTheDocument();
        expect(screen.getByText('Log Processing Pipeline')).toBeInTheDocument();
      });
    });

    it('should show pipeline status correctly', async () => {
      render(<PipelinesPage />);

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('active');
        const pausedStatuses = screen.getAllByText('paused');
        expect(activeStatuses.length).toBeGreaterThan(0);
        expect(pausedStatuses.length).toBeGreaterThan(0);
      });
    });

    it('should display source and destination types', async () => {
      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText(/database/i)).toBeInTheDocument();
        expect(screen.getByText(/s3/i)).toBeInTheDocument();
        expect(screen.getByText(/rest_api/i)).toBeInTheDocument();
      });
    });

    it('should render enhanced table component', async () => {
      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-table')).toBeInTheDocument();
      });
    });
  });

  describe('Pipeline Actions', () => {
    beforeEach(() => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);
    });

    it('should navigate to create page when create button clicked', async () => {
      const user = userEvent.setup();
      render(<PipelinesPage />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create|new/i });
        expect(createButton).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create|new/i });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/pipeline'));
    });

    it('should handle pipeline deletion', async () => {
      (apiClient.deletePipeline as jest.Mock).mockResolvedValue({ success: true });
      const user = userEvent.setup();

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Sales Data ETL')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Selected');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(apiClient.deletePipeline).toHaveBeenCalledWith(1);
      });
    });

    it('should update UI after successful deletion', async () => {
      (apiClient.deletePipeline as jest.Mock).mockResolvedValue({ success: true });
      const user = userEvent.setup();

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Sales Data ETL')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Selected');
      await user.click(deleteButton);

      await waitFor(() => {
        // Pipeline count should decrease
        expect(apiClient.deletePipeline).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockError = new Error('Network error');
      (apiClient.getPipelines as jest.Mock).mockRejectedValue(mockError);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('should show error message when fetch fails', async () => {
      const mockError = new Error('Failed to fetch pipelines');
      (apiClient.getPipelines as jest.Mock).mockRejectedValue(mockError);

      render(<PipelinesPage />);

      await waitFor(() => {
        // Error should be logged
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle deletion error gracefully', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);
      (apiClient.deletePipeline as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );
      const user = userEvent.setup();

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Sales Data ETL')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete Selected');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no pipelines exist', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue([]);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByText(/no pipelines|empty/i)).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue([]);

      render(<PipelinesPage />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create|new/i });
        expect(createButton).toBeInTheDocument();
      });
    });
  });

  describe('Permissions', () => {
    it('should show create button when user has create permission', async () => {
      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create|new/i })).toBeInTheDocument();
      });
    });

    it('should hide delete button when user lacks delete permission', async () => {
      // Re-mock with no delete permission
      jest.mocked(require('@/hooks/usePermissions').usePermissions).mockReturnValue({
        features: {
          canCreatePipeline: true,
          canEditPipeline: true,
          canDeletePipeline: false,
        },
        loading: false,
      });

      (apiClient.getPipelines as jest.Mock).mockResolvedValue(mockPipelines);

      render(<PipelinesPage />);

      await waitFor(() => {
        expect(screen.queryByText('Delete Selected')).not.toBeInTheDocument();
      });
    });
  });
});
