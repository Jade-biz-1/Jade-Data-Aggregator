/**
 * User Actions Menu Component
 * Phase 8: Enhanced RBAC - Admin user protection and role-based actions
 */

'use client';

import React, { useState } from 'react';
import { MoreVertical, Edit, Lock, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

interface UserActionsMenuProps {
  user: User;
  currentUser: User;
  onAction: (action: string, user: User) => void;
  className?: string;
}

export function UserActionsMenu({ user, currentUser, onAction, className }: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { features, permissions } = usePermissions();

  const isAdminUser = user.username === 'admin';
  const isCurrentUser = user.id === currentUser.id;
  const isDeveloperRole = permissions?.role === 'developer';
  const isAdminRole = permissions?.role === 'admin';

  // Check if current user can modify this user
  const canModify = features?.users?.edit && (!isAdminUser || isAdminRole);
  const canActivateDeactivate = canModify && !isCurrentUser;
  const canResetPassword = features?.users?.reset_password && (!isAdminUser || isAdminRole);
  const canDelete = features?.users?.delete && !isAdminUser && !isCurrentUser;

  const handleAction = (action: string) => {
    setIsOpen(false);
    onAction(action, user);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          isOpen && 'bg-gray-100'
        )}
        title="User actions"
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40 py-2">
            {/* Edit User */}
            <button
              onClick={() => handleAction('edit')}
              disabled={!canModify}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150',
                canModify
                  ? 'hover:bg-gray-50 text-gray-700'
                  : 'opacity-50 cursor-not-allowed text-gray-400'
              )}
            >
              <Edit className="h-4 w-4" />
              <span className="text-sm">Edit User</span>
              {isAdminUser && !isAdminRole && (
                <Shield className="h-4 w-4 ml-auto text-purple-600" />
              )}
            </button>

            {/* Activate/Deactivate */}
            {user.is_active ? (
              <button
                onClick={() => handleAction('deactivate')}
                disabled={!canActivateDeactivate}
                className={cn(
                  'w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150',
                  canActivateDeactivate
                    ? 'hover:bg-gray-50 text-gray-700'
                    : 'opacity-50 cursor-not-allowed text-gray-400'
                )}
              >
                <UserX className="h-4 w-4" />
                <span className="text-sm">Deactivate</span>
                {isCurrentUser && (
                  <span className="text-xs text-gray-500 ml-auto">(You)</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleAction('activate')}
                disabled={!canActivateDeactivate}
                className={cn(
                  'w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150',
                  canActivateDeactivate
                    ? 'hover:bg-gray-50 text-gray-700'
                    : 'opacity-50 cursor-not-allowed text-gray-400'
                )}
              >
                <UserCheck className="h-4 w-4" />
                <span className="text-sm">Activate</span>
              </button>
            )}

            {/* Divider */}
            <div className="my-2 border-t border-gray-200" />

            {/* Reset Password */}
            <button
              onClick={() => handleAction('reset-password')}
              disabled={!canResetPassword}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150',
                canResetPassword
                  ? 'hover:bg-yellow-50 text-yellow-700'
                  : 'opacity-50 cursor-not-allowed text-gray-400'
              )}
            >
              <Lock className="h-4 w-4" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Reset Password</span>
                {isAdminUser && (
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                    {!isAdminRole && (
                      <span className="text-xs text-red-500">(Blocked)</span>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-gray-200" />

            {/* Delete User */}
            <button
              onClick={() => handleAction('delete')}
              disabled={!canDelete}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150',
                canDelete
                  ? 'hover:bg-red-50 text-red-700'
                  : 'opacity-50 cursor-not-allowed text-gray-400'
              )}
            >
              <Trash2 className="h-4 w-4" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Delete User</span>
                {(isAdminUser || isCurrentUser) && (
                  <span className="text-xs text-red-500">
                    {isAdminUser ? '(Protected)' : '(You)'}
                  </span>
                )}
              </div>
            </button>

            {/* Protection Notice */}
            {isAdminUser && isDeveloperRole && (
              <div className="mt-2 mx-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                <div className="flex items-start space-x-1">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p>Admin user is protected from developer role modifications.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
