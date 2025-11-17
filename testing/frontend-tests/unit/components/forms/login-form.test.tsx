/**
 * Login Form Component Tests
 * Tests form validation, submission, error handling, and user interactions
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';
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

describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  describe('Form Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);

      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });

    it('should display username input', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('should display password input', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should display submit button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display link to register page', () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: /create a new account/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/auth/register');
    });
  });

  describe('Form Interactions', () => {
    it('should allow typing in username field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should call login on form submit', async () => {
      mockLogin.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should disable submit button while loading', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: true,
      });

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /signing in|loading/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should not submit form with empty fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Form should use HTML5 validation
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      const errorMessage = 'Invalid username or password';
      mockLogin.mockRejectedValue({
        response: {
          data: { detail: errorMessage },
        },
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission attempt', async () => {
      const errorMessage = 'Invalid username or password';
      mockLogin.mockRejectedValueOnce({
        response: {
          data: { detail: errorMessage },
        },
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First submission (fails)
      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second submission (should clear error first)
      mockLogin.mockResolvedValue({ success: true });
      await user.clear(usernameInput);
      await user.clear(passwordInput);
      await user.type(usernameInput, 'correctuser');
      await user.type(passwordInput, 'correctpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    it('should handle validation error array', async () => {
      mockLogin.mockRejectedValue({
        response: {
          data: {
            detail: [
              { msg: 'Username is required' },
              { msg: 'Password is required' },
            ],
          },
        },
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Username is required, Password is required/i)).toBeInTheDocument();
      });
    });

    it('should handle generic error message', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<LoginPage />);

      const form = screen.getByRole('form') || screen.getByRole('main').querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});
