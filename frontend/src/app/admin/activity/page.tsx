'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ActivityTimeline from '@/components/admin/ActivityTimeline';
import ActivityStats from '@/components/admin/ActivityStats';
import ActivityFilters from '@/components/admin/ActivityFilters';

interface ActivityLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

interface Filters {
  userId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function ActivityDashboardPage() {
  const { hasPermission } = usePermissions();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(0);
  const [limit] = useState(100);

  // Fetch activity logs
  useEffect(() => {
    fetchActivities();
  }, [filters, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      const params = new URLSearchParams({
        skip: (page * limit).toString(),
        limit: limit.toString(),
      });

      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const url = filters.userId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/admin/activity-logs/${filters.userId}?${params}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/admin/activity-logs?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
      }

      const data: ActivityLog[] = await response.json();

      // Apply client-side filters
      let filteredData = data;

      if (filters.action && filters.action !== 'all') {
        filteredData = filteredData.filter(log => log.action === filters.action);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(log =>
          log.username?.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.details?.toLowerCase().includes(searchLower) ||
          log.ip_address?.toLowerCase().includes(searchLower)
        );
      }

      setActivities(filteredData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handleExportCSV = () => {
    if (activities.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Username', 'Action', 'Details', 'IP Address', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...activities.map(log => [
        log.id,
        log.username || 'N/A',
        log.action,
        `"${(log.details || '').replace(/"/g, '""')}"`, // Escape quotes
        log.ip_address || 'N/A',
        new Date(log.timestamp).toLocaleString()
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check permissions
  if (!hasPermission('view_activity_logs')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view activity logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Activity Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor user activity and system events
        </p>
      </div>

      {/* Statistics Section */}
      <ActivityStats activities={activities} loading={loading} />

      {/* Filters Section */}
      <div className="mb-6">
        <ActivityFilters
          onFilterChange={handleFilterChange}
          onExport={handleExportCSV}
          disabled={loading}
        />
      </div>

      {/* Timeline Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activity Timeline
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No activity logs found for the selected filters.
            </p>
          </div>
        ) : (
          <ActivityTimeline activities={activities} />
        )}

        {/* Pagination */}
        {!loading && activities.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={activities.length < limit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
