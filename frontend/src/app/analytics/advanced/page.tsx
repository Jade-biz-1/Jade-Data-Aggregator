'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TrendChart } from '@/components/charts/trend-chart';
import { ComparativeChart } from '@/components/charts/comparative-chart';
import { PredictiveIndicator } from '@/components/charts/predictive-indicator';
import { LineChart } from '@/components/charts/line-chart';
import { Download, RefreshCw, FileText, BarChart2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface TrendData {
  metric: string;
  trend_direction: 'up' | 'down' | 'stable';
  percent_change: number;
  first_period_avg: number;
  second_period_avg: number;
  analysis: string;
}

interface TimeSeriesData {
  timestamp: string;
  records_processed?: number;
  success_rate?: number;
  avg_duration?: number;
  error_count?: number;
}

interface PredictiveData {
  prediction_available: boolean;
  predictions?: {
    next_day_records: number;
    next_day_success_rate: number;
    confidence: 'high' | 'medium' | 'low';
  };
  volatility?: {
    records_std_dev: number;
    success_rate_std_dev: number;
  };
  recommendation?: string;
}

interface ComparativeEntry {
  name: string;
  success_rate: number;
  failure_rate: number;
}

const AdvancedAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [successRateTrend, setSuccessRateTrend] = useState<TrendData | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeEntry[]>([]);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError, toasts } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    start.setDate(end.getDate() - days);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { start: startISO, end: endISO } = getDateRange();

      // Fetch time-series, both trend analyses, and predictive in parallel.
      // Time-series: backend is POST with query params (not body).
      // Trend analysis: metric goes as query param, time range goes as body.
      const [tsResponse, trendResponse, successTrendResponse, predResponse] = await Promise.all([
        apiClient.fetch<any>('/analytics/advanced/time-series', {
          method: 'POST',
          params: { start_date: startISO, end_date: endISO, interval: 'day' },
        }),
        apiClient.post<any>(
          '/analytics/advanced/trend-analysis',
          { start: startISO, end: endISO },
          { params: { metric: 'records_processed' } },
        ),
        apiClient.post<any>(
          '/analytics/advanced/trend-analysis',
          { start: startISO, end: endISO },
          { params: { metric: 'success_rate' } },
        ),
        apiClient.fetch<any>('/analytics/advanced/predictive-indicators'),
      ]);

      // apiClient returns raw JSON — no .data wrapper
      setTimeSeriesData((tsResponse as any).data || []);
      setTrendData(trendResponse as any);
      setSuccessRateTrend(successTrendResponse as any);
      setPredictiveData(predResponse as any);

      // Comparative analytics: fetch pipeline list, compare up to 5
      try {
        const pipelines = await apiClient.getPipelines();
        const pipelineIds: number[] = pipelines.slice(0, 5).map((p: any) => p.id);
        if (pipelineIds.length >= 2) {
          const queryStr = pipelineIds.map(id => `pipeline_ids=${id}`).join('&');
          const compResponse = await apiClient.post<any>(
            `/analytics/advanced/comparative-analytics?${queryStr}`,
            { start: startISO, end: endISO },
          );
          const rawComparison = (compResponse as any).comparison || {};
          const chartData: ComparativeEntry[] = Object.entries(rawComparison).map(
            ([name, info]: [string, any]) => ({
              name,
              success_rate: Math.round(info.metrics?.success_rate ?? 0),
              failure_rate: Math.round(info.metrics?.failure_rate ?? 0),
            }),
          );
          setComparativeData(chartData);
        }
      } catch (e) {
        // Comparative analytics is best-effort; don't fail the whole page
        console.warn('Comparative analytics unavailable:', e);
      }

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const { start, end } = getDateRange();

      // apiClient returns raw JSON — the export response includes content, mime_type, filename
      const response = await apiClient.post<any>('/analytics/advanced/export', {
        export_format: format,
        export_type: 'analytics',
        time_range: { start, end },
      });

      const blob = new Blob([(response as any).content || ''], {
        type: (response as any).mime_type || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (response as any).filename || `analytics-${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      showError('Failed to export analytics');
    }
  };

  const handleGenerateReport = async (
    reportType: 'executive_summary' | 'detailed_analytics' | 'custom',
  ) => {
    setGeneratingReport(reportType);
    try {
      const { start, end } = getDateRange();

      const report = await apiClient.post<any>('/analytics/advanced/reports/generate', {
        report_type: reportType,
        time_range: { start, end },
      });

      // Download the report as formatted JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      success(`${reportType.replace(/_/g, ' ')} report generated`);
    } catch (error: any) {
      console.error('Report generation error:', error);
      showError('Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
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

  if (!features?.analytics?.view) {
    return (
      <DashboardLayout>
        <AccessDenied />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analytics with trends, predictions, and comparisons
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>

            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Records Processed Over Time</h3>
          <LineChart
            data={timeSeriesData.map(d => ({
              date: d.timestamp,
              value: d.records_processed || 0,
            }))}
            xKey="date"
            lines={[{ key: 'value', name: 'Records Processed', color: '#3b82f6' }]}
          />
        </div>

        {/* Records Processed Trend Analysis */}
        {trendData && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <TrendChart
              data={timeSeriesData.map(d => ({
                timestamp: d.timestamp,
                value: d.records_processed || 0,
              }))}
              title="Trend Analysis — Records Processed"
              dataKey="value"
              trendDirection={trendData.trend_direction}
              percentChange={trendData.percent_change}
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{trendData.analysis}</p>
            </div>
          </div>
        )}

        {/* Success Rate Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <TrendChart
            data={timeSeriesData.map(d => ({
              timestamp: d.timestamp,
              value: d.success_rate || 0,
            }))}
            title="Success Rate Trend"
            dataKey="value"
            trendDirection={successRateTrend?.trend_direction ?? 'stable'}
            percentChange={successRateTrend?.percent_change ?? 0}
          />
          {successRateTrend?.analysis && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{successRateTrend.analysis}</p>
            </div>
          )}
        </div>

        {/* Predictive Analytics */}
        {predictiveData && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <PredictiveIndicator data={predictiveData} />
          </div>
        )}

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Records Processed</h3>
            <p className="text-3xl font-bold text-gray-900">
              {timeSeriesData.reduce((sum, d) => sum + (d.records_processed || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">In selected period</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Average Success Rate</h3>
            <p className="text-3xl font-bold text-green-600">
              {timeSeriesData.length > 0
                ? (
                    timeSeriesData.reduce((sum, d) => sum + (d.success_rate || 0), 0) /
                    timeSeriesData.length
                  ).toFixed(1)
                : '0'}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Across all runs</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Errors</h3>
            <p className="text-3xl font-bold text-red-600">
              {timeSeriesData.reduce((sum, d) => sum + (d.error_count || 0), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Errors detected</p>
          </div>
        </div>

        {/* Comparative Analytics */}
        {comparativeData.length >= 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pipeline Comparison</h3>
            </div>
            <ComparativeChart
              data={comparativeData}
              metrics={['success_rate', 'failure_rate']}
              title="Success vs Failure Rate by Pipeline"
            />
          </div>
        )}

        {/* Report Generation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download comprehensive analytics reports as JSON
              </p>
            </div>
            <FileText className="w-6 h-6 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleGenerateReport('executive_summary')}
              disabled={generatingReport === 'executive_summary'}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-1">
                {generatingReport === 'executive_summary' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <h4 className="font-semibold text-gray-900">Executive Summary</h4>
              </div>
              <p className="text-sm text-gray-600">High-level KPIs and trends</p>
            </button>

            <button
              onClick={() => handleGenerateReport('detailed_analytics')}
              disabled={generatingReport === 'detailed_analytics'}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-1">
                {generatingReport === 'detailed_analytics' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <h4 className="font-semibold text-gray-900">Detailed Analytics</h4>
              </div>
              <p className="text-sm text-gray-600">Comprehensive metrics report</p>
            </button>

            <button
              onClick={() => handleGenerateReport('custom')}
              disabled={generatingReport === 'custom'}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 mb-1">
                {generatingReport === 'custom' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <h4 className="font-semibold text-gray-900">Custom Report</h4>
              </div>
              <p className="text-sm text-gray-600">Build your own report</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalyticsPage;
