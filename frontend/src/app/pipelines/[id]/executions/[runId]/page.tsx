'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  Database,
  Filter,
  Search
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface ExecutionDetails {
  id: string;
  pipeline_id: string;
  pipeline_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  records_processed: number;
  records_failed: number;
  error_message?: string;
  error_details?: any;
  triggered_by: string;
  trigger_type: 'manual' | 'scheduled' | 'api';
  configuration: any;
  steps: ExecutionStep[];
}

interface ExecutionStep {
  step_number: number;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  records_processed: number;
  error_message?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  step_name?: string;
  metadata?: any;
}

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const resolvedParams = use(params);
  const { id: pipelineId, runId } = resolvedParams;
  const router = useRouter();

  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!permissionsLoading && features?.pipelines?.view) {
      fetchData();
    }
  }, [permissionsLoading, features, pipelineId, runId]);

  useEffect(() => {
    if (autoRefresh && execution?.status === 'running') {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, execution?.status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [executionRes, logsRes] = await Promise.all([
        apiClient.get(`/pipelines/${pipelineId}/runs/${runId}`),
        apiClient.get(`/pipelines/${pipelineId}/runs/${runId}/logs`)
      ]);

      setExecution(executionRes.data);
      setLogs(logsRes.data || []);

      // Auto-enable refresh if running
      if (executionRes.data.status === 'running') {
        setAutoRefresh(true);
      }
    } catch (err: any) {
      console.error('Error fetching execution details:', err);
      showError('Failed to load execution details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!confirm('Are you sure you want to retry this execution?')) return;

    try {
      await apiClient.post(`/pipelines/${pipelineId}/runs/${runId}/retry`);
      success('Execution retry initiated');
      router.push(`/pipelines/${pipelineId}/executions`);
    } catch (err: any) {
      showError('Failed to retry execution');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;

    try {
      await apiClient.post(`/pipelines/${pipelineId}/runs/${runId}/cancel`);
      success('Execution cancelled');
      fetchData();
    } catch (err: any) {
      showError('Failed to cancel execution');
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await apiClient.get(`/pipelines/${pipelineId}/runs/${runId}/logs/export`, {
        params: { format: 'txt' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `execution-${runId}-logs-${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      success('Logs exported successfully');
    } catch (err: any) {
      showError('Failed to export logs');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-gray-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
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
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'ERROR':
        return 'text-red-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'INFO':
        return 'text-blue-600';
      case 'DEBUG':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const filteredLogs = logs
    .filter(log => {
      if (logFilter !== 'all' && log.level.toLowerCase() !== logFilter.toLowerCase()) {
        return false;
      }
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

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

  if (isLoading && !execution) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!execution) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Execution Not Found</h2>
          <p className="text-gray-600 mb-4">The requested execution could not be found.</p>
          <Link href={`/pipelines/${pipelineId}/executions`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Executions
            </Button>
          </Link>
        </div>
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
              <Link href={`/pipelines/${pipelineId}/executions`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Execution Details</h1>
            <p className="mt-2 text-gray-600">
              {execution.pipeline_name} - Run #{runId.slice(0, 8)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {execution.status === 'running' && (
              <Button
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {autoRefresh ? 'Pause Updates' : 'Auto-Refresh'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {execution.status === 'failed' && features?.pipelines?.execute && (
              <Button onClick={handleRetry}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            {execution.status === 'running' && features?.pipelines?.execute && (
              <Button variant="outline" onClick={handleCancel} className="text-red-600 hover:bg-red-50">
                Cancel Execution
              </Button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {getStatusIcon(execution.status)}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                  </h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(execution.status)}`}>
                    {execution.status}
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
                    <p className="text-gray-600">Triggered By</p>
                    <p className="font-medium">{execution.triggered_by}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Records Processed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {execution.records_processed.toLocaleString()}
                  </p>
                </div>
                <Database className="h-12 w-12 text-blue-100" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Records Failed</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {execution.records_failed.toLocaleString()}
                  </p>
                </div>
                <XCircle className="h-12 w-12 text-red-100" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {execution.records_processed > 0
                      ? ((execution.records_processed - execution.records_failed) / execution.records_processed * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {execution.error_message && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 font-mono text-sm">{execution.error_message}</p>
              {execution.error_details && (
                <pre className="mt-4 p-4 bg-red-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(execution.error_details, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {/* Execution Steps Timeline */}
        {execution.steps && execution.steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {execution.steps.map((step, index) => (
                  <div key={step.step_number} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'running' ? 'bg-blue-100' :
                        step.status === 'failed' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {getStatusIcon(step.status)}
                      </div>
                      {index < execution.steps.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{step.step_name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                        {step.started_at && (
                          <span>Started: {new Date(step.started_at).toLocaleTimeString()}</span>
                        )}
                        {step.completed_at && (
                          <span>Completed: {new Date(step.completed_at).toLocaleTimeString()}</span>
                        )}
                        {step.duration_seconds !== undefined && (
                          <span>Duration: {formatDuration(step.duration_seconds)}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Records: {step.records_processed.toLocaleString()}
                      </p>
                      {step.error_message && (
                        <p className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded">
                          {step.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Execution Logs ({filteredLogs.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Log Filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Log Display */}
            <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No logs available</p>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-gray-300 hover:bg-gray-800 px-2 py-1 rounded">
                      <span className="text-gray-500 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-semibold flex-shrink-0 ${getLogLevelColor(log.level)}`}>
                        {log.level.padEnd(8)}
                      </span>
                      {log.step_name && (
                        <span className="text-blue-400 flex-shrink-0">
                          [{log.step_name}]
                        </span>
                      )}
                      <span className="text-gray-200 flex-1">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
