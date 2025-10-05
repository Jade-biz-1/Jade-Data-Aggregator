'use client';

import React, { useState, useEffect } from 'react';
import { Code, Filter, Layers, BarChart3, ArrowUpDown, Zap, Copy, Play, Eye } from 'lucide-react';

interface TransformationFunction {
  id?: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
  function_type: string;
  function_code: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  example_usage?: string;
  example_input?: any;
  example_output?: any;
  is_builtin?: boolean;
  use_count?: number;
  tags?: string[];
}

interface TransformationFunctionLibraryProps {
  onSelectFunction?: (func: TransformationFunction) => void;
  selectionMode?: boolean;
}

export const TransformationFunctionLibrary: React.FC<TransformationFunctionLibraryProps> = ({
  onSelectFunction,
  selectionMode = false
}) => {
  const [functions, setFunctions] = useState<TransformationFunction[]>([]);
  const [builtinFunctions, setBuiltinFunctions] = useState<TransformationFunction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<TransformationFunction | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'builtin' | 'all'>('builtin');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchFunctions();
    fetchBuiltinFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/transformation-functions/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFunctions(data.functions || []);
      }
    } catch (error) {
      console.error('Error fetching functions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuiltinFunctions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/transformation-functions/builtin`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBuiltinFunctions(data.functions || []);
      }
    } catch (error) {
      console.error('Error fetching builtin functions:', error);
    }
  };

  const handleTestFunction = async (func: TransformationFunction) => {
    if (!func.id || !func.example_input) return;

    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/transformation-functions/${func.id}/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test_input: func.example_input
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      }
    } catch (error) {
      console.error('Error testing function:', error);
      setTestResult({ success: false, error: 'Failed to test function' });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard');
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'filter':
        return <Filter className="w-5 h-5" />;
      case 'map':
        return <Layers className="w-5 h-5" />;
      case 'aggregate':
        return <BarChart3 className="w-5 h-5" />;
      case 'sort':
        return <ArrowUpDown className="w-5 h-5" />;
      default:
        return <Code className="w-5 h-5" />;
    }
  };

  const displayFunctions = view === 'builtin' ? builtinFunctions : functions;
  const filteredFunctions = selectedCategory
    ? displayFunctions.filter(f => f.category === selectedCategory)
    : displayFunctions;

  const categories = Array.from(new Set(displayFunctions.map(f => f.category)));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Transformation Function Library
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Browse and use pre-built transformation functions
        </p>

        {/* View Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setView('builtin')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === 'builtin'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Built-in
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Functions
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Functions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading functions...</p>
          </div>
        ) : filteredFunctions.length === 0 ? (
          <div className="text-center py-12">
            <Code className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No functions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredFunctions.map((func, index) => (
              <div
                key={func.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      {getCategoryIcon(func.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{func.display_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                          {func.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {func.function_type}
                        </span>
                        {func.is_builtin && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Built-in
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedFunction(func)}
                      className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {selectionMode && onSelectFunction && (
                      <button
                        onClick={() => onSelectFunction(func)}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Use this function"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Function Details Modal */}
      {selectedFunction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedFunction.display_name}</h3>
              <button
                onClick={() => {
                  setSelectedFunction(null);
                  setTestResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-700">Description</h4>
                <p className="text-sm text-gray-900 mt-1">{selectedFunction.description}</p>
              </div>

              {/* Parameters */}
              {selectedFunction.parameters && selectedFunction.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Parameters</h4>
                  <div className="mt-2 space-y-2">
                    {selectedFunction.parameters.map((param, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                        <span className="font-mono text-blue-600">{param.name}</span>
                        <span className="text-gray-500 ml-2">({param.type})</span>
                        {param.optional && <span className="text-gray-400 ml-1">- optional</span>}
                        <p className="text-gray-600 mt-1">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Usage */}
              {selectedFunction.example_usage && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Example Usage</h4>
                  <div className="mt-1 p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-x-auto">
                    {selectedFunction.example_usage}
                  </div>
                </div>
              )}

              {/* Function Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-700">Function Code</h4>
                  <button
                    onClick={() => handleCopyCode(selectedFunction.function_code)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-x-auto whitespace-pre">
                  {selectedFunction.function_code}
                </div>
              </div>

              {/* Test Function */}
              {selectedFunction.id && selectedFunction.example_input && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Test Function</h4>
                    <button
                      onClick={() => handleTestFunction(selectedFunction)}
                      disabled={testing}
                      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      {testing ? 'Testing...' : 'Run Test'}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded ${
                        testResult.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Test Passed' : 'Test Failed'}
                      </p>
                      {testResult.error && (
                        <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                      )}
                      {testResult.output && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Output:</p>
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(testResult.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              {selectionMode && onSelectFunction && (
                <button
                  onClick={() => {
                    onSelectFunction(selectedFunction);
                    setSelectedFunction(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Use This Function
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedFunction(null);
                  setTestResult(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
