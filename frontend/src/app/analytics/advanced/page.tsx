'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { TrendChart } from '@/components/charts/trend-chart';
import { ComparativeChart } from '@/components/charts/comparative-chart';
import { PredictiveIndicator } from '@/components/charts/predictive-indicator';
import { LineChart } from '@/components/charts/line-chart';
import { Download, Calendar, RefreshCw, FileText } from 'lucide-react';

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

const AdvancedAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [comparativeData, setComparativeData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      // Calculate date range
      const end = new Date();
      const start = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      start.setDate(end.getDate() - days);

      // Fetch time series data
      const tsResponse = await fetch(
        `${baseUrl}/api/v1/analytics/advanced/time-series?start_date=${start.toISOString()}&end_date=${end.toISOString()}&interval=day`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (tsResponse.ok) {
        const tsData = await tsResponse.json();
        setTimeSeriesData(tsData.data || []);
      }

      // Fetch trend analysis
      const trendResponse = await fetch(
        `${baseUrl}/api/v1/analytics/advanced/trend-analysis?metric=records_processed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            start: start.toISOString(),
            end: end.toISOString()
          })
        }
      );

      if (trendResponse.ok) {
        const trend = await trendResponse.json();
        setTrendData(trend);
      }

      // Fetch predictive indicators
      const predResponse = await fetch(
        `${baseUrl}/api/v1/analytics/advanced/predictive-indicators`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (predResponse.ok) {
        const pred = await predResponse.json();
        setPredictiveData(pred);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const end = new Date();
      const start = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      start.setDate(end.getDate() - days);

      const response = await fetch(
        `${baseUrl}/api/v1/analytics/advanced/export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            export_format: format,
            export_type: 'analytics',
            time_range: {
              start: start.toISOString(),
              end: end.toISOString()
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Download file
        const blob = new Blob([data.content], { type: data.mime_type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <DashboardLayout>
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
            {/* Time Range Selector */}
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

            {/* Export Buttons */}
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

            {/* Refresh */}
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
          <LineChart
            data={timeSeriesData.map(d => ({
              date: d.timestamp,
              value: d.records_processed || 0
            }))}
            title="Records Processed Over Time"
            dataKey="value"
            xAxisKey="date"
          />
        </div>

        {/* Trend Analysis */}
        {trendData && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <TrendChart
              data={timeSeriesData.map(d => ({
                timestamp: d.timestamp,
                value: d.records_processed || 0
              }))}
              title="Trend Analysis - Records Processed"
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
              value: d.success_rate || 0
            }))}
            title="Success Rate Trend"
            dataKey="value"
            trendDirection="up"
            percentChange={2.5}
          />
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
                ? (timeSeriesData.reduce((sum, d) => sum + (d.success_rate || 0), 0) / timeSeriesData.length).toFixed(1)
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

        {/* Report Generation */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate Custom Report</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create comprehensive analytics reports
              </p>
            </div>
            <FileText className="w-6 h-6 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Executive Summary</h4>
              <p className="text-sm text-gray-600">High-level KPIs and trends</p>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Detailed Analytics</h4>
              <p className="text-sm text-gray-600">Comprehensive metrics report</p>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Custom Report</h4>
              <p className="text-sm text-gray-600">Build your own report</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalyticsPage;
