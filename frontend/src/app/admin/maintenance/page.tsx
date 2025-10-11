/**
 * System Maintenance Dashboard
 * Phase 8: F039-F041 - Cleanup and maintenance tools
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import {
  Database,
  Trash2,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
  HardDrive,
  Activity
} from 'lucide-react';

interface CleanupStats {
  database: {
    size_mb: number;
    table_count: number;
  };
  record_counts: {
    activity_logs: number;
    execution_logs: number;
    auth_tokens: number;
    audit_logs: number;
  };
  temp_files: {
    file_count: number;
    total_size_mb: number;
  };
  old_records: {
    activity_logs: number;
    execution_logs: number;
    expired_tokens: number;
  };
}

interface CleanupResult {
  success: boolean;
  operations: Record<string, any>;
  summary: {
    total_records_deleted: number;
    total_space_freed_mb: number;
    duration_seconds: number;
  };
}

export default function MaintenancePage() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [cleanupResults, setCleanupResults] = useState<CleanupResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { features, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (features?.maintenance?.view) {
      fetchStats();
    }
  }, [features]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/admin/cleanup/stats', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async (type: string) => {
    if (!features?.maintenance?.execute) {
      alert('You don\'t have permission to execute cleanup operations');
      return;
    }

    const confirmMessage = type === 'all'
      ? 'Are you sure you want to run ALL cleanup operations? This will clean activity logs, temp files, and orphaned data.'
      : `Are you sure you want to clean ${type.replace('-', ' ')}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsCleaningUp(true);
      const response = await fetch(`/api/v1/admin/cleanup/${type}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Cleanup operation failed');
      }

      const result = await response.json();
      setCleanupResults(result);

      // Refresh stats after cleanup
      await fetchStats();

      alert(`Cleanup completed successfully!\n\nRecords deleted: ${result.summary.total_records_deleted}\nSpace freed: ${result.summary.total_space_freed_mb} MB`);
    } catch (error) {
      console.error('Error running cleanup:', error);
      alert('Cleanup operation failed. Please check the logs.');
    } finally {
      setIsCleaningUp(false);
    }
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

  if (!features?.maintenance?.view) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to access system maintenance." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Maintenance</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage system cleanup operations
          </p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <HardDrive className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${stats.database.size_mb.toFixed(2)} MB` : '—'}
              </div>
              <p className="text-xs text-gray-500">
                {stats ? `${stats.database.table_count} tables` : 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? Object.values(stats.record_counts).reduce((a, b) => a + b, 0).toLocaleString() : '—'}
              </div>
              <p className="text-xs text-gray-500">Across all tables</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temp Files</CardTitle>
              <FileText className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? stats.temp_files.file_count.toLocaleString() : '—'}
              </div>
              <p className="text-xs text-gray-500">
                {stats ? `${stats.temp_files.total_size_mb.toFixed(2)} MB` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Record Counts */}
        <Card>
          <CardHeader>
            <CardTitle>Record Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.record_counts.activity_logs.toLocaleString() ?? '—'}
                </div>
                <p className="text-xs text-gray-600 mt-1">Activity Logs</p>
                {stats && stats.old_records.activity_logs > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {stats.old_records.activity_logs.toLocaleString()} old
                  </p>
                )}
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.record_counts.execution_logs.toLocaleString() ?? '—'}
                </div>
                <p className="text-xs text-gray-600 mt-1">Execution Logs</p>
                {stats && stats.old_records.execution_logs > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {stats.old_records.execution_logs.toLocaleString()} old
                  </p>
                )}
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.record_counts.auth_tokens.toLocaleString() ?? '—'}
                </div>
                <p className="text-xs text-gray-600 mt-1">Auth Tokens</p>
                {stats && stats.old_records.expired_tokens > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {stats.old_records.expired_tokens.toLocaleString()} expired
                  </p>
                )}
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.record_counts.audit_logs.toLocaleString() ?? '—'}
                </div>
                <p className="text-xs text-gray-600 mt-1">Audit Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleanup Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => runCleanup('activity-logs')}
                disabled={isCleaningUp || !features?.maintenance?.execute}
                className="h-auto py-4 flex flex-col items-start"
                variant="outline"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">Clean Activity Logs</span>
                </div>
                <p className="text-xs text-gray-600 text-left">
                  Remove activity logs older than 90 days
                </p>
              </Button>

              <Button
                onClick={() => runCleanup('temp-files')}
                disabled={isCleaningUp || !features?.maintenance?.execute}
                className="h-auto py-4 flex flex-col items-start"
                variant="outline"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Trash2 className="h-5 w-5" />
                  <span className="font-semibold">Clean Temp Files</span>
                </div>
                <p className="text-xs text-gray-600 text-left">
                  Remove temporary files older than 24 hours
                </p>
              </Button>

              <Button
                onClick={() => runCleanup('orphaned-data')}
                disabled={isCleaningUp || !features?.maintenance?.execute}
                className="h-auto py-4 flex flex-col items-start"
                variant="outline"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5" />
                  <span className="font-semibold">Clean Orphaned Data</span>
                </div>
                <p className="text-xs text-gray-600 text-left">
                  Remove records with no parent associations
                </p>
              </Button>

              <Button
                onClick={() => runCleanup('all')}
                disabled={isCleaningUp || !features?.maintenance?.execute}
                className="h-auto py-4 flex flex-col items-start bg-primary-600 hover:bg-primary-700 text-white"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Play className="h-5 w-5" />
                  <span className="font-semibold">Run All Cleanup</span>
                </div>
                <p className="text-xs text-white text-opacity-90 text-left">
                  Execute all cleanup operations at once
                </p>
              </Button>
            </div>

            {isCleaningUp && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <p className="text-sm text-blue-800">Cleanup operation in progress...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Results */}
        {cleanupResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Last Cleanup Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(cleanupResults.operations).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-600">
                      {value.records_deleted || value.files_deleted || 0} items removed
                    </span>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {cleanupResults.summary.total_records_deleted}
                      </p>
                      <p className="text-xs text-gray-600">Records Deleted</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {cleanupResults.summary.total_space_freed_mb.toFixed(2)} MB
                      </p>
                      <p className="text-xs text-gray-600">Space Freed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {cleanupResults.summary.duration_seconds.toFixed(2)}s
                      </p>
                      <p className="text-xs text-gray-600">Duration</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permission Warning */}
        {!features?.maintenance?.execute && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Read-Only Access</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    You have permission to view system stats but not to execute cleanup operations.
                    Contact an administrator if you need execute permissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
