'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { AccessDenied } from '@/components/common/AccessDenied';
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
  const { navigation, loading: permissionsLoading } = usePermissions();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(0);
  const [limit] = useState(100);

  useEffect(() => {
    fetchActivities();
  }, [filters, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        skip: page * limit,
        limit,
      };

      if (filters.startDate) params['start_date'] = filters.startDate;
      if (filters.endDate) params['end_date'] = filters.endDate;

      const endpoint = filters.userId
        ? `/admin/activity-logs/${filters.userId}`
        : '/admin/activity-logs';

      const data = await apiClient.request<ActivityLog[]>(endpoint, { params });
      const rawLogs = Array.isArray(data) ? data : [];

      // Map user_id to a display username since the API doesn't join the users table
      let mapped: ActivityLog[] = rawLogs.map((log: any) => ({
        ...log,
        username: log.username || (log.user_id ? `User ${log.user_id}` : 'System'),
      }));

      // Client-side filters
      if (filters.action && filters.action !== 'all') {
        mapped = mapped.filter(log => log.action === filters.action);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        mapped = mapped.filter(log =>
          log.username?.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q) ||
          log.ip_address?.toLowerCase().includes(q)
        );
      }

      setActivities(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleExportCSV = () => {
    if (activities.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['ID', 'Username', 'Action', 'Details', 'IP Address', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...activities.map(log => [
        log.id,
        log.username || 'N/A',
        log.action,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.ip_address || 'N/A',
        new Date(log.timestamp).toLocaleString(),
      ].join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!navigation?.activity_logs) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to view activity logs." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor user activity and system events</p>
        </div>

        {/* Statistics */}
        <ActivityStats activities={activities} loading={loading} />

        {/* Filters */}
        <ActivityFilters
          onFilterChange={handleFilterChange}
          onExport={handleExportCSV}
          disabled={loading}
        />

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
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
              <p className="text-gray-600 dark:text-gray-400">No activity logs found for the selected filters.</p>
            </div>
          ) : (
            <ActivityTimeline activities={activities} />
          )}

          {!loading && activities.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400">Page {page + 1}</span>
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
    </DashboardLayout>
  );
}
