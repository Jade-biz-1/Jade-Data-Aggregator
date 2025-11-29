'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Search, Code, Play, BookOpen, Copy, Check, Filter, Star, TrendingUp, Download } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface TransformationFunction {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  return_type: string;
  examples: Array<{
    input: any;
    output: any;
    description?: string;
  }>;
  usage_count?: number;
  tags?: string[];
  created_by?: string;
  created_at?: string;
}

interface FunctionTestResult {
  success: boolean;
  output?: any;
  error?: string;
  execution_time_ms?: number;
}

const TransformationFunctionsPage = () => {
  const [functions, setFunctions] = useState<TransformationFunction[]>([]);
  const [filteredFunctions, setFilteredFunctions] = useState<TransformationFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<TransformationFunction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<FunctionTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchFunctions();
  }, []);

  useEffect(() => {
    filterFunctions();
  }, [functions, searchTerm, selectedCategory]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetch<any>('/transformations/functions');
      setFunctions(response.data.functions || []);
      success('Function library loaded');
    } catch (error: any) {
      console.error('Error fetching functions:', error);
      showError('Failed to load function library');
    } finally {
      setLoading(false);
    }
  };

  const filterFunctions = () => {
    let filtered = functions;

    if (searchTerm) {
      filtered = filtered.filter(
        (fn) =>
          fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fn.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((fn) => fn.category === selectedCategory);
    }

    setFilteredFunctions(filtered);
  };

  const testFunction = async (func: TransformationFunction) => {
    if (!testInput.trim()) {
      showError('Please enter test input');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const parsedInput = JSON.parse(testInput);
      const response = await apiClient.post<any>(`/transformations/functions/${func.id}/test`, {
        input: parsedInput
      });

      setTestResult({
        success: true,
        output: response.data.output,
        execution_time_ms: response.data.execution_time_ms
      });
      success('Function tested successfully');
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        error: error.response?.data?.detail || error.message || 'Test failed'
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

  const categories = ['all', ...Array.from(new Set(functions.map((fn) => fn.category)))];

  // Permission check
  if (permissionsLoading) {
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

  return (
    <DashboardLayout>
      <ToastContainer toasts={[]} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transformation Function Library</h1>
            <p className="text-gray-600 mt-1">
              Browse, test, and use pre-built transformation functions
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search functions by name, description, or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Function List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Functions ({filteredFunctions.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredFunctions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Code className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No functions found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                ) : (
                  filteredFunctions.map((func) => (
                    <button
                      key={func.id}
                      onClick={() => {
                        setSelectedFunction(func);
                        setTestInput('');
                        setTestResult(null);
                      }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedFunction?.id === func.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Code className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {func.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {func.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {func.category}
                            </span>
                            {func.usage_count && func.usage_count > 0 && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {func.usage_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Function Details */}
          <div className="lg:col-span-2">
            {selectedFunction ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedFunction.name}
                      </h2>
                      <p className="text-gray-600">{selectedFunction.description}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedFunction.code)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded">
                      {selectedFunction.category}
                    </span>
                    {selectedFunction.tags?.map((tag) => (
                      <span key={tag} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                    {selectedFunction.usage_count && selectedFunction.usage_count > 0 && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Used {selectedFunction.usage_count} times
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Parameters */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Parameters</h3>
                    <div className="space-y-2">
                      {selectedFunction.parameters.map((param) => (
                        <div key={param.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                          <Code className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
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
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return Type */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Return Type</h3>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {selectedFunction.return_type}
                      </span>
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Implementation</h3>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{selectedFunction.code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Examples */}
                  {selectedFunction.examples.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Usage Examples
                      </h3>
                      <div className="space-y-4">
                        {selectedFunction.examples.map((example, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            {example.description && (
                              <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-2">Input</div>
                                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(example.input, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-2">Output</div>
                                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(example.output, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Function */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Test Function
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Input (JSON)
                        </label>
                        <textarea
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder='{"value": "test"}'
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>

                      <button
                        onClick={() => testFunction(selectedFunction)}
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
                            {testResult.execution_time_ms && (
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center py-12 px-4">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Function</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a function from the list to view details, examples, and test it
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TransformationFunctionsPage;
