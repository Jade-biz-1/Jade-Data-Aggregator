'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Search, Code, Play, BookOpen, Copy, Check, Filter, Star, TrendingUp, Download, ArrowLeft, Plus } from 'lucide-react';
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

const BUILTIN_FUNCTIONS: TransformationFunction[] = [
  { id: 'builtin-upper', name: 'upper(value)', category: 'String', description: 'Convert a string to uppercase.', code: 'upper(row["first_name"])', parameters: [{name:'value',type:'str',required:true,description:'Input string'}], return_type:'str', examples:[{input:{first_name:'alice'},output:'ALICE',description:'Uppercase a name'}], tags:['string','case'] },
  { id: 'builtin-lower', name: 'lower(value)', category: 'String', description: 'Convert a string to lowercase.', code: 'lower(row["email"])', parameters: [{name:'value',type:'str',required:true,description:'Input string'}], return_type:'str', examples:[{input:{email:'ALICE@EXAMPLE.COM'},output:'alice@example.com'}], tags:['string','case'] },
  { id: 'builtin-strip', name: 'strip(value)', category: 'String', description: 'Remove leading and trailing whitespace.', code: 'strip(row["name"])', parameters: [{name:'value',type:'str',required:true}], return_type:'str', examples:[{input:{name:'  Alice  '},output:'Alice'}], tags:['string','trim'] },
  { id: 'builtin-substr', name: 'substr(value, start, length)', category: 'String', description: 'Extract a substring by start position and length.', code: 'substr(row["phone"], 0, 3)', parameters: [{name:'value',type:'str',required:true},{name:'start',type:'int',required:true},{name:'length',type:'int',required:true}], return_type:'str', examples:[{input:{phone:'0412345678'},output:'041',description:'Extract area code'}], tags:['string','extract'] },
  { id: 'builtin-concat', name: 'concat(a, b, ...)', category: 'String', description: 'Concatenate two or more values into one string.', code: 'concat(row["first_name"], " ", row["last_name"])', parameters: [{name:'values',type:'str',required:true,description:'Two or more values to join'}], return_type:'str', examples:[{input:{first_name:'Alice',last_name:'Smith'},output:'Alice Smith',description:'Full name from parts'}], tags:['string','join'] },
  { id: 'builtin-replace', name: 'replace(value, old, new)', category: 'String', description: 'Replace all occurrences of a substring.', code: 'replace(row["code"], "-", "")', parameters: [{name:'value',type:'str',required:true},{name:'old',type:'str',required:true},{name:'new',type:'str',required:true}], return_type:'str', examples:[{input:{code:'AU-001-XY'},output:'AU001XY'}], tags:['string','replace'] },
  { id: 'builtin-int', name: 'int(value)', category: 'Type', description: 'Cast a value to an integer.', code: 'int(row["quantity"])', parameters: [{name:'value',type:'any',required:true}], return_type:'int', examples:[{input:{quantity:'42'},output:42}], tags:['cast','type'] },
  { id: 'builtin-float', name: 'float(value)', category: 'Type', description: 'Cast a value to a floating-point number.', code: 'float(row["price"])', parameters: [{name:'value',type:'any',required:true}], return_type:'float', examples:[{input:{price:'9.99'},output:9.99}], tags:['cast','type'] },
  { id: 'builtin-str', name: 'str(value)', category: 'Type', description: 'Cast a value to a string.', code: 'str(row["id"])', parameters: [{name:'value',type:'any',required:true}], return_type:'str', examples:[{input:{id:123},output:'123'}], tags:['cast','type'] },
  { id: 'builtin-round', name: 'round(value, decimals)', category: 'Math', description: 'Round a number to a given number of decimal places.', code: 'round(float(row["price"]), 2)', parameters: [{name:'value',type:'float',required:true},{name:'decimals',type:'int',required:false,description:'Default 0'}], return_type:'float', examples:[{input:{price:'9.999'},output:10.0}], tags:['math','round'] },
  { id: 'builtin-abs', name: 'abs(value)', category: 'Math', description: 'Return the absolute value of a number.', code: 'abs(int(row["balance"]))', parameters: [{name:'value',type:'number',required:true}], return_type:'number', examples:[{input:{balance:-150},output:150}], tags:['math'] },
  { id: 'builtin-coalesce', name: 'coalesce(value, default)', category: 'Null', description: 'Return value if not None/null, otherwise return the default.', code: 'row["middle_name"] or ""', parameters: [{name:'value',type:'any',required:true},{name:'default',type:'any',required:true}], return_type:'any', examples:[{input:{middle_name:null},output:'',description:'Replace null with empty string'}], tags:['null','default'] },
  { id: 'builtin-date', name: 'date format', category: 'Date', description: 'Format or parse dates using Python strftime/strptime patterns.', code: 'row["created_at"][:10]', parameters: [{name:'value',type:'str',required:true},{name:'format',type:'str',required:false}], return_type:'str', examples:[{input:{created_at:'2024-03-15T10:30:00'},output:'2024-03-15',description:'Extract date part from ISO datetime'}], tags:['date','format'] },
];

const TransformationFunctionsPage = () => {
  const router = useRouter();
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
  const { success, error: showError, toasts } = useToast();

  useEffect(() => {
    fetchFunctions();
  }, []);

  useEffect(() => {
    filterFunctions();
  }, [functions, searchTerm, selectedCategory]);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetch<any>('/transformation-functions');
      const raw: any[] = (response as any).functions || [];
      const dbFunctions = raw.map((f: any) => ({
        id: String(f.id),
        name: f.name,
        category: f.category ?? 'Custom',
        description: f.description ?? '',
        code: '',
        parameters: f.parameters ?? [],
        return_type: f.return_type ?? '',
        examples: [],
        usage_count: f.use_count ?? 0,
        tags: f.tags ?? [],
        created_by: f.created_by ? String(f.created_by) : undefined,
        created_at: f.created_at,
      }));
      // Always show built-in functions first, then user-created ones
      setFunctions([...BUILTIN_FUNCTIONS, ...dbFunctions]);
    } catch (error: any) {
      console.error('Error fetching functions:', error);
      // Even on error, show built-in functions
      setFunctions(BUILTIN_FUNCTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFunction = async (func: TransformationFunction) => {
    setSelectedFunction(func);
    setTestInput('');
    setTestResult(null);
    // Built-in functions only exist client-side — no backend detail call needed
    if (func.id.startsWith('builtin-')) return;
    try {
      const detail = await apiClient.fetch<any>(`/transformation-functions/${func.id}`);
      const d = detail as any;
      setSelectedFunction({
        ...func,
        code: d.function_code ?? '',
        parameters: d.parameters ?? func.parameters,
        return_type: d.return_type ?? func.return_type,
        examples: (d.example_input != null || d.example_output != null)
          ? [{ input: d.example_input, output: d.example_output, description: d.example_usage }]
          : [],
      });
    } catch (error: any) {
      console.error('Error fetching function detail:', error);
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
    if (func.id.startsWith('builtin-')) {
      showError('Built-in functions cannot be tested here — use them in a Map transformation node in the Pipeline Builder.');
      return;
    }
    if (!testInput.trim()) {
      showError('Please enter test input');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const parsedInput = JSON.parse(testInput);
      const response = await apiClient.post<any>(`/transformation-functions/${func.id}/test`, {
        test_input: parsedInput
      });

      const r = response as any;
      setTestResult({
        success: r.success !== false,
        output: r.output ?? r.result,
        error: r.error,
        execution_time_ms: r.execution_time_ms
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
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/transformations')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Function Library</h1>
              <p className="text-gray-600 mt-1">
                Built-in and custom transformation functions — click any function to see examples and copy the expression
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/transformations/functions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Function
          </button>
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
                      onClick={() => handleSelectFunction(func)}
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
                  {(selectedFunction.examples?.length ?? 0) > 0 && (
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
