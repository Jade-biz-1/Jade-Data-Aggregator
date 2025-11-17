/**
 * usePermissions Hook Tests
 * Tests RBAC functionality, role checking, and permission management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('usePermissions', () => {
  const mockSessionData = {
    permissions: {
      role: 'admin',
      permissions: [
        'manage_users',
        'create_pipelines',
        'edit_pipelines',
        'delete_pipelines',
        'execute_pipelines',
        'view_analytics',
        'system_maintenance',
      ],
      role_info: {
        title: 'Administrator',
        description: 'Full system access',
        level: 100,
      },
    },
    navigation: {
      dashboard: true,
      pipelines: true,
      connectors: true,
      transformations: true,
      monitoring: true,
      analytics: true,
      users: true,
      settings: true,
      maintenance: true,
      activity_logs: true,
    },
    features: {
      users: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        activate: true,
        reset_password: true,
      },
      pipelines: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        execute: true,
      },
      connectors: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        test: true,
      },
      transformations: {
        view: true,
        create: true,
        edit: true,
        delete: true,
      },
      monitoring: {
        view: true,
        view_logs: true,
        view_alerts: true,
        manage_alerts: true,
      },
      analytics: {
        view: true,
        create_reports: true,
        export: true,
      },
      system: {
        settings: true,
        maintenance: true,
        view_activity_logs: true,
        cleanup: true,
      },
      files: {
        view: true,
        upload: true,
        delete: true,
      },
    },
    user: {
      role: 'admin',
    },
  };

  const mockViewerData = {
    ...mockSessionData,
    permissions: {
      role: 'viewer',
      permissions: ['view_pipelines', 'view_connectors', 'view_analytics'],
      role_info: {
        title: 'Viewer',
        description: 'Read-only access',
        level: 10,
      },
    },
    user: {
      role: 'viewer',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSessionData,
    });
  });

  describe('Initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.loading).toBe(true);
      expect(result.current.permissions).toBeNull();
      expect(result.current.navigation).toBeNull();
      expect(result.current.features).toBeNull();
    });

    it('should fetch session data on mount', async () => {
      renderHook(() => usePermissions());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/users/me/session-info',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer test-token',
            },
          })
        );
      });
    });

    it('should set permissions after successful fetch', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockSessionData.permissions);
      expect(result.current.navigation).toEqual(mockSessionData.navigation);
      expect(result.current.features).toEqual(mockSessionData.features);
      expect(result.current.error).toBeNull();
    });

    it('should handle missing token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Not authenticated');
      expect(result.current.permissions).toBeNull();
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle failed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Permission Checking', () => {
    it('should check if user has specific permission', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('manage_users')).toBe(true);
      expect(result.current.hasPermission('create_pipelines')).toBe(true);
      expect(result.current.hasPermission('non_existent_permission')).toBe(false);
    });

    it('should check if user has any of multiple permissions', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission(['manage_users', 'view_analytics'])).toBe(true);
      expect(result.current.hasAnyPermission(['non_existent_1', 'view_analytics'])).toBe(true);
      expect(result.current.hasAnyPermission(['non_existent_1', 'non_existent_2'])).toBe(false);
    });

    it('should check if user has all permissions', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions(['manage_users', 'view_analytics'])).toBe(true);
      expect(result.current.hasAllPermissions(['manage_users', 'non_existent'])).toBe(false);
    });

    it('should return false when permissions not loaded', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasPermission('manage_users')).toBe(false);
      expect(result.current.hasAnyPermission(['manage_users'])).toBe(false);
      expect(result.current.hasAllPermissions(['manage_users'])).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('should correctly identify admin role', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.isDeveloper()).toBe(false);
      expect(result.current.isDesigner()).toBe(false);
      expect(result.current.isExecutor()).toBe(false);
      expect(result.current.isViewer()).toBe(false);
      expect(result.current.isExecutive()).toBe(false);
    });

    it('should correctly identify viewer role', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockViewerData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isViewer()).toBe(true);
    });

    it('should correctly identify developer role', async () => {
      const devData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'developer' },
        user: { role: 'developer' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => devData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isDeveloper()).toBe(true);
      expect(result.current.isAdmin()).toBe(false);
    });

    it('should correctly identify designer role', async () => {
      const designerData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'designer' },
        user: { role: 'designer' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => designerData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isDesigner()).toBe(true);
    });

    it('should correctly identify executor role', async () => {
      const executorData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'executor' },
        user: { role: 'executor' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => executorData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isExecutor()).toBe(true);
    });

    it('should correctly identify executive role', async () => {
      const executiveData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'executive' },
        user: { role: 'executive' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => executiveData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isExecutive()).toBe(true);
    });
  });

  describe('Route Access', () => {
    it('should allow access to permitted routes', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessRoute('/dashboard')).toBe(true);
      expect(result.current.canAccessRoute('/pipelines')).toBe(true);
      expect(result.current.canAccessRoute('/users')).toBe(true);
      expect(result.current.canAccessRoute('/admin/maintenance')).toBe(true);
    });

    it('should deny access to unpermitted routes for viewer', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockViewerData,
          navigation: {
            ...mockViewerData.navigation,
            users: false,
            settings: false,
            maintenance: false,
          },
        }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessRoute('/users')).toBe(false);
      expect(result.current.canAccessRoute('/settings')).toBe(false);
      expect(result.current.canAccessRoute('/admin/maintenance')).toBe(false);
    });

    it('should allow access to unmapped routes by default', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAccessRoute('/some/unknown/route')).toBe(true);
    });

    it('should return false when navigation not loaded', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessRoute('/dashboard')).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    it('should check if user can manage users', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canManageUsers()).toBe(true);
    });

    it('should check if user can execute pipelines', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canExecutePipelines()).toBe(true);
    });

    it('should check if user can view analytics', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canViewAnalytics()).toBe(true);
    });

    it('should check if user can manage system', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canManageSystem()).toBe(true);
    });

    it('should return false for viewer without permissions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockViewerData,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canManageUsers()).toBe(false);
      expect(result.current.canManageSystem()).toBe(false);
    });
  });

  describe('Developer Role Warning', () => {
    it('should check for developer role warning in production', async () => {
      const devProductionData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'developer' },
        user: { role: 'developer' },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => devProductionData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            is_production: true,
            allowed: true,
            expires_at: '2025-12-31T23:59:59Z',
          }),
        });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.devWarning.isActive).toBe(true);
      });

      expect(result.current.devWarning.message).toBe('Developer role is active in PRODUCTION environment');
      expect(result.current.devWarning.expiresAt).toBe('2025-12-31T23:59:59Z');
    });

    it('should not show warning for non-developer roles', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.devWarning.isActive).toBe(false);
    });

    it('should handle dev warning check error gracefully', async () => {
      const devData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'developer' },
        user: { role: 'developer' },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => devData,
        })
        .mockRejectedValueOnce(new Error('Dev warning check failed'));

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not crash, just log error
      expect(result.current.devWarning.isActive).toBe(false);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh method', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.refresh).toBeDefined();
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should refetch permissions when refresh is called', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Feature Access', () => {
    it('should provide feature access data', async () => {
      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.features).toBeDefined();
      expect(result.current.features?.users.view).toBe(true);
      expect(result.current.features?.pipelines.create).toBe(true);
      expect(result.current.features?.connectors.test).toBe(true);
    });
  });
});
