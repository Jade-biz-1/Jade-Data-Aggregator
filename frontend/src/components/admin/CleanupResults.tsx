/**
 * Cleanup Results Component
 * Phase 8: System Maintenance Dashboard
 *
 * Displays results from cleanup operations
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Clock, Database, FileText, Download } from 'lucide-react';

interface CleanupOperation {
  operation: string;
  success: boolean;
  records_deleted?: number;
  files_deleted?: number;
  space_freed_mb?: number;
  duration_seconds?: number;
  error_message?: string;
}

export interface CleanupResultsData {
  timestamp: string;
  total_duration_seconds: number;
  operations: CleanupOperation[];
  summary?: {
    total_records_deleted: number;
    total_space_freed_mb: number;
    successful_operations: number;
    failed_operations: number;
  };
}

interface CleanupResultsProps {
  results: CleanupResultsData | null;
  onExport?: () => void;
}

export function CleanupResults({ results, onExport }: CleanupResultsProps) {
  if (!results) {
    return null;
  }

  const getOperationIcon = (operation: CleanupOperation) => {
    if (!operation.success) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if ((operation.records_deleted || 0) > 0 || (operation.files_deleted || 0) > 0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getOperationTitle = (operationName: string) => {
    const titles: Record<string, string> = {
      activity_logs: 'Activity Logs',
      temp_files: 'Temporary Files',
      orphaned_data: 'Orphaned Data',
      execution_logs: 'Execution Logs',
      database_vacuum: 'Database Vacuum',
      expired_sessions: 'Expired Sessions',
    };
    return titles[operationName] || operationName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      {results.summary && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>Cleanup Complete</span>
              </CardTitle>
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Database className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {results.summary.total_records_deleted.toLocaleString()}
                </div>
                <p className="text-xs text-green-700 mt-1">Records Deleted</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {results.summary.total_space_freed_mb.toFixed(2)} MB
                </div>
                <p className="text-xs text-blue-700 mt-1">Space Freed</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">
                  {results.summary.successful_operations}
                </div>
                <p className="text-xs text-purple-700 mt-1">Successful</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {results.total_duration_seconds.toFixed(1)}s
                </div>
                <p className="text-xs text-gray-700 mt-1">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Details</CardTitle>
          <p className="text-sm text-gray-500">
            Completed at {new Date(results.timestamp).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.operations.map((operation, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  operation.success
                    ? 'bg-white border-gray-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getOperationIcon(operation)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {getOperationTitle(operation.operation)}
                      </h4>

                      {operation.success ? (
                        <div className="mt-2 space-y-1">
                          {operation.records_deleted !== undefined && operation.records_deleted > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Records:</span>{' '}
                              {operation.records_deleted.toLocaleString()} deleted
                            </p>
                          )}
                          {operation.files_deleted !== undefined && operation.files_deleted > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Files:</span>{' '}
                              {operation.files_deleted.toLocaleString()} deleted
                            </p>
                          )}
                          {operation.space_freed_mb !== undefined && operation.space_freed_mb > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Space:</span>{' '}
                              {operation.space_freed_mb.toFixed(2)} MB freed
                            </p>
                          )}
                          {operation.records_deleted === 0 && operation.files_deleted === 0 && (
                            <p className="text-sm text-yellow-600">
                              No items found to clean
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">
                            {operation.error_message || 'Operation failed'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {operation.duration_seconds !== undefined && (
                    <div className="text-right ml-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {operation.duration_seconds.toFixed(2)}s
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failed Operations Warning */}
      {results.summary && results.summary.failed_operations > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  {results.summary.failed_operations} operation(s) failed
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Please review the error messages above and contact support if the issue persists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
