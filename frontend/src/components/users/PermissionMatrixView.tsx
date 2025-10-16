/**
 * Permission Matrix Visualization Component
 * Phase 8: Enhanced RBAC - Visual matrix showing role permissions
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Shield, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionCategory {
  name: string;
  description: string;
  permissions: {
    name: string;
    description: string;
    key: string;
  }[];
}

const permissionCategories: PermissionCategory[] = [
  {
    name: 'Dashboard & System',
    description: 'Core system access and monitoring',
    permissions: [
      { name: 'View Dashboard', description: 'Access main dashboard', key: 'dashboard.view' },
      { name: 'System Status', description: 'View system health and status', key: 'system.status' },
    ]
  },
  {
    name: 'User Management',
    description: 'User administration and permissions',
    permissions: [
      { name: 'View Users', description: 'View user list', key: 'users.view' },
      { name: 'Create Users', description: 'Add new users', key: 'users.create' },
      { name: 'Edit Users', description: 'Modify user details', key: 'users.edit' },
      { name: 'Delete Users', description: 'Remove users', key: 'users.delete' },
      { name: 'Reset Passwords', description: 'Reset user passwords', key: 'users.reset_password' },
      { name: 'Activate/Deactivate', description: 'Change user status', key: 'users.activate' },
    ]
  },
  {
    name: 'Pipelines',
    description: 'Data pipeline management',
    permissions: [
      { name: 'View Pipelines', description: 'View pipeline list', key: 'pipelines.view' },
      { name: 'Create Pipelines', description: 'Design new pipelines', key: 'pipelines.create' },
      { name: 'Edit Pipelines', description: 'Modify pipelines', key: 'pipelines.edit' },
      { name: 'Delete Pipelines', description: 'Remove pipelines', key: 'pipelines.delete' },
      { name: 'Execute Pipelines', description: 'Run pipelines', key: 'pipelines.execute' },
    ]
  },
  {
    name: 'Connectors',
    description: 'Data source and destination connectors',
    permissions: [
      { name: 'View Connectors', description: 'View connector list', key: 'connectors.view' },
      { name: 'Create Connectors', description: 'Add new connectors', key: 'connectors.create' },
      { name: 'Edit Connectors', description: 'Modify connectors', key: 'connectors.edit' },
      { name: 'Delete Connectors', description: 'Remove connectors', key: 'connectors.delete' },
    ]
  },
  {
    name: 'Transformations',
    description: 'Data transformation rules',
    permissions: [
      { name: 'View Transformations', description: 'View transformation list', key: 'transformations.view' },
      { name: 'Create Transformations', description: 'Design transformations', key: 'transformations.create' },
      { name: 'Edit Transformations', description: 'Modify transformations', key: 'transformations.edit' },
      { name: 'Delete Transformations', description: 'Remove transformations', key: 'transformations.delete' },
    ]
  },
  {
    name: 'Analytics',
    description: 'Business intelligence and reports',
    permissions: [
      { name: 'View Analytics', description: 'Access analytics dashboard', key: 'analytics.view' },
      { name: 'Export Reports', description: 'Download analytics reports', key: 'analytics.export' },
    ]
  },
  {
    name: 'Monitoring',
    description: 'System monitoring and alerts',
    permissions: [
      { name: 'View Monitoring', description: 'Access monitoring dashboard', key: 'monitoring.view' },
      { name: 'Manage Alerts', description: 'Configure alert rules', key: 'monitoring.alerts' },
    ]
  },
  {
    name: 'Administration',
    description: 'System administration features',
    permissions: [
      { name: 'System Maintenance', description: 'Run cleanup and maintenance tasks', key: 'admin.maintenance' },
      { name: 'Activity Logs', description: 'View audit logs', key: 'admin.activity_logs' },
      { name: 'System Settings', description: 'Configure system settings', key: 'admin.settings' },
    ]
  },
];

const roles = [
  { id: 'viewer', name: 'Viewer', color: 'bg-gray-100 text-gray-700', level: 1 },
  { id: 'executor', name: 'Executor', color: 'bg-green-100 text-green-700', level: 2 },
  { id: 'designer', name: 'Designer', color: 'bg-blue-100 text-blue-700', level: 3 },
  { id: 'executive', name: 'Executive', color: 'bg-indigo-100 text-indigo-700', level: 4 },
  { id: 'developer', name: 'Developer', color: 'bg-yellow-100 text-yellow-700', level: 5 },
  { id: 'admin', name: 'Admin', color: 'bg-purple-100 text-purple-700', level: 6 },
];

// Permission matrix: true = has permission, false = no permission
const permissionMatrix: Record<string, Record<string, boolean>> = {
  // Dashboard & System
  'dashboard.view': { viewer: true, executor: true, designer: true, executive: true, developer: true, admin: true },
  'system.status': { viewer: true, executor: true, designer: true, executive: true, developer: true, admin: true },

  // User Management
  'users.view': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'users.create': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'users.edit': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'users.delete': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'users.reset_password': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'users.activate': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },

  // Pipelines
  'pipelines.view': { viewer: true, executor: true, designer: true, executive: true, developer: true, admin: true },
  'pipelines.create': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'pipelines.edit': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'pipelines.delete': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'pipelines.execute': { viewer: false, executor: true, designer: true, executive: false, developer: true, admin: true },

  // Connectors
  'connectors.view': { viewer: true, executor: true, designer: true, executive: true, developer: true, admin: true },
  'connectors.create': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'connectors.edit': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'connectors.delete': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },

  // Transformations
  'transformations.view': { viewer: true, executor: true, designer: true, executive: true, developer: true, admin: true },
  'transformations.create': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'transformations.edit': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },
  'transformations.delete': { viewer: false, executor: false, designer: true, executive: false, developer: true, admin: true },

  // Analytics
  'analytics.view': { viewer: false, executor: false, designer: false, executive: true, developer: true, admin: true },
  'analytics.export': { viewer: false, executor: false, designer: false, executive: true, developer: true, admin: true },

  // Monitoring
  'monitoring.view': { viewer: false, executor: true, designer: true, executive: true, developer: true, admin: true },
  'monitoring.alerts': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },

  // Administration
  'admin.maintenance': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'admin.activity_logs': { viewer: false, executor: false, designer: false, executive: false, developer: true, admin: true },
  'admin.settings': { viewer: false, executor: false, designer: false, executive: false, developer: false, admin: true },
};

export function PermissionMatrixView() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Dashboard & System']));
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => {
    setExpandedCategories(new Set(permissionCategories.map(c => c.name)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <Card className="shadow-large">
      <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-primary-600" />
            <div>
              <CardTitle className="text-lg">Permission Matrix</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Visual representation of role-based permissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1 rounded-md bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1 rounded-md bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Legend */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Role Hierarchy</p>
              <p className="text-xs text-blue-700 mt-1">
                Higher-level roles inherit all permissions from lower levels, plus additional capabilities.
                Click a role column to highlight it.
              </p>
            </div>
          </div>
        </div>

        {/* Role Headers */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-300 pb-4 mb-2">
          <div className="grid grid-cols-[300px_repeat(6,1fr)] gap-2">
            <div className="font-semibold text-gray-700 text-sm">Permission</div>
            {roles.map((role) => (
              <div
                key={role.id}
                className={cn(
                  'text-center cursor-pointer transition-all duration-200 rounded-lg p-2',
                  selectedRole === role.id && 'ring-2 ring-primary-500'
                )}
                onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
              >
                <div className={cn(
                  'inline-flex px-2 py-1 rounded-full text-xs font-medium mb-1',
                  role.color
                )}>
                  {role.name}
                </div>
                <div className="text-xs text-gray-500">L{role.level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Categories */}
        <div className="space-y-2">
          {permissionCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.name);

            return (
              <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {category.permissions.length} permissions
                  </span>
                </button>

                {/* Category Permissions */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {category.permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="grid grid-cols-[300px_repeat(6,1fr)] gap-2 p-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Permission Name */}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                          <span className="text-xs text-gray-500">{permission.description}</span>
                        </div>

                        {/* Role Permissions */}
                        {roles.map((role) => {
                          const hasPermission = permissionMatrix[permission.key]?.[role.id] || false;

                          return (
                            <div
                              key={role.id}
                              className={cn(
                                'flex items-center justify-center rounded-lg transition-all duration-200',
                                selectedRole === role.id && 'ring-2 ring-primary-300',
                                hasPermission ? 'bg-green-50' : 'bg-red-50'
                              )}
                            >
                              {hasPermission ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-red-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Developer Role Special Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 text-sm">Developer Role Restrictions</h4>
              <ul className="text-xs text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                <li>Cannot modify admin user (username: "admin")</li>
                <li>Auto-expires after 24 hours in production environments</li>
                <li>All actions are logged for security audit</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
