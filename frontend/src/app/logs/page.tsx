'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Search, Filter, Download, RefreshCw, Calendar, AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  correlation_id?: string;
  user_id?: string;
  pipeline_id?: string;
  execution_id?: string;
  details?: any;
}

interface LogStatistics {
  total_logs: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  debug_count: number;
  unique_sources: number;
  time_range: string;
}

const LogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [correlationId, setCorrelationId] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);

  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [timeRange, filterLevel, filterSource]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const end = new Date();
      const start = new Date();

      switch (timeRange) {
        case '1h':
          start.setHours(end.getHours() - 1);
          break;
        case '6h':
          start.setHours(end.getHours() - 6);
          break;
        case '24h':
          start.setDate(end.getDate() - 1);
          break;
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
      }

      const params: any = {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        limit: 500
      };

      if (filterLevel !== 'all') {
        params.level = filterLevel.toUpperCase();
      }

      if (filterSource !== 'all') {
        params.source = filterSource;
      }

      const response = await apiClient.fetch<any>('/logs', { params });
      setLogs(response.data.logs || []);
      setStatistics(response.data.statistics || null);

      // Extract unique sources
      const uniqueSources = Array.from(new Set(response.data.logs.map((log: LogEntry) => log.source)));
      setSources(uniqueSources as string[]);

      success('Logs loaded successfully');
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      showError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      const end = new Date();
      const start = new Date();

      switch (timeRange) {
        case '1h':
          start.setHours(end.getHours() - 1);
          break;
        case '6h':
          start.setHours(end.getHours() - 6);
          break;
        case '24h':
          start.setDate(end.getDate() - 1);
          break;
        case '7d':
          start.setDate(end.getDate() - 7);
          break;
        case '30d':
          start.setDate(end.getDate() - 30);
          break;
      }

      const params: any = {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        format: 'csv'
      };

      if (filterLevel !== 'all') {
        params.level = filterLevel.toUpperCase();
      }

      const response = await apiClient.fetch<any>('/logs/export', { params });

      // Create CSV content
      const csvContent = response.data;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      success('Logs exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      showError('Failed to export logs');
    }
  };

  const handleCorrelationSearch = async () => {
    if (!correlationId.trim()) {
      showError('Please enter a correlation ID');
      return;
    }

    try {
      const response = await apiClient.fetch<any>('/logs/correlation', {
        params: { correlation_id: correlationId }
      });
      setLogs(response.data.logs || []);
      success(`Found ${response.data.logs.length} related logs`);
    } catch (error: any) {
      console.error('Correlation search error:', error);
      showError('Failed to search by correlation ID');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return <Info className="w-4 h-4 text-gray-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'CRITICAL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-100 text-gray-700';
      case 'INFO':
        return 'bg-blue-100 text-blue-700';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      case 'ERROR':
        return 'bg-orange-100 text-orange-700';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.source.toLowerCase().includes(searchTerm.toLowerCase())) {
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

  if (!features?.monitoring?.view_logs) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Log Analysis</h1>
            <p className="text-gray-600 mt-1">
              Centralized log viewing, search, and correlation tracking
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Logs</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_logs.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Errors</h3>
              <p className="text-2xl font-bold text-red-600">{statistics.error_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Warnings</h3>
              <p className="text-2xl font-bold text-yellow-600">{statistics.warning_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Info</h3>
              <p className="text-2xl font-bold text-blue-600">{statistics.info_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Debug</h3>
              <p className="text-2xl font-bold text-gray-600">{statistics.debug_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Sources</h3>
              <p className="text-2xl font-bold text-gray-900">{statistics.unique_sources}</p>
            </div>
          </div>
        )}

        {/* Search and Filter Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Logs
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by message or source..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Correlation ID Search */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correlation ID Tracking
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={correlationId}
                onChange={(e) => setCorrelationId(e.target.value)}
                placeholder="Enter correlation ID to track related logs..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCorrelationSearch}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Track
              </button>
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Log Entries ({filteredLogs.length})
            </h2>
            <span className="text-sm text-gray-500">
              Showing {filteredLogs.length} of {logs.length} logs
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Info className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or time range
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start gap-3">
                    {/* Level Icon */}
                    <div className="mt-1">
                      {getLevelIcon(log.level)}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs font-medium text-gray-700">
                          {log.source}
                        </span>
                        {log.correlation_id && (
                          <>
                            <span className="text-xs text-gray-500">•</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCorrelationId(log.correlation_id!);
                                handleCorrelationSearch();
                              }}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                            >
                              {log.correlation_id.substring(0, 8)}...
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 break-words">
                        {log.message}
                      </p>
                      {log.pipeline_id && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>Pipeline: {log.pipeline_id}</span>
                          {log.execution_id && <span>• Run: {log.execution_id}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <p className="text-sm text-gray-900">{selectedLog.source}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-sm text-gray-900 break-words">{selectedLog.message}</p>
                  </div>

                  {selectedLog.correlation_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correlation ID</label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          {selectedLog.correlation_id}
                        </code>
                        <button
                          onClick={() => {
                            setCorrelationId(selectedLog.correlation_id!);
                            setSelectedLog(null);
                            handleCorrelationSearch();
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Track Related
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedLog.pipeline_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.pipeline_id}</p>
                    </div>
                  )}

                  {selectedLog.execution_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Execution ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.execution_id}</p>
                    </div>
                  )}

                  {selectedLog.user_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.user_id}</p>
                    </div>
                  )}

                  {selectedLog.details && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                      <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LogsPage;
