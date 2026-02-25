'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Code, ArrowLeft, Copy, Check, Play, BookOpen, TrendingUp, Star } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface FunctionDetail {
  id: number;
  name: string;
  display_name: string;
  description: string;
  function_code: string;
  category: string;
  function_type: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }> | null;
  return_type: string | null;
  example_usage: string | null;
  example_input: any;
  example_output: any;
  is_builtin: boolean;
  is_public: boolean;
  use_count: number;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UsageStats {
  function_id: number;
  function_name: string;
  display_name: string;
  use_count: number;
  is_builtin: boolean;
  is_public: boolean;
  category: string;
  created_at: string | null;
}

interface FunctionTestResult {
  success: boolean;
  output?: any;
  error?: string;
  execution_time_ms?: number;
}

const TransformationFunctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [func, setFunc] = useState<FunctionDetail | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<FunctionTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError, toasts } = useToast();

  useEffect(() => {
    if (id) {
      fetchFunctionDetail();
      fetchUsageStats();
    }
  }, [id]);

  const fetchFunctionDetail = async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetch<any>(`/transformation-functions/${id}`);
      setFunc(response as any);
    } catch (error: any) {
      console.error('Error fetching function detail:', error);
      showError('Failed to load function details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await apiClient.fetch<any>(`/transformation-functions/${id}/usage`);
      setUsageStats(response as any);
    } catch (error: any) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const testFunction = async () => {
    if (!testInput.trim()) {
      showError('Please enter test input');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const parsedInput = JSON.parse(testInput);
      const response = await apiClient.post<any>(`/transformation-functions/${id}/test`, {
        test_input: parsedInput,
      });

      const r = response as any;
      if (r.success === false) {
        setTestResult({ success: false, error: r.error });
        showError('Function test failed');
      } else {
        setTestResult({
          success: true,
          output: r.output ?? r.result,
          execution_time_ms: r.execution_time_ms,
        });
        success('Function tested successfully');
        // Refresh usage stats
        fetchUsageStats();
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Test failed',
      });
      showError('Function test failed');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (permissionsLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.transformations?.view) {
    return (
      <DashboardLayout>
        <AccessDenied />
      </DashboardLayout>
    );
  }

  if (!func) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Code className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Function not found</h3>
        </div>
      </DashboardLayout>
    );
  }

  const hasExample = func.example_input != null || func.example_output != null;

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Back button + header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Function Library
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{func.display_name || func.name}</h1>
              <p className="text-gray-600 mt-1">{func.description}</p>
            </div>
            <button
              onClick={() => copyToClipboard(func.function_code)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          {/* Meta badges */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded">
              {func.category}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded">
              {func.function_type}
            </span>
            {func.is_builtin && (
              <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded">
                Built-in
              </span>
            )}
            {func.is_public && (
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded">
                Public
              </span>
            )}
            {func.tags?.map((tag) => (
              <span key={tag} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                {tag}
              </span>
            ))}
            {(usageStats?.use_count ?? func.use_count) > 0 && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                Used {usageStats?.use_count ?? func.use_count} times
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: meta + parameters + usage stats */}
          <div className="space-y-4">
            {/* Parameters */}
            {func.parameters && func.parameters.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Parameters</h2>
                <div className="space-y-2">
                  {func.parameters.map((param) => (
                    <div key={param.name} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {param.name}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                          {param.type}
                        </span>
                        {param.required && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {param.description && (
                        <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return type */}
            {func.return_type && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Return Type</h2>
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {func.return_type}
                </span>
              </div>
            )}

            {/* Usage stats */}
            {usageStats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Stats
                </h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total uses</dt>
                    <dd className="font-semibold text-gray-900">{usageStats.use_count}</dd>
                  </div>
                  {usageStats.created_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Created</dt>
                      <dd className="text-gray-700">
                        {new Date(usageStats.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Right column: code + example + test */}
          <div className="lg:col-span-2 space-y-6">
            {/* Code */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Implementation</h2>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{func.function_code}</code>
              </pre>
            </div>

            {/* Example usage */}
            {(func.example_usage || hasExample) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Example
                </h2>
                {func.example_usage && (
                  <p className="text-sm text-gray-600 mb-4">{func.example_usage}</p>
                )}
                {hasExample && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Input</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(func.example_input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Output</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(func.example_output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test function */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Function
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Input (JSON)
                  </label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder='{"value": "test"}'
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <button
                  onClick={testFunction}
                  disabled={testing || !testInput.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Test
                    </>
                  )}
                </button>

                {testResult && (
                  <div
                    className={`p-4 rounded-lg ${
                      testResult.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Code className="w-5 h-5 text-red-600" />
                      )}
                      <span
                        className={`font-semibold ${
                          testResult.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {testResult.success ? 'Test Passed' : 'Test Failed'}
                      </span>
                      {testResult.execution_time_ms != null && (
                        <span className="text-sm text-gray-600 ml-auto">
                          {testResult.execution_time_ms.toFixed(2)}ms
                        </span>
                      )}
                    </div>
                    {testResult.success ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Output:</div>
                        <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                          {JSON.stringify(testResult.output, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-red-900 mb-2">Error:</div>
                        <p className="text-sm text-red-800">{testResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransformationFunctionDetailPage;
