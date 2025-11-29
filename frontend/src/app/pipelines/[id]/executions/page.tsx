'use client';

import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  RotateCcw,
  Eye,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface ExecutionRun {
  id: string;
  pipeline_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  records_processed: number;
  error_message?: string;
  triggered_by: string;
  trigger_type: 'manual' | 'scheduled' | 'api';
}

interface ExecutionStatistics {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_duration_seconds: number;
  total_records_processed: number;
  success_rate: number;
}

export default function PipelineExecutionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pipelineId = resolvedParams.id;

  const [executions, setExecutions] = useState<ExecutionRun[]>([]);
  const [statistics, setStatistics] = useState<ExecutionStatistics | null>(null);
  const [pipelineName, setPipelineName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!permissionsLoading && features?.pipelines?.view) {
      fetchData();
    }
  }, [permissionsLoading, features, pipelineId, dateRange, filterStatus]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [pipelineRes, executionsRes, statsRes] = await Promise.all([
        apiClient.fetch(`/pipelines/${pipelineId}`),
        apiClient.fetch(`/pipelines/${pipelineId}/runs`, {
          params: {
            days: dateRange.replace('d', ''),
            status: filterStatus !== 'all' ? filterStatus : undefined
          }
        }),
        apiClient.fetch(`/pipelines/${pipelineId}/runs/statistics`)
      ]);

      setPipelineName((pipelineRes as any).data.name);
      setExecutions((executionsRes as any).data || []);
      setStatistics((statsRes as any).data || null);
    } catch (err: any) {
      console.error('Error fetching execution data:', err);
      showError('Failed to load execution data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (runId: string) => {
    if (!confirm('Are you sure you want to retry this execution?')) return;

    try {
      await apiClient.fetch(`/pipelines/${pipelineId}/runs/${runId}/retry`, { method: 'POST' });
      success('Execution retry initiated');
      fetchData();
    } catch (err: any) {
      showError('Failed to retry execution');
    }
  };

  const handleCancel = async (runId: string) => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;

    try {
      await apiClient.fetch(`/pipelines/${pipelineId}/runs/${runId}/cancel`, { method: 'POST' });
      success('Execution cancelled');
      fetchData();
    } catch (err: any) {
      showError('Failed to cancel execution');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.fetch<Blob>(`/pipelines/${pipelineId}/runs/export`, {
        params: { format: 'csv', days: dateRange.replace('d', '') },
        responseType: 'blob'
      });

      const blob = response;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pipeline-${pipelineId}-executions-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      success('Execution history exported successfully');
    } catch (err: any) {
      showError('Failed to export execution history');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Permission check
  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.pipelines?.view) {
    return (
      <DashboardLayout>
        <AccessDenied />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={[]} />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/pipelines">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pipelines
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Execution History</h1>
            <p className="mt-2 text-gray-600">
              {pipelineName || `Pipeline ${pipelineId}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Runs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_runs}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{statistics.successful_runs}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{statistics.failed_runs}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statistics.success_rate.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatDuration(statistics.average_duration_seconds)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executions List */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Runs ({executions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No execution runs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(execution.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                              {execution.status}
                            </span>
                            <span className="text-xs text-gray-600">
                              Run #{execution.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Started</p>
                              <p className="font-medium">{formatDateTime(execution.started_at)}</p>
                            </div>
                            {execution.completed_at && (
                              <div>
                                <p className="text-gray-600">Completed</p>
                                <p className="font-medium">{formatDateTime(execution.completed_at)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-600">Duration</p>
                              <p className="font-medium">{formatDuration(execution.duration_seconds)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Records</p>
                              <p className="font-medium">{execution.records_processed.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                            <span>Triggered by: {execution.triggered_by}</span>
                            <span>Type: {execution.trigger_type}</span>
                          </div>
                          {execution.error_message && (
                            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-sm text-red-800">{execution.error_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/pipelines/${pipelineId}/executions/${execution.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </Link>
                        {execution.status === 'failed' && features?.pipelines?.execute && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(execution.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {execution.status === 'running' && features?.pipelines?.execute && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(execution.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
