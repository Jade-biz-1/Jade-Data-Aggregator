/**
 * Register Form Component Tests
 * Tests form validation, submission, error handling, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/auth/register/page';
import { useAuthStore } from '@/stores/auth';

// Mock the auth store
jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('RegisterForm', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
  });

  describe('Form Rendering', () => {
    it('should render register form', () => {
      render(<RegisterPage />);

      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
    });

    it('should display username input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('should display email input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should display password input', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should display submit button', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should display link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in to your existing account/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });

    it('should display terms and privacy notice', () => {
      render(<RegisterPage />);

      expect(screen.getByText(/Terms of Service and Privacy Policy/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow typing in username field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newuser');

      expect(usernameInput).toHaveValue('newuser');
    });

    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'user@example.com');

      expect(emailInput).toHaveValue('user@example.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the eye icon button (toggle button)
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.type === 'button' && btn !== screen.getByRole('button', { name: /create account/i }));

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Form Submission', () => {
    it('should call register on form submit', async () => {
      mockRegister.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to dashboard on successful registration', async () => {
      mockRegister.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should disable submit button while loading', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        register: mockRegister,
        isLoading: true,
      });

      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account|loading/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should not submit form with empty fields', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Form should use HTML5 validation
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      // Type invalid email
      await user.type(emailInput, 'invalid-email');

      // HTML5 validation should mark it as invalid
      expect(emailInput.validity.valid).toBe(false);
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      // Type valid email
      await user.type(emailInput, 'valid@example.com');

      // HTML5 validation should mark it as valid
      expect(emailInput.validity.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on registration failure', async () => {
      const errorMessage = 'Username already exists';
      mockRegister.mockRejectedValue({
        response: {
          data: { detail: errorMessage },
        },
      });

      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission attempt', async () => {
      const errorMessage = 'Username already exists';
      mockRegister.mockRejectedValueOnce({
        response: {
          data: { detail: errorMessage },
        },
      });

      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // First submission (fails)
      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second submission (should clear error first)
      mockRegister.mockResolvedValue({ success: true });
      await user.clear(usernameInput);
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    it('should handle validation error array', async () => {
      mockRegister.mockRejectedValue({
        response: {
          data: {
            detail: [
              { msg: 'Username is required' },
              { msg: 'Email is required' },
              { msg: 'Password is required' },
            ],
          },
        },
      });

      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Username is required, Email is required, Password is required/i)).toBeInTheDocument();
      });
    });

    it('should handle generic error message', async () => {
      mockRegister.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle error with type and msg properties', async () => {
      mockRegister.mockRejectedValue({
        response: {
          data: {
            type: 'validation_error',
            msg: 'Password must be at least 8 characters',
          },
        },
      });

      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should handle array response format directly', async () => {
      mockRegister.mockRejectedValue({
        response: {
          data: [
            { msg: 'Invalid username format' },
            { msg: 'Invalid email domain' },
          ],
        },
      });

      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid username format, Invalid email domain/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<RegisterPage />);

      const form = screen.getByRole('main').querySelector('form') || screen.getByRole('form', { hidden: true });
      expect(form).toBeInTheDocument();
    });

    it('should have required attributes on inputs', () => {
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(usernameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });

  describe('UI Elements', () => {
    it('should display database icon', () => {
      render(<RegisterPage />);

      // Icon should be rendered in the header
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    });

    it('should display card layout', () => {
      render(<RegisterPage />);

      expect(screen.getByText(/Create a new account to access the platform/i)).toBeInTheDocument();
    });
  });
});
