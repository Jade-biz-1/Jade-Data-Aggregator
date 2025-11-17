/**
 * Unit tests for usePermissions hook
 * Tests RBAC functionality, permission checks, and session management
 */

import { renderHook, waitFor } from '@testing-library/react'
import { usePermissions } from '@/hooks/usePermissions'

// Mock fetch globally
global.fetch = jest.fn()

describe('usePermissions', () => {
  const mockToken = 'test-token-123'

  const mockSessionData = {
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
    },
    permissions: {
      role: 'admin',
      permissions: [
        'manage_users',
        'execute_pipelines',
        'view_analytics',
        'system_maintenance',
        'read:users',
        'write:users',
      ],
      role_info: {
        title: 'Administrator',
        description: 'Full system access',
        level: 1,
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
  }

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    localStorage.clear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial Loading', () => {
    it('should start with loading state', () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => usePermissions())

      expect(result.current.loading).toBe(true)
      expect(result.current.permissions).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should set error when no auth token is present', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Not authenticated')
      expect(result.current.permissions).toBeNull()
    })
  })

  describe('Fetching Permissions', () => {
    it('should fetch and set session data successfully', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.permissions).toEqual(mockSessionData.permissions)
      expect(result.current.navigation).toEqual(mockSessionData.navigation)
      expect(result.current.features).toEqual(mockSessionData.features)
      expect(result.current.error).toBeNull()
    })

    it('should call the correct API endpoint with auth header', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })

      renderHook(() => usePermissions())

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/users/me/session-info',
          {
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        )
      })
    })

    it('should handle API errors gracefully', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch session information')
      expect(result.current.permissions).toBeNull()
    })

    it('should handle network errors', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('Permission Checks', () => {
    beforeEach(async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })
    })

    it('should check single permission correctly', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission('manage_users')).toBe(true)
      expect(result.current.hasPermission('nonexistent_permission')).toBe(false)
    })

    it('should check if user has any permission from a list', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(
        result.current.hasAnyPermission(['manage_users', 'nonexistent'])
      ).toBe(true)
      expect(
        result.current.hasAnyPermission(['nonexistent1', 'nonexistent2'])
      ).toBe(false)
    })

    it('should check if user has all permissions from a list', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(
        result.current.hasAllPermissions(['manage_users', 'execute_pipelines'])
      ).toBe(true)
      expect(
        result.current.hasAllPermissions(['manage_users', 'nonexistent'])
      ).toBe(false)
    })
  })

  describe('Route Access', () => {
    beforeEach(async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })
    })

    it('should check route access correctly', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canAccessRoute('/dashboard')).toBe(true)
      expect(result.current.canAccessRoute('/users')).toBe(true)
      expect(result.current.canAccessRoute('/admin/maintenance')).toBe(true)
    })

    it('should return true for unmapped routes', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canAccessRoute('/unknown-route')).toBe(true)
    })
  })

  describe('Role Checks', () => {
    it('should identify admin role correctly', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin()).toBe(true)
      expect(result.current.isDeveloper()).toBe(false)
      expect(result.current.isViewer()).toBe(false)
    })

    it('should identify developer role correctly', async () => {
      const developerData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'developer' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => developerData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isDeveloper()).toBe(true)
      expect(result.current.isAdmin()).toBe(false)
    })

    it('should identify designer role correctly', async () => {
      const designerData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'designer' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => designerData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isDesigner()).toBe(true)
      expect(result.current.isAdmin()).toBe(false)
    })

    it('should identify executor role correctly', async () => {
      const executorData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'executor' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => executorData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isExecutor()).toBe(true)
      expect(result.current.isAdmin()).toBe(false)
    })

    it('should identify viewer role correctly', async () => {
      const viewerData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'viewer' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => viewerData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isViewer()).toBe(true)
      expect(result.current.isAdmin()).toBe(false)
    })

    it('should identify executive role correctly', async () => {
      const executiveData = {
        ...mockSessionData,
        permissions: { ...mockSessionData.permissions, role: 'executive' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => executiveData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isExecutive()).toBe(true)
      expect(result.current.isAdmin()).toBe(false)
    })
  })

  describe('Feature Permission Helpers', () => {
    beforeEach(async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })
    })

    it('should check user management permission', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canManageUsers()).toBe(true)
    })

    it('should check pipeline execution permission', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canExecutePipelines()).toBe(true)
    })

    it('should check analytics view permission', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canViewAnalytics()).toBe(true)
    })

    it('should check system management permission', async () => {
      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.canManageSystem()).toBe(true)
    })
  })

  describe('Developer Role Warning', () => {
    it('should check for developer role warning in production', async () => {
      const developerData = {
        ...mockSessionData,
        user: { ...mockSessionData.user, role: 'developer' },
        permissions: { ...mockSessionData.permissions, role: 'developer' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => developerData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            is_production: true,
            allowed: true,
            expires_at: '2025-12-31T23:59:59Z',
          }),
        })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await waitFor(() => {
        expect(result.current.devWarning.isActive).toBe(true)
      })

      expect(result.current.devWarning.message).toBe(
        'Developer role is active in PRODUCTION environment'
      )
      expect(result.current.devWarning.expiresAt).toBe('2025-12-31T23:59:59Z')
    })

    it('should not show warning for developer role in non-production', async () => {
      const developerData = {
        ...mockSessionData,
        user: { ...mockSessionData.user, role: 'developer' },
        permissions: { ...mockSessionData.permissions, role: 'developer' },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => developerData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            is_production: false,
            allowed: true,
          }),
        })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Warning should not be active for non-production
      expect(result.current.devWarning.isActive).toBe(false)
    })
  })

  describe('Refresh Functionality', () => {
    it('should refetch permissions when refresh is called', async () => {
      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Call refresh
      result.current.refresh()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty permissions array', async () => {
      const emptyPermissionsData = {
        ...mockSessionData,
        permissions: {
          ...mockSessionData.permissions,
          permissions: [],
        },
      }

      localStorage.setItem('auth_token', mockToken)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => emptyPermissionsData,
      })

      const { result } = renderHook(() => usePermissions())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission('any_permission')).toBe(false)
      expect(result.current.canManageUsers()).toBe(false)
    })

    it('should return false for permission checks when permissions is null', () => {
      localStorage.clear() // No token, so permissions will be null

      const { result } = renderHook(() => usePermissions())

      expect(result.current.hasPermission('any_permission')).toBe(false)
      expect(result.current.hasAnyPermission(['perm1', 'perm2'])).toBe(false)
      expect(result.current.hasAllPermissions(['perm1', 'perm2'])).toBe(false)
    })

    it('should return false for route checks when navigation is null', () => {
      localStorage.clear() // No token, so navigation will be null

      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAccessRoute('/dashboard')).toBe(false)
    })
  })
})
