'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  GitBranch, 
  TrendingUp, 
  BarChart3,
  Download,
  Upload,
  Eye,
  XCircle
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';

export default function MonitoringPage() {
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [pipelinePerformance, setPipelinePerformance] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all monitoring data concurrently
        const [stats, alerts, performance] = await Promise.all([
          apiClient.getPipelineStats(),
          apiClient.getRecentAlerts(),
          apiClient.getPipelinePerformance()
        ]);
        
        setPipelineStats(stats);
        setRecentAlerts(alerts);
        setPipelinePerformance(performance);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
        // Set default values on error
        setPipelineStats({
          totalPipelines: 0,
          activePipelines: 0,
          runningPipelines: 0,
          failedPipelines: 0,
          successfulRuns: 0,
          failedRuns: 0,
          recordsProcessed: 0,
        });
        setRecentAlerts([]);
        setPipelinePerformance([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)} min`;
    } else {
      return `${(seconds / 3600).toFixed(1)} hrs`;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time metrics and performance data for your data pipelines
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-200 rounded-md ${
                  range === '1h' ? 'rounded-l-lg' : 
                  range === '30d' ? 'rounded-r-lg' : 'border-l-0'
                }`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
              <GitBranch className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : pipelineStats ? (
                  pipelineStats.activePipelines
                ) : (
                  0
                )}
              </div>
              <p className="text-xs text-gray-500">Currently processing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : pipelineStats ? (
                  pipelineStats.runningPipelines
                ) : (
                  0
                )}
              </div>
              <p className="text-xs text-gray-500">In active execution</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : pipelineStats ? (
                  pipelineStats.recordsProcessed.toLocaleString()
                ) : (
                  '0'
                )}
              </div>
              <p className="text-xs text-gray-500">Total processed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : pipelineStats ? (
                  ((pipelineStats.successfulRuns / (pipelineStats.successfulRuns + pipelineStats.failedRuns)) * 100).toFixed(1) + '%'
                ) : (
                  '0%'
                )}
              </div>
              <p className="text-xs text-gray-500">
                {pipelineStats ? (
                  `${pipelineStats.successfulRuns}/${pipelineStats.successfulRuns + pipelineStats.failedRuns} runs`
                ) : (
                  '0/0 runs'
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : pipelinePerformance.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No pipeline performance data to display.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pipelinePerformance.map((pipeline) => (
                    <div key={pipeline.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{pipeline.name}</span>
                        <span className="text-gray-500">{formatTime(pipeline.avgProcessingTime)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            pipeline.successRate >= 95 ? 'bg-green-600' : 
                            pipeline.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-600'
                          }`} 
                          style={{ width: `${pipeline.successRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{pipeline.avgDataVolume.toLocaleString()} records</span>
                        <span>{pipeline.successRate}% success rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Data Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Data visualization chart</p>
                  <p className="text-xs text-gray-400">Showing data volume over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No recent alerts to display.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`flex p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(new Date(alert.timestamp))} • {alert.pipeline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">API Service</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Operational
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Database</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Connected
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Message Queue</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Healthy
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">File Storage</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Degraded
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Cache Service</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Available
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm">
                    <Activity className="h-4 w-4 text-green-500 mr-2" />
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}