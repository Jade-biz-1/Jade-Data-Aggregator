/**
 * User Role Selector Component
 * Phase 8: Enhanced RBAC - 6-role system selector
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Role {
  role: string;
  title: string;
  description: string;
  level: number;
}

interface RolesResponse {
  roles: Role[];
}

interface UserRoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showDescription?: boolean;
}

export function UserRoleSelector({
  value,
  onChange,
  disabled = false,
  className,
  showDescription = true,
}: UserRoleSelectorProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/v1/roles', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const data: RolesResponse = await response.json();
      setRoles(data.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(role => role.role === value);

  const getRoleBadgeColor = (roleValue: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      developer: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      designer: 'bg-blue-100 text-blue-700 border-blue-200',
      executor: 'bg-green-100 text-green-700 border-green-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200',
      executive: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[roleValue] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        <span className="text-sm">Loading roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            'appearance-none cursor-pointer',
            'transition-all duration-200'
          )}
        >
          <option value="">Select a role...</option>
          {roles.map((role) => (
            <option key={role.role} value={role.role}>
              {role.title} - {role.description}
            </option>
          ))}
        </select>
        <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {showDescription && selectedRole && (
        <div className={cn(
          'p-3 rounded-lg border',
          getRoleBadgeColor(selectedRole.role)
        )}>
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{selectedRole.title}</p>
              <p className="text-xs mt-1 opacity-90">{selectedRole.description}</p>
              <p className="text-xs mt-1 font-semibold">Level: {selectedRole.level}</p>
            </div>
          </div>
        </div>
      )}

      {value === 'developer' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg
              className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-xs font-medium text-yellow-800">Production Warning</p>
              <p className="text-xs text-yellow-700 mt-1">
                Developer role is restricted in production environments. Access expires after 24 hours by default.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
