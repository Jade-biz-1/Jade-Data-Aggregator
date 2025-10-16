/**
 * System Maintenance Dashboard
 * Phase 8: F039-F041 - Cleanup and maintenance tools
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
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
  Activity,
  Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';

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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const { features, loading: permissionsLoading } = usePermissions();
  const { showToast } = useToast();

  useEffect(() => {
    if (features?.system?.maintenance) {
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
    if (!features?.system?.cleanup) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: "You don't have permission to execute cleanup operations",
      });
      return;
    }

    const confirmTitle = type === 'all' ? 'Run All Cleanup Operations?' : `Clean ${type.replace('-', ' ')}?`;
    const confirmMessage = type === 'all'
      ? 'This will clean activity logs, temp files, orphaned data, and more. This action cannot be undone.'
      : `Are you sure you want to clean ${type.replace('-', ' ')}? This action cannot be undone.`;

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: confirmTitle,
      message: confirmMessage,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await executeCleanup(type);
      },
    });
  };

  const executeCleanup = async (type: string) => {
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

      // Show success toast
      showToast({
        type: 'success',
        title: 'Cleanup Completed',
        message: `Deleted ${result.summary.total_records_deleted} records, freed ${result.summary.total_space_freed_mb.toFixed(2)} MB`,
        duration: 6000,
      });
    } catch (error) {
      console.error('Error running cleanup:', error);
      showToast({
        type: 'error',
        title: 'Cleanup Failed',
        message: 'Cleanup operation failed. Please check the logs or try again.',
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!stats) return;

    const csvData = [
      ['System Maintenance Statistics'],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Database Information'],
      ['Size (MB)', stats.database.size_mb.toFixed(2)],
      ['Table Count', stats.database.table_count.toString()],
      [],
      ['Record Counts'],
      ['Activity Logs', stats.record_counts.activity_logs.toString()],
      ['Execution Logs', stats.record_counts.execution_logs.toString()],
      ['Auth Tokens', stats.record_counts.auth_tokens.toString()],
      ['Audit Logs', stats.record_counts.audit_logs.toString()],
      [],
      ['Temporary Files'],
      ['File Count', stats.temp_files.file_count.toString()],
      ['Total Size (MB)', stats.temp_files.total_size_mb.toFixed(2)],
      [],
      ['Old Records (Cleanup Candidates)'],
      ['Old Activity Logs', stats.old_records.activity_logs.toString()],
      ['Old Execution Logs', stats.old_records.execution_logs.toString()],
      ['Expired Tokens', stats.old_records.expired_tokens.toString()],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance-stats-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Export Successful',
      message: 'Statistics exported to CSV successfully',
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!stats) return;

    const workbook = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ['System Maintenance Statistics'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Database Information'],
      ['Size (MB)', stats.database.size_mb.toFixed(2)],
      ['Table Count', stats.database.table_count],
      [],
      ['Total Records', Object.values(stats.record_counts).reduce((a, b) => a + b, 0)],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    // Record counts sheet
    const recordsData = [
      ['Record Type', 'Count', 'Old Records'],
      ['Activity Logs', stats.record_counts.activity_logs, stats.old_records.activity_logs],
      ['Execution Logs', stats.record_counts.execution_logs, stats.old_records.execution_logs],
      ['Auth Tokens', stats.record_counts.auth_tokens, stats.old_records.expired_tokens],
      ['Audit Logs', stats.record_counts.audit_logs, 0],
    ];
    const recordsSheet = XLSX.utils.aoa_to_sheet(recordsData);
    XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Records');

    // Temp files sheet
    const filesData = [
      ['Metric', 'Value'],
      ['File Count', stats.temp_files.file_count],
      ['Total Size (MB)', stats.temp_files.total_size_mb.toFixed(2)],
    ];
    const filesSheet = XLSX.utils.aoa_to_sheet(filesData);
    XLSX.utils.book_append_sheet(workbook, filesSheet, 'Temp Files');

    // Write file
    XLSX.writeFile(workbook, `maintenance-stats-${new Date().toISOString().split('T')[0]}.xlsx`);

    showToast({
      type: 'success',
      title: 'Export Successful',
      message: 'Statistics exported to Excel successfully',
    });
  };

  // Prepare data for charts
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  const recordDistributionData = stats ? [
    { name: 'Activity Logs', value: stats.record_counts.activity_logs },
    { name: 'Execution Logs', value: stats.record_counts.execution_logs },
    { name: 'Auth Tokens', value: stats.record_counts.auth_tokens },
    { name: 'Audit Logs', value: stats.record_counts.audit_logs },
  ] : [];

  const tempFilesData = stats ? [
    { name: 'File Count', value: stats.temp_files.file_count },
    { name: 'Size (MB)', value: parseFloat(stats.temp_files.total_size_mb.toFixed(2)) },
  ] : [];

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

  if (!features?.system?.maintenance) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to access system maintenance." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        confirmText="Yes, Clean Up"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Maintenance</h1>
            <p className="mt-2 text-gray-600">
              Monitor and manage system cleanup operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} disabled={!stats} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToExcel} disabled={!stats} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
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

        {/* Data Visualization Charts - Phase 9D */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Record Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Record Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {recordDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recordDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recordDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Temp Files Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Temporary Files Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {tempFilesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tempFilesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cleanup Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => runCleanup('activity-logs')}
                disabled={isCleaningUp || !features?.system?.cleanup}
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
                disabled={isCleaningUp || !features?.system?.cleanup}
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
                disabled={isCleaningUp || !features?.system?.cleanup}
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
                disabled={isCleaningUp || !features?.system?.cleanup}
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
        {!features?.system?.cleanup && (
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
