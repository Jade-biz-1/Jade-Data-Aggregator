'use client';

import { useEffect, useState, useMemo, type ComponentType } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts';
import { SystemMetricsWidget } from '@/components/realtime/system-metrics-widget';
import { NotificationsWidget } from '@/components/realtime/notifications-widget';
import {
  Activity,
  ArrowUpRight,
  Database,
  GitBranch,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type {
  DashboardStats,
  DashboardRecentActivity,
  DashboardTimeSeriesPoint
} from '@/types';

function StatCard({ 
  title, 
  value, 
  changePercent, 
  icon: Icon, 
  direction = 'up' 
}: { 
  title: string; 
  value: number; 
  changePercent?: number; 
  icon: ComponentType<{ className?: string }>; 
  direction?: 'up' | 'down';
}) {
  const formattedValue = useMemo(() => value.toLocaleString(), [value]);
  const showChange = typeof changePercent === 'number';
  const magnitude = showChange ? Math.abs(changePercent as number) : 0;
  const isNeutral = showChange && magnitude < 0.1;
  const trendDirection = direction ?? 'up';
  const trendColor = isNeutral
    ? 'text-gray-500'
    : trendDirection === 'down'
    ? 'text-red-600'
    : 'text-green-600';
  const arrowClasses = `h-4 w-4 mr-1 ${trendDirection === 'down' ? 'rotate-180' : ''}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {showChange && (
          <p className={`text-xs flex items-center mt-1 ${trendColor}`}>
            <ArrowUpRight className={arrowClasses} />
            {`${magnitude.toFixed(1)}%`} vs previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<DashboardRecentActivity[]>([]);
  const [performanceData, setPerformanceData] = useState<DashboardTimeSeriesPoint[]>([]);
  const { toasts, error } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch real data from API endpoints
        const [statsData, activityData, perfData] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getRecentActivity(),
          apiClient.getTimeSeriesData().catch(() => [])
        ]);

        setStats(statsData);
        setRecentActivity(activityData);
        setPerformanceData(perfData);
      } catch (err: unknown) {
        console.error('Error fetching dashboard data:', err);
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        error(message, 'Error');

        // Set empty/default data instead of mock data
        setStats({
          pipelines: { total: 0, active: 0, running: 0, failed: 0 },
          connectors: { total: 0, active: 0 },
          data_processed: { today: 0, this_week: 0, this_month: 0 }
        });
        setRecentActivity([]);
        setPerformanceData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [error]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Dev-only hint to try the example */}
        {(process.env.NEXT_PUBLIC_SHOW_EXAMPLE_DATA === 'true' || process.env.NODE_ENV !== 'production') && (
          <Card>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Try the example pipeline (dev)</h2>
                <p className="text-sm text-gray-600">Create demo connectors and run a unification pipeline.</p>
              </div>
              <a href="/example-data" className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
                Go to Example Data
              </a>
            </CardContent>
          </Card>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here&apos;s an overview of your data processing activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Pipelines"
            value={stats?.pipelines?.total || 0}
            changePercent={stats?.trends?.pipelines?.percent}
            direction={stats?.trends?.pipelines?.direction || 'up'}
            icon={GitBranch}
          />
          <StatCard
            title="Active Connectors"
            value={stats?.connectors?.active || 0}
            changePercent={stats?.trends?.connectors?.percent}
            direction={stats?.trends?.connectors?.direction || 'up'}
            icon={Database}
          />
          <StatCard
            title="Records Processed Today"
            value={stats?.data_processed?.today || 0}
            changePercent={stats?.trends?.records_processed?.percent}
            direction={stats?.trends?.records_processed?.direction || 'up'}
            icon={TrendingUp}
          />
          <StatCard
            title="Running Pipelines"
            value={stats?.pipelines?.running || 0}
            icon={Activity}
          />
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Data Processing Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={performanceData}
              xKey="date"
              lines={[
                { key: 'records', name: 'Records Processed', color: '#3b82f6' }
              ]}
              isLoading={isLoading}
              height={250}
            />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pipelines */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pipeline Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((pipeline) => (
                    <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          pipeline.status === 'running'
                            ? 'bg-blue-500'
                            : pipeline.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          <p className="text-sm text-gray-500">Last run: {pipeline.lastRun}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{pipeline.recordsProcessed.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">records</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Real-time Metrics */}
          <div className="space-y-6">
            <SystemMetricsWidget />
            <NotificationsWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}