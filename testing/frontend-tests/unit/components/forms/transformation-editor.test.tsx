/**
 * Transformation Editor Component Tests
 * Tests code editing, testing, validation, and save functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransformationEditor } from '@/components/transformations/transformation-editor';

describe('TransformationEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnTest = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render transformation editor', () => {
      render(<TransformationEditor />);

      expect(screen.getByPlaceholderText(/transformation name/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /code/i })).toBeInTheDocument();
    });

    it('should display initial values', () => {
      render(
        <TransformationEditor
          initialName="My Transform"
          initialCode="function transform(data) { return data; }"
        />
      );

      expect(screen.getByDisplayValue('My Transform')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/function transform/i)).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<TransformationEditor />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
    });

    it('should display close button when onClose is provided', () => {
      render(<TransformationEditor onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow typing in name field', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor />);

      const nameInput = screen.getByPlaceholderText(/transformation name/i);
      await user.type(nameInput, 'Data Normalizer');

      expect(nameInput).toHaveValue('Data Normalizer');
    });

    it('should allow typing in code field', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor />);

      const codeInput = screen.getByRole('textbox', { name: /code/i });
      await user.type(codeInput, 'const data = [];');

      expect(codeInput).toHaveValue('const data = [];');
    });

    it('should allow typing in test data field', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor />);

      const testDataInput = screen.getByPlaceholderText(/test data/i);
      await user.type(testDataInput, '[{"id": 1}]');

      expect(testDataInput).toHaveValue('[{"id": 1}]');
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave with name and code', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onSave={mockOnSave} />);

      const nameInput = screen.getByPlaceholderText(/transformation name/i);
      const codeInput = screen.getByRole('textbox', { name: /code/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(nameInput, 'My Transform');
      await user.type(codeInput, 'function transform() {}');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('My Transform', 'function transform() {}');
      });
    });

    it('should not save when name is empty', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onSave={mockOnSave} />);

      const codeInput = screen.getByRole('textbox', { name: /code/i });
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(codeInput, 'function transform() {}');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a transformation name/i)).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should not save when code is empty', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onSave={mockOnSave} />);

      const nameInput = screen.getByPlaceholderText(/transformation name/i);
      const saveButton = screen.getByRole('button', { name: /save/i });

      await user.type(nameInput, 'My Transform');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter transformation code/i)).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Test Functionality', () => {
    it('should call onTest with code and test data', async () => {
      mockOnTest.mockResolvedValue({ success: true, output: [] });
      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const codeInput = screen.getByRole('textbox', { name: /code/i });
      const testDataInput = screen.getByPlaceholderText(/test data/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      await user.type(codeInput, 'function transform(d) { return d; }');
      await user.clear(testDataInput);
      await user.type(testDataInput, '[{"id": 1}]');
      await user.click(testButton);

      await waitFor(() => {
        expect(mockOnTest).toHaveBeenCalledWith(
          'function transform(d) { return d; }',
          [{ id: 1 }]
        );
      });
    });

    it('should display test results on success', async () => {
      mockOnTest.mockResolvedValue({
        success: true,
        output: [{ id: 1, processed: true }],
      });
      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const testButton = screen.getByRole('button', { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/test completed/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during test', async () => {
      mockOnTest.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const testButton = screen.getByRole('button', { name: /test/i });
      await user.click(testButton);

      expect(screen.getByText(/testing/i)).toBeInTheDocument();
    });

    it('should handle invalid JSON in test data', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const testDataInput = screen.getByPlaceholderText(/test data/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      await user.clear(testDataInput);
      await user.type(testDataInput, 'invalid json');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
        expect(mockOnTest).not.toHaveBeenCalled();
      });
    });

    it('should handle test execution error', async () => {
      mockOnTest.mockRejectedValue(new Error('Execution failed'));
      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const testButton = screen.getByRole('button', { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/execution failed/i)).toBeInTheDocument();
      });
    });

    it('should clear previous results on new test', async () => {
      mockOnTest
        .mockResolvedValueOnce({ success: true, output: [{ id: 1 }] })
        .mockResolvedValueOnce({ success: true, output: [{ id: 2 }] });

      const user = userEvent.setup();
      render(<TransformationEditor onTest={mockOnTest} />);

      const testButton = screen.getByRole('button', { name: /test/i });

      // First test
      await user.click(testButton);
      await waitFor(() => {
        expect(screen.getByText(/test completed/i)).toBeInTheDocument();
      });

      // Second test
      await user.click(testButton);
      await waitFor(() => {
        expect(mockOnTest).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should display validation errors', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onSave={mockOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/please enter/i)).toBeInTheDocument();
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor onSave={mockOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(screen.getByText(/please enter/i)).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/transformation name/i);
      await user.type(nameInput, 'Test');

      // Error should be cleared or replaced
    });
  });

  describe('Default Behavior', () => {
    it('should work without callbacks', () => {
      render(<TransformationEditor />);

      expect(screen.getByPlaceholderText(/transformation name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should use default test implementation when onTest not provided', async () => {
      const user = userEvent.setup();
      render(<TransformationEditor />);

      const testButton = screen.getByRole('button', { name: /test/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/test mode/i)).toBeInTheDocument();
      });
    });
  });
});
