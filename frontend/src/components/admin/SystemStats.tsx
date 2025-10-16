/**
 * System Statistics Component
 * Phase 8: System Maintenance Dashboard
 *
 * Displays database size, record counts, and temp files statistics
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, HardDrive, FileText, Clock, TrendingUp } from 'lucide-react';

interface DatabaseStats {
  size_mb: number;
  tables_count: number;
  total_records: number;
}

interface RecordCounts {
  users: number;
  pipelines: number;
  connectors: number;
  transformations: number;
  pipeline_runs: number;
  activity_logs: number;
  [key: string]: number;
}

interface TempFilesStats {
  file_count: number;
  total_size_mb: number;
  oldest_file_age_days: number;
}

export interface SystemStatsData {
  database: DatabaseStats;
  record_counts: RecordCounts;
  temp_files: TempFilesStats;
  last_vacuum?: string;
  last_cleanup?: string;
}

interface SystemStatsProps {
  stats: SystemStatsData | null;
  loading?: boolean;
}

export function SystemStats({ stats, loading = false }: SystemStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  const totalRecords = Object.values(stats.record_counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Database Size
            </CardTitle>
            <Database className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.database.size_mb.toFixed(2)} MB
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.database.tables_count} tables
            </p>
            {stats.last_vacuum && (
              <p className="text-xs text-gray-500 mt-1">
                Last vacuum: {new Date(stats.last_vacuum).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Records
            </CardTitle>
            <FileText className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Across all tables
            </p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Growing
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Temp Files
            </CardTitle>
            <HardDrive className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.temp_files.file_count}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.temp_files.total_size_mb.toFixed(2)} MB total
            </p>
            {stats.temp_files.oldest_file_age_days > 0 && (
              <div className="mt-2 flex items-center text-xs text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                Oldest: {stats.temp_files.oldest_file_age_days} days
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Record Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.record_counts)
              .sort(([, a], [, b]) => b - a)
              .map(([table, count]) => {
                const percentage = totalRecords > 0 ? (count / totalRecords) * 100 : 0;
                return (
                  <div key={table} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium capitalize text-gray-700">
                        {table.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Last Cleanup Info */}
      {stats.last_cleanup && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Last Cleanup</p>
                <p className="text-xs text-gray-500">
                  {new Date(stats.last_cleanup).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
