'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User as UserIcon,
  Plus,
  Search,
  Mail,
  Lock,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  KeyRound,
  Shield,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { User as UserType } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { UserActionsMenu } from '@/components/users/UserActionsMenu';
import { UserEditModal } from '@/components/users/UserEditModal';
import { PermissionMatrixView } from '@/components/users/PermissionMatrixView';
import { EnvironmentBadge, DeveloperInProductionWarning } from '@/components/users/EnvironmentBadge';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const { features, permissions, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Fetch current user first
        const current = await apiClient.getCurrentUser();
        setCurrentUser(current);

        // Now using the real users API endpoint
        const allUsers = await apiClient.getUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Fallback to current user if the users endpoint fails
        try {
          const current = await apiClient.getCurrentUser();
          setCurrentUser(current);
          const fallbackUsers = [current];
          setUsers(fallbackUsers);
          setFilteredUsers(fallbackUsers);
        } catch (fallbackError) {
          console.error('Error fetching current user:', fallbackError);
          setUsers([]);
          setFilteredUsers([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRole = user.role || (user.is_superuser ? 'admin' : 'viewer');
        return userRole === roleFilter;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      }
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleEditUser = (id: number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setEditingUser(user);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveUser = async (userId: number, updatedData: Partial<UserType>) => {
    try {
      const updatedUser = await apiClient.updateUser(userId, updatedData);
      // Update the user in both lists
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      setFilteredUsers(filteredUsers.map(u => u.id === userId ? updatedUser : u));
      // Show success message
      alert('User updated successfully');
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        setFilteredUsers(filteredUsers.filter(u => u.id !== id));
        alert('User deleted successfully');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Failed to delete user');
      }
    }
  };

  const handleActivateUser = async (id: number) => {
    if (confirm('Are you sure you want to activate this user?')) {
      try {
        await apiClient.activateUser(id);
        // Update the user in the list
        setUsers(users.map(u => u.id === id ? { ...u, is_active: true } : u));
        setFilteredUsers(filteredUsers.map(u => u.id === id ? { ...u, is_active: true } : u));
        alert('User activated successfully');
      } catch (error: any) {
        console.error('Error activating user:', error);
        alert(error.message || 'Failed to activate user');
      }
    }
  };

  const handleDeactivateUser = async (id: number) => {
    if (confirm('Are you sure you want to deactivate this user? They will no longer be able to access the application.')) {
      try {
        await apiClient.deactivateUser(id);
        // Update the user in the list
        setUsers(users.map(u => u.id === id ? { ...u, is_active: false } : u));
        setFilteredUsers(filteredUsers.map(u => u.id === id ? { ...u, is_active: false } : u));
        alert('User deactivated successfully');
      } catch (error: any) {
        console.error('Error deactivating user:', error);
        alert(error.message || 'Failed to deactivate user');
      }
    }
  };

  const handleResetPassword = async (user: UserType) => {
    // Check if it's the admin user
    const isAdminUser = user.username === 'admin';

    if (isAdminUser) {
      if (permissions?.role !== 'admin') {
        alert('❌ Developer role cannot reset admin user password.\n\nAdmin user is protected from developer role modifications.');
        return;
      }

      alert('⚠️ Admin Password Reset Blocked\n\nAdmin user password cannot be reset via this method.\nPlease use "Change Password" functionality instead.');
      return;
    }

    if (confirm('Are you sure you want to reset this user\'s password? A temporary password will be generated.')) {
      try {
        const result = await apiClient.resetUserPassword(user.id);
        // Show the temporary password to the admin
        alert(
          `Password reset successfully!\n\n` +
          `Temporary password: ${result.temporary_password}\n\n` +
          `Please provide this password to the user. They should change it immediately upon login.`
        );
      } catch (error: any) {
        console.error('Error resetting password:', error);
        alert(error.message || 'Failed to reset password');
      }
    }
  };

  const handleUserAction = async (action: string, user: UserType) => {
    switch (action) {
      case 'edit':
        handleEditUser(user.id);
        break;
      case 'activate':
        handleActivateUser(user.id);
        break;
      case 'deactivate':
        handleDeactivateUser(user.id);
        break;
      case 'reset-password':
        await handleResetPassword(user);
        break;
      case 'delete':
        await handleDeleteUser(user.id);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRoleDisplayInfo = (user: UserType) => {
    const role = user.role || (user.is_superuser ? 'admin' : 'viewer');
    const roleInfo: Record<string, { name: string; color: string }> = {
      admin: { name: 'Administrator', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      developer: { name: 'Developer', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      designer: { name: 'Designer', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      executor: { name: 'Executor', color: 'bg-green-100 text-green-700 border-green-200' },
      viewer: { name: 'Viewer', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      executive: { name: 'Executive', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    };
    return roleInfo[role] || { name: role, color: 'bg-gray-100 text-gray-700' };
  };

  const isAdminUser = (username: string) => username === 'admin';

  const getRoleCount = (role: string) => {
    return users.filter(u => {
      const userRole = u.role || (u.is_superuser ? 'admin' : 'viewer');
      return userRole === role;
    }).length;
  };

  // Check permission to view this page
  if (permissionsLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.users?.view) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 text-center max-w-md">
            You don't have permission to view user management.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <EnvironmentBadge
                environment={process.env.NEXT_PUBLIC_ENV || 'development'}
                size="sm"
              />
            </div>
            <p className="text-gray-600">
              Manage platform users and their roles - 6-role RBAC system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPermissionMatrix(!showPermissionMatrix)}
            >
              <Shield className="h-4 w-4 mr-2" />
              {showPermissionMatrix ? 'Hide' : 'View'} Permissions
            </Button>
            {features?.users?.create && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </div>

        {/* Permission Matrix View */}
        {showPermissionMatrix && (
          <div className="animate-fade-in">
            <PermissionMatrixView />
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="executive">Executive</option>
              <option value="designer">Designer</option>
              <option value="executor">Executor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserIcon className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500">All users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getRoleCount('admin')}</div>
              <p className="text-xs text-gray-500">Administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => !u.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Inactive users</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['admin', 'developer', 'designer', 'executor', 'viewer', 'executive'].map((role) => {
                const count = getRoleCount(role);
                const roleInfo = getRoleDisplayInfo({ role } as UserType);
                return (
                  <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={cn(
                      'inline-flex px-3 py-1 rounded-full text-xs font-medium mb-2',
                      roleInfo.color
                    )}>
                      {roleInfo.name}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {count === 1 ? 'user' : 'users'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new user.
                </p>
                <div className="mt-6">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => {
                      const roleInfo = getRoleDisplayInfo(user);
                      const adminUser = isAdminUser(user.username);

                      return (
                        <tr key={user.id} className={cn(
                          'hover:bg-gray-50 transition-colors duration-150',
                          adminUser && 'bg-purple-50 bg-opacity-30'
                        )}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={cn(
                                'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                                adminUser ? 'bg-purple-100' : 'bg-primary-100'
                              )}>
                                {adminUser ? (
                                  <Shield className="h-5 w-5 text-purple-600" />
                                ) : (
                                  <UserIcon className="h-5 w-5 text-primary-600" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {user.first_name && user.last_name
                                      ? `${user.first_name} ${user.last_name}`
                                      : user.username}
                                  </span>
                                  {adminUser && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Protected
                                    </span>
                                  )}
                                  {currentUser && user.id === currentUser.id && (
                                    <span className="text-xs text-gray-500">(You)</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={cn(
                                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                                roleInfo.color
                              )}>
                                {roleInfo.name}
                              </span>
                              {user.role === 'developer' && process.env.NEXT_PUBLIC_ENV === 'production' && (
                                <DeveloperInProductionWarning className="text-xs" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.created_at || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {currentUser && (
                              <UserActionsMenu
                                user={user as any}
                                currentUser={currentUser as any}
                                onAction={handleUserAction as any}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Edit Modal */}
      <UserEditModal
        user={editingUser as any}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveUser as any}
      />
    </DashboardLayout>
  );
}