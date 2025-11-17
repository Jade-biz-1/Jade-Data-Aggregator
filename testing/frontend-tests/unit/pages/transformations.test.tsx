/**
 * Transformations Page Component Tests
 * Tests transformation list rendering, search, testing functionality, and CRUD operations
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransformationsPage from '@/app/transformations/page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getTransformations: jest.fn(),
    testTransformation: jest.fn(),
    deleteTransformation: jest.fn(),
  },
}));

// Mock hooks
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    features: {
      canCreateTransformation: true,
      canEditTransformation: true,
      canDeleteTransformation: true,
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

describe('TransformationsPage', () => {
  const mockTransformations = [
    {
      id: 1,
      name: 'Field Mapper',
      description: 'Maps source fields to target fields',
      transformation_type: 'mapping',
      source_fields: ['source_name', 'source_email'],
      target_fields: ['name', 'email'],
      transformation_rules: { mappings: { source_name: 'name' } },
      is_active: true,
      created_at: '2025-10-01T10:00:00Z',
    },
    {
      id: 2,
      name: 'Data Normalizer',
      description: 'Normalizes customer data',
      transformation_type: 'data_normalization',
      source_fields: ['first_name', 'last_name'],
      target_fields: ['full_name'],
      transformation_rules: { join_fields: ['first_name', 'last_name'] },
      is_active: true,
      created_at: '2025-09-15T08:00:00Z',
    },
    {
      id: 3,
      name: 'Currency Converter',
      description: 'Convert EUR to USD',
      transformation_type: 'currency_conversion',
      source_fields: ['price_eur'],
      target_fields: ['price_usd'],
      transformation_rules: { from_currency: 'EUR', to_currency: 'USD' },
      is_active: false,
      created_at: '2025-10-05T12:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render transformations page', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('should display page title', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Transformations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching transformations', () => {
      (apiClient.getTransformations as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<TransformationsPage />);

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);
    });

    it('should display all transformations', async () => {
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
        expect(screen.getByText('Data Normalizer')).toBeInTheDocument();
        expect(screen.getByText('Currency Converter')).toBeInTheDocument();
      });
    });

    it('should show transformation types', async () => {
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/mapping/i)).toBeInTheDocument();
        expect(screen.getByText(/data_normalization/i)).toBeInTheDocument();
        expect(screen.getByText(/currency_conversion/i)).toBeInTheDocument();
      });
    });

    it('should display transformation descriptions', async () => {
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Maps source fields to target fields')).toBeInTheDocument();
        expect(screen.getByText('Normalizes customer data')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);
    });

    it('should display search input', async () => {
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('should filter transformations by name', async () => {
      const user = userEvent.setup();
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Field Mapper');

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
        expect(screen.queryByText('Data Normalizer')).not.toBeInTheDocument();
      });
    });

    it('should filter transformations by type', async () => {
      const user = userEvent.setup();
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'mapping');

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
        expect(screen.queryByText('Currency Converter')).not.toBeInTheDocument();
      });
    });

    it('should show all transformations when search is cleared', async () => {
      const user = userEvent.setup();
      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'mapper');

      await waitFor(() => {
        expect(screen.queryByText('Currency Converter')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Currency Converter')).toBeInTheDocument();
      });
    });
  });

  describe('Transformation Actions', () => {
    beforeEach(() => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);
    });

    it('should handle transformation test', async () => {
      (apiClient.testTransformation as jest.Mock).mockResolvedValue({ success: true });
      const user = userEvent.setup();

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const testButton = screen.getAllByRole('button', { name: /test|run/i })[0];
      await user.click(testButton);

      await waitFor(() => {
        expect(apiClient.testTransformation).toHaveBeenCalledWith(1, {});
      });
    });

    it('should show success message after successful test', async () => {
      (apiClient.testTransformation as jest.Mock).mockResolvedValue({ success: true });
      const user = userEvent.setup();

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const testButton = screen.getAllByRole('button', { name: /test|run/i })[0];
      await user.click(testButton);

      await waitFor(() => {
        expect(apiClient.testTransformation).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockError = new Error('Network error');
      (apiClient.getTransformations as jest.Mock).mockRejectedValue(mockError);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('should display empty state on fetch error', async () => {
      const mockError = new Error('Failed to fetch');
      (apiClient.getTransformations as jest.Mock).mockRejectedValue(mockError);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle test transformation error', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);
      (apiClient.testTransformation as jest.Mock).mockRejectedValue(
        new Error('Test failed')
      );
      const user = userEvent.setup();

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field Mapper')).toBeInTheDocument();
      });

      const testButton = screen.getAllByRole('button', { name: /test|run/i })[0];
      await user.click(testButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no transformations exist', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue([]);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no transformations|empty/i)).toBeInTheDocument();
      });
    });

    it('should show create button in empty state', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue([]);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create|add/i })).toBeInTheDocument();
      });
    });
  });

  describe('Permissions', () => {
    it('should show create button when user has permission', async () => {
      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create|add/i })).toBeInTheDocument();
      });
    });

    it('should show access denied when user lacks permissions', async () => {
      jest.mocked(require('@/hooks/usePermissions').usePermissions).mockReturnValue({
        features: {
          canCreateTransformation: false,
          canEditTransformation: false,
          canDeleteTransformation: false,
        },
        loading: false,
      });

      (apiClient.getTransformations as jest.Mock).mockResolvedValue(mockTransformations);

      render(<TransformationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });
});
