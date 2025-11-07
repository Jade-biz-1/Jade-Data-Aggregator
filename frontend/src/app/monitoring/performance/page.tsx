'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceMetrics {
  response_time: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requests_per_second: number;
    records_per_second: number;
  };
  error_rate: {
    total_errors: number;
    error_percentage: number;
    errors_by_type: Record<string, number>;
  };
  resource_utilization: {
    cpu_avg: number;
    memory_avg: number;
    disk_io: number;
    network_io: number;
  };
}

interface PerformanceData {
  timestamp: string;
  response_time: number;
  throughput: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
}

interface Baseline {
  response_time_avg: number;
  throughput_avg: number;
  error_rate_avg: number;
}

export default function PerformanceMonitoringPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [chartData, setChartData] = useState<PerformanceData[]>([]);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(loadPerformanceData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const [metricsRes, timeSeriesRes, baselineRes] = await Promise.all([
        api.get('/monitoring/performance/metrics'),
        api.get('/monitoring/performance/timeseries', { params: { range: timeRange } }),
        api.get('/monitoring/performance/baseline'),
      ]);

      setMetrics(metricsRes.data);
      setChartData(timeSeriesRes.data.data || []);
      setBaseline(baselineRes.data);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current: number, baseline: number): { trend: 'up' | 'down' | 'stable'; percentage: number } => {
    if (!baseline || baseline === 0) return { trend: 'stable', percentage: 0 };

    const diff = ((current - baseline) / baseline) * 100;

    if (Math.abs(diff) < 5) return { trend: 'stable', percentage: 0 };
    return { trend: diff > 0 ? 'up' : 'down', percentage: Math.abs(diff) };
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatThroughput = (value: number): string => {
    if (value < 1000) return `${value.toFixed(0)}/s`;
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K/s`;
    return `${(value / 1000000).toFixed(1)}M/s`;
  };

  if (loading && !metrics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const responseTrend = baseline
    ? calculateTrend(metrics?.response_time.avg || 0, baseline.response_time_avg)
    : { trend: 'stable' as const, percentage: 0 };

  const throughputTrend = baseline
    ? calculateTrend(metrics?.throughput.requests_per_second || 0, baseline.throughput_avg)
    : { trend: 'stable' as const, percentage: 0 };

  const errorTrend = baseline
    ? calculateTrend(metrics?.error_rate.error_percentage || 0, baseline.error_rate_avg)
    : { trend: 'stable' as const, percentage: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Performance Monitoring
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time performance metrics and trend analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
            <button
              onClick={loadPerformanceData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Response Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatResponseTime(metrics.response_time.avg)}
              </p>
              {baseline && responseTrend.trend !== 'stable' && (
                <div className="mt-2 flex items-center gap-1">
                  {responseTrend.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    responseTrend.trend === 'down' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {responseTrend.percentage.toFixed(1)}% {responseTrend.trend === 'down' ? 'faster' : 'slower'}
                  </span>
                </div>
              )}
            </div>

            {/* Throughput */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Throughput</p>
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatThroughput(metrics.throughput.requests_per_second)}
              </p>
              {baseline && throughputTrend.trend !== 'stable' && (
                <div className="mt-2 flex items-center gap-1">
                  {throughputTrend.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    throughputTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {throughputTrend.percentage.toFixed(1)}% {throughputTrend.trend === 'up' ? 'higher' : 'lower'}
                  </span>
                </div>
              )}
            </div>

            {/* Error Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.error_rate.error_percentage.toFixed(2)}%
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {metrics.error_rate.total_errors} errors
              </p>
            </div>

            {/* CPU Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg CPU Usage</p>
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.resource_utilization.cpu_avg.toFixed(1)}%
              </p>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.resource_utilization.cpu_avg}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Response Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-blue-600" />
            Response Time Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis stroke="#9ca3af" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
                formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Response Time']}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey="response_time"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorResponseTime)"
              />
              {baseline && (
                <Line
                  type="monotone"
                  dataKey={() => baseline.response_time_avg}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Baseline"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Throughput Over Time
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9ca3af"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#9ca3af" label={{ value: 'req/s', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value: number) => [`${value.toFixed(0)}/s`, 'Throughput']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Line type="monotone" dataKey="throughput" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Rate Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Error Rate Tracking
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorErrorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9ca3af"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#9ca3af" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Error Rate']}
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                />
                <Area
                  type="monotone"
                  dataKey="error_rate"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorErrorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Resource Utilization
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis stroke="#9ca3af" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Legend />
              <Bar dataKey="cpu_usage" fill="#f97316" name="CPU Usage %" />
              <Bar dataKey="memory_usage" fill="#8b5cf6" name="Memory Usage %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Error Breakdown */}
        {metrics && metrics.error_rate.total_errors > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Error Distribution
            </h2>
            <div className="space-y-3">
              {Object.entries(metrics.error_rate.errors_by_type).map(([type, count]) => {
                const percentage = (count / metrics.error_rate.total_errors) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
