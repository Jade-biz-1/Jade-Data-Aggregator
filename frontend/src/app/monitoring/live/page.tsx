'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Play,
  Pause,
  XCircle,
  Zap,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';
import { useRealTimePipelineStatus } from '@/hooks/useRealTimePipelineStatus';

interface SystemHealth {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_pipelines: number;
  failed_pipelines: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  correlation_id?: string;
}

interface PipelineExecution {
  id: string;
  pipeline_name: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  started_at: string;
  current_step?: string;
}

export default function LiveMonitoringPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pipelines, setPipelines] = useState<PipelineExecution[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Use WebSocket hooks for real-time data
  const { metrics } = useRealTimeMetrics();
  const { pipelineStatuses } = useRealTimePipelineStatus();

  useEffect(() => {
    loadInitialData();

    if (autoRefresh) {
      const interval = setInterval(loadInitialData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Update from WebSocket data
  useEffect(() => {
    if (metrics) {
      setSystemHealth({
        cpu_usage: metrics.cpu?.percent || 0,
        memory_usage: metrics.memory?.percent || 0,
        disk_usage: metrics.disk?.percent || 0,
        active_pipelines: metrics.active_pipelines || 0,
        failed_pipelines: metrics.failed_pipelines || 0,
        status: getHealthStatus(metrics),
      });
    }
  }, [metrics]);

  useEffect(() => {
    if (pipelineStatuses && Object.keys(pipelineStatuses).length > 0) {
      const executions: PipelineExecution[] = Object.values(pipelineStatuses).map((status: any) => ({
        id: status.pipeline_id,
        pipeline_name: status.metadata?.pipeline_name || `Pipeline ${status.pipeline_id}`,
        status: status.status,
        started_at: status.timestamp, // Mapped start_time to started_at
        progress: status.progress || 0, // Added progress
        duration: '0s', // placeholder
        records_processed: status.metadata?.records_processed || 0
      }));
      setPipelines(executions);
    }
  }, [pipelineStatuses]);

  const loadInitialData = async () => {
    try {
      const [healthRes, alertsRes, logsRes, pipelinesRes] = await Promise.all([
        api.get('/monitoring/health'),
        api.get('/monitoring/alerts?limit=20'),
        api.get('/monitoring/logs?limit=100'),
        api.get('/monitoring/pipelines/active'),
      ]);

      setSystemHealth(healthRes.data);
      setAlerts(alertsRes.data.alerts || []);
      setLogs(logsRes.data.logs || []);
      setPipelines(pipelinesRes.data.pipelines || []);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  const getHealthStatus = (metrics: any): 'healthy' | 'warning' | 'critical' => {
    if (metrics.cpu_usage > 90 || metrics.memory_usage > 90 || metrics.failed_pipelines > 5) {
      return 'critical';
    }
    if (metrics.cpu_usage > 70 || metrics.memory_usage > 70 || metrics.failed_pipelines > 2) {
      return 'warning';
    }
    return 'healthy';
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.post(`/monitoring/alerts/${alertId}/acknowledge`);
      setAlerts(alerts.map(a => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await api.delete(`/monitoring/alerts/${alertId}`);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await api.get('/monitoring/logs/export', {
        params: { format: 'csv', level: logFilter !== 'all' ? logFilter : undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'warning':
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'critical':
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'CRITICAL':
        return 'text-red-600';
      case 'WARNING':
        return 'text-yellow-600';
      case 'INFO':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredLogs = logFilter === 'all'
    ? logs
    : logs.filter(log => log.level.toLowerCase() === logFilter.toLowerCase());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Monitoring
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time system health and pipeline monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${autoRefresh
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
            <button
              onClick={loadInitialData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* System Health Cards */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Overall Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                  <p className={`mt-2 text-2xl font-bold ${systemHealth.status === 'healthy'
                    ? 'text-green-600'
                    : systemHealth.status === 'warning'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                    {systemHealth.status.toUpperCase()}
                  </p>
                </div>
                <Activity className={`w-12 h-12 ${getStatusColor(systemHealth.status)}`} />
              </div>
            </div>

            {/* CPU Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</p>
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemHealth.cpu_usage}%
                </p>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${systemHealth.cpu_usage > 90
                    ? 'bg-red-600'
                    : systemHealth.cpu_usage > 70
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                    }`}
                  style={{ width: `${systemHealth.cpu_usage}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
                <MemoryStick className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemHealth.memory_usage}%
                </p>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${systemHealth.memory_usage > 90
                    ? 'bg-red-600'
                    : systemHealth.memory_usage > 70
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                    }`}
                  style={{ width: `${systemHealth.memory_usage}%` }}
                />
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</p>
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemHealth.disk_usage}%
                </p>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${systemHealth.disk_usage > 90
                    ? 'bg-red-600'
                    : systemHealth.disk_usage > 70
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                    }`}
                  style={{ width: `${systemHealth.disk_usage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Pipelines */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Active Pipeline Executions
            </h2>
          </div>
          <div className="p-6">
            {pipelines.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No active pipelines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pipelines.map(pipeline => (
                  <div
                    key={pipeline.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {pipeline.status === 'running' && (
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                      )}
                      {pipeline.status === 'completed' && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      {pipeline.status === 'failed' && (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      {pipeline.status === 'paused' && (
                        <Pause className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {pipeline.pipeline_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pipeline.status)}`}>
                          {pipeline.status}
                        </span>
                      </div>
                      {pipeline.current_step && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Current step: {pipeline.current_step}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pipeline.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {pipeline.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Active Alerts ({alerts.filter(a => !a.acknowledged).length})
              </h2>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 dark:text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-600'
                        : alert.severity === 'error'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-600'
                          : alert.severity === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-600'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-600'
                        } ${alert.acknowledged ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {alert.title}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {alert.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  Live Logs
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button
                    onClick={exportLogs}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Export Logs"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 font-sans">
                  <p className="text-gray-600 dark:text-gray-400">No logs available</p>
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`font-semibold flex-shrink-0 ${getLogLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
                      [{log.source}]
                    </span>
                    <span className="text-gray-900 dark:text-white flex-1">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
