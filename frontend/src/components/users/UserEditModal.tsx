/**
 * User Edit Modal Component
 * Phase 8: Enhanced RBAC - User editing with role selector and confirmation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRoleSelector } from './UserRoleSelector';
import { RoleChangeConfirmationDialog } from './RoleChangeConfirmationDialog';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, updatedData: Partial<User>) => Promise<void>;
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const { permissions } = usePermissions();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
  });
  const [originalRole, setOriginalRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleConfirmation, setShowRoleConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const userRole = user.role || (user.is_superuser ? 'admin' : 'viewer');
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: userRole,
      });
      setOriginalRole(userRole);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isAdminUser = user.username === 'admin';
  const isDeveloperRole = permissions?.role === 'developer';
  const canEditRole = !isAdminUser || permissions?.role === 'admin';
  const roleChanged = formData.role !== originalRole;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // If role changed, show confirmation dialog
    if (roleChanged) {
      setShowRoleConfirmation(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setIsLoading(true);
    try {
      const updatedData: Partial<User> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      };

      // Only include role if it changed and user has permission
      if (roleChanged && canEditRole) {
        updatedData.role = formData.role as any;
      }

      await onSave(user.id, updatedData);
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setErrors({ submit: error.message || 'Failed to update user' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleConfirmed = async () => {
    setShowRoleConfirmation(false);
    await performSave();
  };

  const handleRoleConfirmationCancel = () => {
    setShowRoleConfirmation(false);
    // Revert role change
    setFormData({ ...formData, role: originalRole });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isAdminUser ? 'bg-purple-100' : 'bg-primary-100'
              )}>
                {isAdminUser ? (
                  <Shield className="h-5 w-5 text-purple-600" />
                ) : (
                  <UserIcon className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                <p className="text-sm text-gray-500">{user.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Admin User Warning */}
            {isAdminUser && isDeveloperRole && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-900 text-sm">Protected Admin User</h4>
                    <p className="text-xs text-purple-700 mt-1">
                      Developer role cannot modify the admin user's role or critical settings.
                      Only Admin role can make changes to the admin user.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                  disabled={isLoading}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="Enter email address"
                  disabled={isLoading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <UserRoleSelector
                  value={formData.role}
                  onChange={(role) => setFormData({ ...formData, role })}
                  disabled={isLoading || !canEditRole}
                  showDescription={true}
                />
                {!canEditRole && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Role cannot be modified for admin user by developer role</span>
                  </p>
                )}
              </div>

              {/* Role Change Warning */}
              {roleChanged && canEditRole && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm">Role Change Detected</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Changing from <strong>{originalRole}</strong> to <strong>{formData.role}</strong>.
                        This will modify the user's permissions immediately upon save.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      {showRoleConfirmation && (
        <RoleChangeConfirmationDialog
          user={user}
          oldRole={originalRole}
          newRole={formData.role}
          onConfirm={handleRoleConfirmed}
          onCancel={handleRoleConfirmationCancel}
        />
      )}
    </>
  );
}
