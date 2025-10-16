'use client';

import { useState, useEffect } from 'react';

interface Filters {
  userId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface ActivityFiltersProps {
  onFilterChange: (filters: Filters) => void;
  onExport: () => void;
  disabled?: boolean;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'login_success', label: 'Login Success' },
  { value: 'login_failed', label: 'Login Failed' },
  { value: 'logout', label: 'Logout' },
  { value: 'password_change', label: 'Password Change' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'user_created', label: 'User Created' },
  { value: 'user_updated', label: 'User Updated' },
  { value: 'user_deleted', label: 'User Deleted' },
  { value: 'user_activated', label: 'User Activated' },
  { value: 'user_deactivated', label: 'User Deactivated' },
];

export default function ActivityFilters({ onFilterChange, onExport, disabled = false }: ActivityFiltersProps) {
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();

  // Fetch users for filter
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleApplyFilters = () => {
    const filters: Filters = {};

    if (selectedUserId) filters.userId = selectedUserId;
    if (action && action !== 'all') filters.action = action;
    if (startDate) filters.startDate = new Date(startDate).toISOString();
    if (endDate) filters.endDate = new Date(endDate).toISOString();
    if (search) filters.search = search;

    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setAction('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setSelectedUserId(undefined);
    onFilterChange({});
  };

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* User Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            User
          </label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action Type
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            {ACTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
        </div>

        {/* End Date */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          />
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, action, details, or IP address..."
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleApplyFilters}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClearFilters}
          disabled={disabled}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Clear Filters
        </button>
        <button
          onClick={onExport}
          disabled={disabled}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-medium ml-auto"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
