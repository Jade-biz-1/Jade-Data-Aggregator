/**
 * DynamicForm Component Tests
 * Tests schema fetching, field rendering, validation, submission, and connection testing
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm } from '@/components/forms/DynamicForm';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'test-token'),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('DynamicForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnTest = jest.fn();

  const mockSchema = {
    name: 'PostgreSQL Configuration',
    description: 'Configure PostgreSQL database connection',
    groups: [
      { id: 'connection', label: 'Connection Settings' },
      { id: 'authentication', label: 'Authentication' },
    ],
    fields: [
      {
        name: 'host',
        label: 'Host',
        field_type: 'text',
        required: true,
        placeholder: 'localhost',
        help_text: 'Database server hostname',
        group: 'connection',
      },
      {
        name: 'port',
        label: 'Port',
        field_type: 'number',
        default_value: 5432,
        required: true,
        group: 'connection',
        validation: [
          { type: 'min', value: 1, message: 'Port must be at least 1' },
          { type: 'max', value: 65535, message: 'Port must be at most 65535' },
        ],
      },
      {
        name: 'username',
        label: 'Username',
        field_type: 'text',
        required: true,
        group: 'authentication',
      },
      {
        name: 'password',
        label: 'Password',
        field_type: 'password',
        required: true,
        group: 'authentication',
      },
      {
        name: 'database',
        label: 'Database Name',
        field_type: 'text',
        required: false,
        group: 'connection',
      },
      {
        name: 'ssl',
        label: 'Use SSL',
        field_type: 'boolean',
        default_value: false,
        group: 'connection',
      },
    ],
  };

  const mockSchemaWithoutGroups = {
    name: 'Simple Configuration',
    description: 'Simple connector configuration',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        field_type: 'text',
        required: true,
      },
      {
        name: 'endpoint',
        label: 'Endpoint URL',
        field_type: 'url',
        required: true,
        validation: [
          { type: 'url', message: 'Must be a valid URL starting with http:// or https://' },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSchema,
    });
  });

  describe('Schema Loading', () => {
    it('should show loading state while fetching schema', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should fetch schema on mount', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8001/api/v1/configuration/schemas/postgresql',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer test-token',
            },
          })
        );
      });
    });

    it('should display error when schema fails to load', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to load configuration form/i)).toBeInTheDocument();
      });
    });

    it('should display schema name and description', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('PostgreSQL Configuration')).toBeInTheDocument();
        expect(screen.getByText('Configure PostgreSQL database connection')).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    it('should render all fields from schema', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Database Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Use SSL/i)).toBeInTheDocument();
      });
    });

    it('should render fields grouped by sections', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('Connection Settings')).toBeInTheDocument();
        expect(screen.getByText('Authentication')).toBeInTheDocument();
      });
    });

    it('should render form without groups when schema has no groups', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSchemaWithoutGroups,
      });

      render(<DynamicForm connectorType="api" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Endpoint URL/i)).toBeInTheDocument();
      });
    });

    it('should show required field indicators', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const hostLabel = screen.getByText('Host');
        expect(hostLabel.parentElement).toHaveTextContent('*');
      });
    });

    it('should display help text for fields', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('Database server hostname')).toBeInTheDocument();
      });
    });

    it('should show default values in fields', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const portInput = screen.getByLabelText(/Port/i) as HTMLInputElement;
        expect(portInput.value).toBe('5432');
      });
    });
  });

  describe('Form Interactions', () => {
    it('should allow typing in text fields', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      const hostInput = screen.getByLabelText(/Host/i);
      await user.type(hostInput, 'db.example.com');

      expect(hostInput).toHaveValue('db.example.com');
    });

    it('should allow changing number fields', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
      });

      const portInput = screen.getByLabelText(/Port/i);
      await user.clear(portInput);
      await user.type(portInput, '3306');

      expect(portInput).toHaveValue(3306);
    });

    it('should toggle checkbox fields', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByText(/Use SSL/i)).toBeInTheDocument();
      });

      const sslCheckbox = screen.getByRole('checkbox', { name: /Use SSL/i });
      expect(sslCheckbox).not.toBeChecked();

      await user.click(sslCheckbox);
      expect(sslCheckbox).toBeChecked();
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the eye icon toggle button
      const passwordContainer = passwordInput.parentElement;
      const toggleButton = within(passwordContainer!).getByRole('button');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Configuration/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Host is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate number min/max constraints', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
      });

      const portInput = screen.getByLabelText(/Port/i);
      await user.clear(portInput);
      await user.type(portInput, '99999');

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Port must be at most 65535/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSchemaWithoutGroups,
      });

      const user = userEvent.setup();
      render(<DynamicForm connectorType="api" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Endpoint URL/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText(/Endpoint URL/i);
      await user.type(urlInput, 'invalid-url');

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Must be a valid URL/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Configuration/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Host is required/i)).toBeInTheDocument();
      });

      const hostInput = screen.getByLabelText(/Host/i);
      await user.type(hostInput, 'localhost');

      await waitFor(() => {
        expect(screen.queryByText(/Host is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form values', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Host/i), 'localhost');
      await user.type(screen.getByLabelText(/Username/i), 'dbuser');
      await user.type(screen.getByLabelText(/Password/i), 'dbpass');

      const submitButton = screen.getByRole('button', { name: /Save Configuration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          host: 'localhost',
          port: 5432,
          username: 'dbuser',
          password: 'dbpass',
          database: '',
          ssl: false,
        });
      });
    });

    it('should use custom submit label', async () => {
      render(
        <DynamicForm
          connectorType="postgresql"
          onSubmit={mockOnSubmit}
          submitLabel="Create Connector"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Connector/i })).toBeInTheDocument();
      });
    });

    it('should merge initial values with defaults', async () => {
      const user = userEvent.setup();
      render(
        <DynamicForm
          connectorType="postgresql"
          onSubmit={mockOnSubmit}
          initialValues={{ host: 'prod-db.example.com', username: 'admin' }}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      const hostInput = screen.getByLabelText(/Host/i) as HTMLInputElement;
      const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;

      expect(hostInput.value).toBe('prod-db.example.com');
      expect(usernameInput.value).toBe('admin');
    });
  });

  describe('Connection Testing', () => {
    it('should display test button by default', async () => {
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument();
      });
    });

    it('should hide test button when showTestButton is false', async () => {
      render(
        <DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} showTestButton={false} />
      );

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Test Connection/i })).not.toBeInTheDocument();
      });
    });

    it('should call custom onTest handler', async () => {
      mockOnTest.mockResolvedValue({ success: true });
      const user = userEvent.setup();

      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} onTest={mockOnTest} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Host/i), 'localhost');
      await user.type(screen.getByLabelText(/Username/i), 'dbuser');
      await user.type(screen.getByLabelText(/Password/i), 'dbpass');

      const testButton = screen.getByRole('button', { name: /Test Connection/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(mockOnTest).toHaveBeenCalledWith({
          host: 'localhost',
          port: 5432,
          username: 'dbuser',
          password: 'dbpass',
          database: '',
          ssl: false,
        });
      });
    });

    it('should show loading state during test', async () => {
      mockOnTest.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();

      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} onTest={mockOnTest} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Host/i), 'localhost');
      await user.type(screen.getByLabelText(/Username/i), 'dbuser');
      await user.type(screen.getByLabelText(/Password/i), 'dbpass');

      const testButton = screen.getByRole('button', { name: /Test Connection/i });
      await user.click(testButton);

      expect(screen.getByText(/Testing.../i)).toBeInTheDocument();
      expect(testButton).toBeDisabled();
    });

    it('should display success test result', async () => {
      const mockTestResponse = {
        success: true,
        message: 'Connection successful',
        duration_ms: 125,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSchema,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTestResponse,
        });

      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Host/i), 'localhost');
      await user.type(screen.getByLabelText(/Username/i), 'dbuser');
      await user.type(screen.getByLabelText(/Password/i), 'dbpass');

      const testButton = screen.getByRole('button', { name: /Test Connection/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection Successful/i)).toBeInTheDocument();
        expect(screen.getByText(/Connection successful/i)).toBeInTheDocument();
        expect(screen.getByText(/Test completed in 125ms/i)).toBeInTheDocument();
      });
    });

    it('should display failure test result', async () => {
      const mockTestResponse = {
        success: false,
        message: 'Authentication failed',
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSchema,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTestResponse,
        });

      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Host/i), 'localhost');
      await user.type(screen.getByLabelText(/Username/i), 'wronguser');
      await user.type(screen.getByLabelText(/Password/i), 'wrongpass');

      const testButton = screen.getByRole('button', { name: /Test Connection/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
      });
    });

    it('should not test with invalid form data', async () => {
      const user = userEvent.setup();
      render(<DynamicForm connectorType="postgresql" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /Test Connection/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/Host is required/i)).toBeInTheDocument();
      });

      // Fetch should only be called once for schema
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
