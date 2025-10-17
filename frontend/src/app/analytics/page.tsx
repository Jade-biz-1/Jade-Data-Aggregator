'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, AreaChart } from '@/components/charts';
import {
  BarChart3,
  TrendingUp,
  Database,
  GitBranch,
  Calendar,
  Download,
  Filter,
  Activity,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [topPipelines, setTopPipelines] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all analytics data concurrently
        const [analytics, timeSeries, pipelines] = await Promise.all([
          apiClient.getAnalyticsData(),
          apiClient.getTimeSeriesData(),
          apiClient.getTopPipelines()
        ]);
        
        setAnalyticsData(analytics);
        setTimeSeriesData(timeSeries);
        setTopPipelines(pipelines);
      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        error(err.message || 'Failed to load analytics data', 'Error');
        // Set default values on error
        setAnalyticsData({
          totalProcessed: 0,
          avgProcessingTime: 0,
          successRate: 0,
          activePipelines: 0,
          failedPipelines: 0,
          dataSources: 0,
          dataDestinations: 0,
        });
        setTimeSeriesData([]);
        setTopPipelines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (!features?.analytics?.view) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to view analytics." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-2 text-gray-600">
              Insights and analytics for your data processing activities
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-200 focus:border-primary-600"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            {features?.analytics?.view && (
              <>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
                <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : analyticsData ? (
                  analyticsData.totalProcessed.toLocaleString()
                ) : (
                  '0'
                )}
              </div>
              <p className="text-xs text-gray-500">Across all pipelines</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
              <Clock className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : analyticsData ? (
                  `${analyticsData.avgProcessingTime} sec`
                ) : (
                  '0 sec'
                )}
              </div>
              <p className="text-xs text-gray-500">Per pipeline run</p>
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
                ) : analyticsData ? (
                  `${analyticsData.successRate}%`
                ) : (
                  '0%'
                )}
              </div>
              <p className="text-xs text-gray-500">Successful runs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
              <GitBranch className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : analyticsData ? (
                  analyticsData.activePipelines
                ) : (
                  0
                )}
              </div>
              <p className="text-xs text-gray-500">Currently running</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Data Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={timeSeriesData}
                xKey="date"
                areas={[
                  { key: 'records', name: 'Records Processed', color: '#3b82f6' }
                ]}
                isLoading={isLoading}
                height={320}
              />
            </CardContent>
          </Card>

          {/* Pipeline Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={topPipelines}
                xKey="name"
                bars={[
                  { key: 'successRate', name: 'Success Rate (%)', color: '#10b981' }
                ]}
                isLoading={isLoading}
                height={320}
              />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pipelines */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : topPipelines.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pipeline data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No pipeline performance data to display.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topPipelines.map((pipeline, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          <p className="text-sm text-gray-500">{pipeline.records.toLocaleString()} records</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{pipeline.successRate}%</p>
                        <p className="text-xs text-gray-500">success rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Sources Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sources Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-blue-500 mr-2" />
                    <span>Database Sources</span>
                  </div>
                  <span className="font-medium">5</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-green-500 mr-2" />
                    <span>SaaS Integrations</span>
                  </div>
                  <span className="font-medium">3</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-purple-500 mr-2" />
                    <span>File Sources</span>
                  </div>
                  <span className="font-medium">4</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>API Endpoints</span>
                  </div>
                  <span className="font-medium">6</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Sources</span>
                    <span className="font-medium">
                      {isLoading ? (
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ) : analyticsData ? (
                        analyticsData.dataSources
                      ) : (
                        0
                      )}
                    </span>
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