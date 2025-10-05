'use client';

import React, { useState } from 'react';
import { Code, Play, Save, X, AlertCircle, Check } from 'lucide-react';

interface TransformationEditorProps {
  initialCode?: string;
  initialName?: string;
  onSave?: (name: string, code: string) => void;
  onTest?: (code: string, testData: any) => Promise<any>;
  onClose?: () => void;
}

export const TransformationEditor: React.FC<TransformationEditorProps> = ({
  initialCode = '',
  initialName = '',
  onSave,
  onTest,
  onClose
}) => {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [testData, setTestData] = useState('[]');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      // Parse test data
      let parsedData;
      try {
        parsedData = JSON.parse(testData);
      } catch (e) {
        throw new Error('Invalid JSON in test data');
      }

      if (onTest) {
        const result = await onTest(code, parsedData);
        setTestResult(result);
      } else {
        // Default local test (for demo purposes)
        setTestResult({
          success: true,
          output: parsedData,
          message: 'Test completed (using test mode)'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a transformation name');
      return;
    }

    if (!code.trim()) {
      setError('Please enter transformation code');
      return;
    }

    if (onSave) {
      onSave(name, code);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Transformation Editor
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !code.trim()}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
            >
              <Play className="w-4 h-4" />
              {testing ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Name Input */}
        <div className="mt-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Transformation name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Code Editor */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Transformation Code (Python)
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="def transform(data):&#10;    # Your transformation code here&#10;    return data"
            className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Test Data */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Test Data (JSON)
          </label>
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder='[{"id": 1, "name": "test"}]'
            className="flex-1 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="mx-4 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              {testResult.success ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Test Result
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Test Failed
                </>
              )}
            </h4>
          </div>

          {testResult.message && (
            <p className="text-sm text-gray-700 mb-2">{testResult.message}</p>
          )}

          {testResult.output && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Output:</p>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-auto max-h-48">
                {JSON.stringify(testResult.output, null, 2)}
              </pre>
            </div>
          )}

          {testResult.error && (
            <p className="text-sm text-red-700 mt-2">{testResult.error}</p>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Write a Python function that takes data as input and returns transformed data.
            Use the test panel to verify your transformation with sample data.
          </p>
        </div>
      </div>
    </div>
  );
};
