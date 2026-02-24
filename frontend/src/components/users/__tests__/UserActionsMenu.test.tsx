import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserActionsMenu } from '../UserActionsMenu';

// Mock usePermissions with admin role (full access)
const mockUsePermissions = jest.fn();
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const adminPermissions = {
  permissions: { role: 'admin' },
  features: {
    users: { edit: true, delete: true, reset_password: true },
  },
};

const developerPermissions = {
  permissions: { role: 'developer' },
  features: {
    users: { edit: true, delete: true, reset_password: true },
  },
};

const activeUser = {
  id: 2,
  username: 'jdoe',
  email: 'jdoe@example.com',
  role: 'viewer',
  is_active: true,
};

const inactiveUser = { ...activeUser, is_active: false };
const adminUser = { ...activeUser, username: 'admin', role: 'admin' };

const currentUser = {
  id: 99,
  username: 'currentadmin',
  email: 'admin@example.com',
  role: 'admin',
  is_active: true,
};

const defaultProps = {
  user: activeUser,
  currentUser,
  onAction: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePermissions.mockReturnValue(adminPermissions);
});

describe('UserActionsMenu', () => {
  describe('toggle behavior', () => {
    it('renders the more-vertical icon button', () => {
      render(<UserActionsMenu {...defaultProps} />);
      expect(screen.getByTitle('User actions')).toBeInTheDocument();
    });

    it('menu is hidden initially', () => {
      render(<UserActionsMenu {...defaultProps} />);
      expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
    });

    it('opens the menu on button click', () => {
      render(<UserActionsMenu {...defaultProps} />);
      fireEvent.click(screen.getByTitle('User actions'));
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('closes the menu on backdrop click', () => {
      render(<UserActionsMenu {...defaultProps} />);
      fireEvent.click(screen.getByTitle('User actions'));
      expect(screen.getByText('Edit User')).toBeInTheDocument();
      // Click the backdrop (fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0.z-30') as HTMLElement;
      if (backdrop) fireEvent.click(backdrop);
      expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
    });
  });

  describe('menu items - active user', () => {
    beforeEach(() => {
      render(<UserActionsMenu {...defaultProps} />);
      fireEvent.click(screen.getByTitle('User actions'));
    });

    it('shows "Edit User" option', () => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('shows "Deactivate" option for active user', () => {
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    it('shows "Reset Password" option', () => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('shows "Delete User" option', () => {
      expect(screen.getByText('Delete User')).toBeInTheDocument();
    });
  });

  describe('menu items - inactive user', () => {
    it('shows "Activate" option for inactive user', () => {
      render(<UserActionsMenu {...defaultProps} user={inactiveUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      expect(screen.getByText('Activate')).toBeInTheDocument();
    });
  });

  describe('action callbacks', () => {
    it('calls onAction("edit", user) when Edit User clicked', () => {
      const onAction = jest.fn();
      render(<UserActionsMenu {...defaultProps} onAction={onAction} />);
      fireEvent.click(screen.getByTitle('User actions'));
      fireEvent.click(screen.getByText('Edit User'));
      expect(onAction).toHaveBeenCalledWith('edit', activeUser);
    });

    it('calls onAction("deactivate", user) when Deactivate clicked', () => {
      const onAction = jest.fn();
      render(<UserActionsMenu {...defaultProps} onAction={onAction} />);
      fireEvent.click(screen.getByTitle('User actions'));
      fireEvent.click(screen.getByText('Deactivate'));
      expect(onAction).toHaveBeenCalledWith('deactivate', activeUser);
    });

    it('calls onAction("reset-password", user) when Reset Password clicked', () => {
      const onAction = jest.fn();
      render(<UserActionsMenu {...defaultProps} onAction={onAction} />);
      fireEvent.click(screen.getByTitle('User actions'));
      fireEvent.click(screen.getByText('Reset Password'));
      expect(onAction).toHaveBeenCalledWith('reset-password', activeUser);
    });

    it('calls onAction("delete", user) when Delete User clicked', () => {
      const onAction = jest.fn();
      render(<UserActionsMenu {...defaultProps} onAction={onAction} />);
      fireEvent.click(screen.getByTitle('User actions'));
      fireEvent.click(screen.getByText('Delete User'));
      expect(onAction).toHaveBeenCalledWith('delete', activeUser);
    });

    it('closes menu after action', () => {
      render(<UserActionsMenu {...defaultProps} />);
      fireEvent.click(screen.getByTitle('User actions'));
      fireEvent.click(screen.getByText('Edit User'));
      expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
    });
  });

  describe('admin user protection', () => {
    it('disables Delete User button for admin user', () => {
      render(<UserActionsMenu {...defaultProps} user={adminUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      const deleteButton = screen.getByText('Delete User').closest('button');
      expect(deleteButton).toBeDisabled();
    });

    it('shows "(Protected)" label for admin user delete button', () => {
      render(<UserActionsMenu {...defaultProps} user={adminUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      expect(screen.getByText('(Protected)')).toBeInTheDocument();
    });

    it('shows protection notice for admin user when current user is developer', () => {
      mockUsePermissions.mockReturnValue(developerPermissions);
      render(<UserActionsMenu {...defaultProps} user={adminUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      expect(screen.getByText(/Admin user is protected from developer role modifications/i)).toBeInTheDocument();
    });
  });

  describe('self-protection', () => {
    it('disables Deactivate when user is the current user', () => {
      const selfUser = { ...activeUser, id: 99 }; // same id as currentUser
      render(<UserActionsMenu {...defaultProps} user={selfUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      const deactivateButton = screen.getByText('Deactivate').closest('button');
      expect(deactivateButton).toBeDisabled();
    });

    it('shows "(You)" label when user is the current user', () => {
      const selfUser = { ...activeUser, id: 99 };
      render(<UserActionsMenu {...defaultProps} user={selfUser} />);
      fireEvent.click(screen.getByTitle('User actions'));
      // Both Deactivate and Delete buttons show "(You)" for self-user
      expect(screen.getAllByText('(You)').length).toBeGreaterThanOrEqual(1);
    });
  });
});
