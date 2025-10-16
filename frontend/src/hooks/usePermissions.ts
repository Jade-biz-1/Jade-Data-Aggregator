/**
 * Custom hook for managing user permissions and role-based access
 * Phase 8: Enhanced RBAC implementation
 */

import { useState, useEffect } from 'react';

export interface UserPermissions {
  role: string;
  permissions: string[];
  role_info: {
    title: string;
    description: string;
    level: number;
    can_manage_admin_user?: boolean;
    warning?: string;
  };
}

export interface NavigationPermissions {
  dashboard: boolean;
  pipelines: boolean;
  connectors: boolean;
  transformations: boolean;
  monitoring: boolean;
  analytics: boolean;
  users: boolean;
  settings: boolean;
  maintenance: boolean;
  activity_logs: boolean;
}

export interface FeatureAccess {
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    activate: boolean;
    reset_password: boolean;
  };
  pipelines: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    execute: boolean;
  };
  connectors: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    test: boolean;
  };
  transformations: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  monitoring: {
    view: boolean;
    view_logs: boolean;
    view_alerts: boolean;
    manage_alerts: boolean;
  };
  analytics: {
    view: boolean;
    create_reports: boolean;
    export: boolean;
  };
  system: {
    settings: boolean;
    maintenance: boolean;
    view_activity_logs: boolean;
    cleanup: boolean;
  };
  files: {
    view: boolean;
    upload: boolean;
    delete: boolean;
  };
}

export interface DeveloperRoleWarning {
  isActive: boolean;
  message?: string;
  expiresAt?: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [navigation, setNavigation] = useState<NavigationPermissions | null>(null);
  const [features, setFeatures] = useState<FeatureAccess | null>(null);
  const [devWarning, setDevWarning] = useState<DeveloperRoleWarning>({ isActive: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch all session info in a single API call (OPTIMIZED - Phase 9A-2)
      // Replaces 3 separate calls: /me/permissions, /navigation/items, /features/access
      const sessionResponse = await fetch('/api/v1/users/me/session-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session information');
      }

      const sessionData = await sessionResponse.json();

      // Set all data from single response
      setPermissions(sessionData.permissions);
      setNavigation(sessionData.navigation);
      setFeatures(sessionData.features);

      // Check for developer role warning
      if (sessionData.user.role === 'developer') {
        checkDeveloperRoleWarning();
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDeveloperRoleWarning = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/admin/settings/dev-role-production', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_production && data.allowed) {
          setDevWarning({
            isActive: true,
            message: 'Developer role is active in PRODUCTION environment',
            expiresAt: data.expires_at,
          });
        }
      }
    } catch (err) {
      console.error('Error checking developer role warning:', err);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions.permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    return permissionList.some(p => permissions.permissions.includes(p));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!permissions) return false;
    return permissionList.every(p => permissions.permissions.includes(p));
  };

  const canAccessRoute = (route: string): boolean => {
    if (!navigation) return false;

    const routeMap: Record<string, keyof NavigationPermissions> = {
      '/dashboard': 'dashboard',
      '/pipelines': 'pipelines',
      '/connectors': 'connectors',
      '/transformations': 'transformations',
      '/monitoring': 'monitoring',
      '/analytics': 'analytics',
      '/users': 'users',
      '/settings': 'settings',
      '/admin/maintenance': 'maintenance',
      '/admin/activity-logs': 'activity_logs',
    };

    const navKey = routeMap[route];
    return navKey ? navigation[navKey] : true;
  };

  const isAdmin = (): boolean => {
    return permissions?.role === 'admin';
  };

  const isDeveloper = (): boolean => {
    return permissions?.role === 'developer';
  };

  const isDesigner = (): boolean => {
    return permissions?.role === 'designer';
  };

  const isExecutor = (): boolean => {
    return permissions?.role === 'executor';
  };

  const isViewer = (): boolean => {
    return permissions?.role === 'viewer';
  };

  const isExecutive = (): boolean => {
    return permissions?.role === 'executive';
  };

  const canManageUsers = (): boolean => {
    return hasPermission('manage_users');
  };

  const canExecutePipelines = (): boolean => {
    return hasPermission('execute_pipelines');
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('view_analytics');
  };

  const canManageSystem = (): boolean => {
    return hasPermission('system_maintenance');
  };

  return {
    permissions,
    navigation,
    features,
    devWarning,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isAdmin,
    isDeveloper,
    isDesigner,
    isExecutor,
    isViewer,
    isExecutive,
    canManageUsers,
    canExecutePipelines,
    canViewAnalytics,
    canManageSystem,
    refresh: fetchPermissions,
  };
}
