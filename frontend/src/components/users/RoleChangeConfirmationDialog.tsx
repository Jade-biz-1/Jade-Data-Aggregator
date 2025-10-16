/**
 * Role Change Confirmation Dialog Component
 * Phase 8: Enhanced RBAC - Confirmation dialog for role changes with special handling for Developer role
 */

'use client';

import React from 'react';
import { AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface RoleChangeConfirmationDialogProps {
  user: User;
  oldRole: string;
  newRole: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const roleInfo: Record<string, { name: string; color: string; level: number; description: string }> = {
  admin: {
    name: 'Administrator',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    level: 6,
    description: 'Full system access with all permissions'
  },
  developer: {
    name: 'Developer',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    level: 5,
    description: 'Full access except admin user modifications (auto-expires in production)'
  },
  executive: {
    name: 'Executive',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    level: 4,
    description: 'View analytics, monitoring, and system reports'
  },
  designer: {
    name: 'Designer',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    level: 3,
    description: 'Design and manage pipelines, connectors, transformations'
  },
  executor: {
    name: 'Executor',
    color: 'bg-green-100 text-green-700 border-green-200',
    level: 2,
    description: 'Execute pipelines and view monitoring data'
  },
  viewer: {
    name: 'Viewer',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    level: 1,
    description: 'Read-only access to dashboards and data'
  },
};

export function RoleChangeConfirmationDialog({
  user,
  oldRole,
  newRole,
  onConfirm,
  onCancel
}: RoleChangeConfirmationDialogProps) {
  const oldRoleInfo = roleInfo[oldRole] || roleInfo.viewer;
  const newRoleInfo = roleInfo[newRole] || roleInfo.viewer;

  const isUpgrade = newRoleInfo.level > oldRoleInfo.level;
  const isDowngrade = newRoleInfo.level < oldRoleInfo.level;
  const isDeveloperRole = newRole === 'developer';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className={cn(
          'p-6 border-b',
          isDeveloperRole ? 'bg-yellow-50 border-yellow-200' : 'bg-amber-50 border-amber-200'
        )}>
          <div className="flex items-start space-x-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              isDeveloperRole ? 'bg-yellow-100' : 'bg-amber-100'
            )}>
              {isDeveloperRole ? (
                <Shield className="h-5 w-5 text-yellow-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                'text-lg font-bold',
                isDeveloperRole ? 'text-yellow-900' : 'text-amber-900'
              )}>
                Confirm Role Change
              </h3>
              <p className={cn(
                'text-sm mt-1',
                isDeveloperRole ? 'text-yellow-700' : 'text-amber-700'
              )}>
                You are about to {isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change'} the user's role
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {user.first_name?.[0] || user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Role Change Visualization */}
          <div className="flex items-center justify-center space-x-4">
            {/* Old Role */}
            <div className="flex-1 text-center">
              <div className={cn(
                'inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border mb-2',
                oldRoleInfo.color
              )}>
                {oldRoleInfo.name}
              </div>
              <p className="text-xs text-gray-500">Level {oldRoleInfo.level}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className={cn(
              'h-6 w-6 flex-shrink-0',
              isUpgrade ? 'text-green-600' : isDowngrade ? 'text-red-600' : 'text-gray-400'
            )} />

            {/* New Role */}
            <div className="flex-1 text-center">
              <div className={cn(
                'inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border mb-2',
                newRoleInfo.color
              )}>
                {newRoleInfo.name}
              </div>
              <p className="text-xs text-gray-500">Level {newRoleInfo.level}</p>
            </div>
          </div>

          {/* New Role Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">New Permissions:</h4>
            <p className="text-xs text-blue-700">{newRoleInfo.description}</p>
          </div>

          {/* Developer Role Warning */}
          {isDeveloperRole && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm">Developer Role Warning</h4>
                  <ul className="text-xs text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                    <li>This role has near-admin privileges</li>
                    <li>Cannot modify admin user settings</li>
                    <li><strong>Auto-expires after 24 hours in production</strong></li>
                    <li>Intended for debugging and emergency fixes only</li>
                    <li>All actions are logged for audit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Permission Impact Warning */}
          {isDowngrade && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Access Restriction</h4>
                  <p className="text-xs text-red-700 mt-1">
                    This user will lose access to features available to {oldRoleInfo.name} role.
                    Ensure this change is intentional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isUpgrade && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 text-sm">Permission Upgrade</h4>
                  <p className="text-xs text-green-700 mt-1">
                    This user will gain access to additional features and capabilities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              isDeveloperRole
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : isDowngrade
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            )}
          >
            Confirm Role Change
          </Button>
        </div>
      </div>
    </div>
  );
}
