/**
 * Schema Introspect Page Unit Tests — TEST-018
 * Covers: rendering, source type selection, introspection API call, schema display,
 *         save schema modal, compare panel, saved schemas list, error handling,
 *         permission guard.
 *
 * schema/introspect/page.tsx uses `api` (axios instance).
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SchemaIntrospectPage from '@/app/schema/introspect/page';
import { api } from '@/lib/api';

// ── Mock api (axios instance) ──────────────────────────────────────────────
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// ── Mock Next.js navigation ────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/schema/introspect',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Mock permissions ───────────────────────────────────────────────────────
const mockUsePermissions = jest.fn();
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

// ── Mock toast ─────────────────────────────────────────────────────────────
const mockSuccess = jest.fn();
const mockError = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  __esModule: true,
  default: () => ({
    toasts: [],
    success: mockSuccess,
    error: mockError,
    warning: jest.fn(),
  }),
}));

// ── Mock layout ────────────────────────────────────────────────────────────
jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/components/common/AccessDenied', () => ({
  AccessDenied: ({ message }: { message?: string }) => (
    <div data-testid="access-denied">{message || 'Access Denied'}</div>
  ),
}));

jest.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => null,
}));

// Mock SchemaTree — complex visual component
jest.mock('@/components/schema/schema-tree', () => ({
  SchemaTree: ({ schema }: any) => (
    <div data-testid="schema-tree">{JSON.stringify(schema).slice(0, 50)}</div>
  ),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────
const mockSchema = {
  source_type: 'database',
  table_count: 5,
  field_count: 42,
  fields: [
    { name: 'id', data_type: 'integer', nullable: false },
    { name: 'name', data_type: 'varchar', nullable: true },
  ],
};

const mockSavedSchemas = [
  { id: 1, name: 'Production DB', source_type: 'database', schema_data: mockSchema, created_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Staging DB', source_type: 'database', schema_data: { ...mockSchema, table_count: 3 }, created_at: '2025-01-02T00:00:00Z' },
];

const mockCompareResult = {
  schemas_match: false,
  added_fields: ['new_column'],
  removed_fields: ['old_column'],
  modified_fields: [],
  type_changes: [{ field: 'status', old_type: 'varchar', new_type: 'enum' }],
  compared_at: '2025-01-03T10:00:00Z',
  compatibility_score: 75,
};

const allowedPermissions = {
  features: { connectors: { view: true, create: true } },
  loading: false,
};

const deniedPermissions = {
  features: { connectors: { view: false } },
  loading: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function setupSavedSchemasLoad() {
  (api.get as jest.Mock).mockResolvedValue({ data: mockSavedSchemas });
}

// ══════════════════════════════════════════════════════════════════════════
describe('SchemaIntrospectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePermissions.mockReturnValue(allowedPermissions);
    // Default: GET /schema/schemas returns empty on mount
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
  });

  // ── Permission Guard ───────────────────────────────────────────────────
  describe('Permission Handling', () => {
    it('shows loading spinner while permissions resolve', () => {
      mockUsePermissions.mockReturnValue({ features: null, loading: true });
      render(<SchemaIntrospectPage />);
      expect(screen.queryByText('Schema Introspection')).not.toBeInTheDocument();
    });

    it('shows AccessDenied when connectors.view is false', () => {
      mockUsePermissions.mockReturnValue(deniedPermissions);
      render(<SchemaIntrospectPage />);
      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });

    it('renders page when connectors.view is true', () => {
      render(<SchemaIntrospectPage />);
      expect(screen.getByText('Schema Introspection')).toBeInTheDocument();
    });
  });

  // ── Source Type Selection ──────────────────────────────────────────────
  describe('Source Type Selection', () => {
    it('renders all four source type buttons', () => {
      render(<SchemaIntrospectPage />);
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('API (OpenAPI)')).toBeInTheDocument();
      expect(screen.getByText('JSON Sample')).toBeInTheDocument();
      expect(screen.getByText('CSV Sample')).toBeInTheDocument();
    });

    it('shows database connection string field by default', () => {
      render(<SchemaIntrospectPage />);
      expect(screen.getByPlaceholderText(/postgresql:\/\//i)).toBeInTheDocument();
    });

    it('switches to API fields when API button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await user.click(screen.getByText('API (OpenAPI)'));
      expect(screen.getByText('OpenAPI/Swagger URL')).toBeInTheDocument();
    });

    it('switches to JSON textarea when JSON button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await user.click(screen.getByText('JSON Sample'));
      expect(screen.getByText('Sample JSON Data')).toBeInTheDocument();
    });

    it('switches to CSV textarea when CSV button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await user.click(screen.getByText('CSV Sample'));
      expect(screen.getByText(/Sample CSV/i)).toBeInTheDocument();
    });
  });

  // ── Introspect ─────────────────────────────────────────────────────────
  describe('Schema Introspection', () => {
    it('calls POST /schema/introspect/database with connection string', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockSchema });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);

      const connInput = screen.getByPlaceholderText(/postgresql:\/\//i);
      await user.type(connInput, 'postgresql://user:pass@localhost:5432/mydb');
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/schema/introspect/database',
          expect.objectContaining({ connection_string: 'postgresql://user:pass@localhost:5432/mydb' })
        );
      });
    });

    it('displays the schema tree after successful introspection', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockSchema });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await user.type(
        screen.getByPlaceholderText(/postgresql:\/\//i),
        'postgresql://user:pass@localhost:5432/mydb'
      );
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));

      await waitFor(() => {
        expect(screen.getByTestId('schema-tree')).toBeInTheDocument();
      });
    });

    it('shows schema statistics after introspection', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockSchema });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await user.type(
        screen.getByPlaceholderText(/postgresql:\/\//i),
        'postgresql://user:pass@localhost/db'
      );
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // table_count
        expect(screen.getByText('42')).toBeInTheDocument(); // field_count
      });
    });

    it('shows error message when introspection fails', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { detail: 'Connection refused' } }
      });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await user.type(
        screen.getByPlaceholderText(/postgresql:\/\//i),
        'postgresql://user:pass@badhost/db'
      );
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));

      await waitFor(() => {
        expect(screen.getByText('Connection refused')).toBeInTheDocument();
        expect(mockError).toHaveBeenCalledWith('Connection refused', 'Introspection Error');
      });
    });

    it('calls POST /schema/introspect/json with parsed JSON data', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockSchema });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await user.click(screen.getByText('JSON Sample'));

      const textarea = screen.getByPlaceholderText(/\{"id"/i);
      await user.clear(textarea);
      await user.type(textarea, '{"id":1,"name":"test"}');
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/schema/introspect/json',
          expect.objectContaining({ json_data: { id: 1, name: 'test' }, schema_name: 'sample' })
        );
      });
    });
  });

  // ── Save Schema Modal ──────────────────────────────────────────────────
  describe('Save Schema Modal', () => {
    async function introspectFirst(user: ReturnType<typeof userEvent.setup>) {
      (api.post as jest.Mock).mockResolvedValue({ data: mockSchema });
      await user.type(
        screen.getByPlaceholderText(/postgresql:\/\//i),
        'postgresql://user:pass@localhost/db'
      );
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));
      await waitFor(() => screen.getByTestId('schema-tree'));
    }

    it('opens save modal when Save Schema button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      // Reset mock for the save call
      (api.post as jest.Mock).mockResolvedValue({ data: { id: 10, name: 'Test Save' } });
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      await user.click(screen.getByRole('button', { name: /save schema/i }));
      expect(screen.getByText('Schema Name')).toBeInTheDocument();
    });

    it('calls POST /schema/schemas and shows success toast', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      (api.post as jest.Mock).mockResolvedValueOnce({ data: { id: 10, name: 'My Schema' } });
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      await user.click(screen.getByRole('button', { name: /save schema/i }));

      const nameInput = screen.getByPlaceholderText(/name for this schema/i);
      await user.type(nameInput, 'My Schema');
      await user.click(screen.getByRole('button', { name: /^save$/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/schema/schemas',
          expect.objectContaining({ name: 'My Schema', source_type: 'database' })
        );
        expect(mockSuccess).toHaveBeenCalledWith('Schema saved successfully', 'Saved');
      });
    });

    it('closes modal on Cancel button', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      (api.post as jest.Mock).mockResolvedValue({ data: {} });
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      await user.click(screen.getByRole('button', { name: /save schema/i }));
      expect(screen.getByText('Schema Name')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Schema Name')).not.toBeInTheDocument();
    });
  });

  // ── Compare Panel ──────────────────────────────────────────────────────
  describe('Schema Compare', () => {
    async function introspectFirst(user: ReturnType<typeof userEvent.setup>) {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockSchema });
      await user.type(
        screen.getByPlaceholderText(/postgresql:\/\//i),
        'postgresql://user:pass@localhost/db'
      );
      await user.click(screen.getByRole('button', { name: /introspect schema/i }));
      await waitFor(() => screen.getByTestId('schema-tree'));
    }

    it('shows compare panel when Compare button clicked', async () => {
      const user = userEvent.setup();
      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      (api.get as jest.Mock).mockResolvedValue({ data: [] });
      await user.click(screen.getByRole('button', { name: /compare/i }));
      expect(screen.getByText('Compare Schemas')).toBeInTheDocument();
    });

    it('lists saved schemas in compare panel', async () => {
      setupSavedSchemasLoad();
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      (api.get as jest.Mock).mockResolvedValue({ data: mockSavedSchemas });
      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(screen.getByText('Production DB')).toBeInTheDocument();
        expect(screen.getByText('Staging DB')).toBeInTheDocument();
      });
    });

    it('calls POST /schema/compare and shows results', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSavedSchemas });
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockSchema });
      const user = userEvent.setup();

      render(<SchemaIntrospectPage />);
      await introspectFirst(user);

      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockCompareResult });
      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => screen.getByText('Production DB'));
      await user.click(screen.getByText('Production DB'));
      await user.click(screen.getByRole('button', { name: /run comparison/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/schema/compare',
          expect.objectContaining({ schema1: mockSchema })
        );
        expect(screen.getByText(/75%/i)).toBeInTheDocument();
        expect(screen.getByText('new_column')).toBeInTheDocument();
        expect(screen.getByText('old_column')).toBeInTheDocument();
      });
    });
  });

  // ── Saved Schemas Panel ────────────────────────────────────────────────
  describe('Saved Schemas Panel', () => {
    it('renders saved schemas panel when schemas exist', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSavedSchemas });
      render(<SchemaIntrospectPage />);

      await waitFor(() => {
        expect(screen.getByText('Saved Schemas')).toBeInTheDocument();
        expect(screen.getByText('Production DB')).toBeInTheDocument();
      });
    });

    it('does not render saved schemas panel when list is empty', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });
      render(<SchemaIntrospectPage />);

      await waitFor(() => {
        expect(screen.queryByText('Saved Schemas')).not.toBeInTheDocument();
      });
    });
  });
});
