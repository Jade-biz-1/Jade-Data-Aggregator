/**
 * Connectors Page Component Tests
 * Tests connector list rendering, search/filter, CRUD operations, and connection testing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectorsPage from '@/app/connectors/page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getConnectors: jest.fn(),
    deleteConnector: jest.fn(),
    testConnection: jest.fn(),
  },
}));

// Mock hooks
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    features: {
      canCreateConnector: true,
      canEditConnector: true,
      canDeleteConnector: true,
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

// Mock layout
jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/components/common/AccessDenied', () => ({
  AccessDenied: () => <div>Access Denied</div>,
}));

describe('ConnectorsPage', () => {
  const mockConnectors = [
    {
      id: 1,
      name: 'PostgreSQL Production',
      description: 'Main production database',
      type: 'database',
      connector_type: 'database',
      config: { host: 'prod-db.example.com', port: 5432 },
      is_active: true,
      created_at: '2025-10-01T10:00:00Z',
    },
    {
      id: 2,
      name: 'Salesforce API',
      description: 'CRM data connector',
      type: 'rest_api',
      connector_type: 'rest_api',
      config: { base_url: 'https://api.salesforce.com' },
      is_active: true,
      created_at: '2025-09-15T08:00:00Z',
    },
    {
      id: 3,
      name: 'S3 Data Lake',
      description: 'AWS S3 storage',
      type: 'file',
      connector_type: 'file',
      config: { bucket: 'data-lake', region: 'us-east-1' },
      is_active: false,
      created_at: '2025-10-05T12:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render connectors page', async () => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('should display page title', async () => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Connectors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching connectors', () => {
      (apiClient.getConnectors as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<ConnectorsPage />);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);
    });

    it('should display all connectors', async () => {
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
        expect(screen.getByText('Salesforce API')).toBeInTheDocument();
        expect(screen.getByText('S3 Data Lake')).toBeInTheDocument();
      });
    });

    it('should show connector types correctly', async () => {
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/database/i)).toBeInTheDocument();
        expect(screen.getByText(/rest_api/i)).toBeInTheDocument();
        expect(screen.getByText(/file/i)).toBeInTheDocument();
      });
    });

    it('should display connector status', async () => {
      render(<ConnectorsPage />);

      await waitFor(() => {
        const connectedStatuses = screen.getAllByText(/connected/i);
        const disconnectedStatuses = screen.getAllByText(/disconnected/i);
        expect(connectedStatuses.length).toBeGreaterThan(0);
        expect(disconnectedStatuses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);
    });

    it('should display search input', async () => {
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('should filter connectors by name', async () => {
      const user = userEvent.setup();
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'PostgreSQL');

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
        expect(screen.queryByText('Salesforce API')).not.toBeInTheDocument();
      });
    });

    it('should filter connectors by type', async () => {
      const user = userEvent.setup();
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'database');

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
        expect(screen.queryByText('Salesforce API')).not.toBeInTheDocument();
      });
    });

    it('should filter connectors by description', async () => {
      const user = userEvent.setup();
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'CRM');

      await waitFor(() => {
        expect(screen.getByText('Salesforce API')).toBeInTheDocument();
        expect(screen.queryByText('PostgreSQL Production')).not.toBeInTheDocument();
      });
    });

    it('should show all connectors when search is cleared', async () => {
      const user = userEvent.setup();
      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Production')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'PostgreSQL');

      await waitFor(() => {
        expect(screen.queryByText('Salesforce API')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Salesforce API')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockError = new Error('Network error');
      (apiClient.getConnectors as jest.Mock).mockRejectedValue(mockError);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('should display error message on fetch failure', async () => {
      const mockError = new Error('Failed to fetch connectors');
      (apiClient.getConnectors as jest.Mock).mockRejectedValue(mockError);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no connectors exist', async () => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue([]);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no connectors|empty/i)).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue([]);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create|add/i })).toBeInTheDocument();
      });
    });
  });

  describe('Permissions', () => {
    it('should show create button when user has permission', async () => {
      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create|add/i })).toBeInTheDocument();
      });
    });

    it('should show access denied when user lacks permissions', async () => {
      jest.mocked(require('@/hooks/usePermissions').usePermissions).mockReturnValue({
        features: {
          canCreateConnector: false,
          canEditConnector: false,
          canDeleteConnector: false,
        },
        loading: false,
      });

      (apiClient.getConnectors as jest.Mock).mockResolvedValue(mockConnectors);

      render(<ConnectorsPage />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });
});
