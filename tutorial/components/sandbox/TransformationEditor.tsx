'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';

interface TransformationEditorProps {
  initialCode?: string;
  sampleInput?: any;
  onSave?: (code: string) => void;
  height?: string;
}

interface TestResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime?: number;
}

const DEFAULT_CODE = `# Define your transformation function
def transform(data):
    """
    Transform the input data.

    Args:
        data: Input data (dict, list, or primitive)

    Returns:
        Transformed data
    """
    # Example: Convert all string values to uppercase
    if isinstance(data, dict):
        return {k: v.upper() if isinstance(v, str) else v
                for k, v in data.items()}
    return data

# The transform function will be called with your input data
`;

const DEFAULT_SAMPLE_INPUT = {
  name: "John Doe",
  email: "john@example.com",
  status: "active",
  age: 30
};

export default function TransformationEditor({
  initialCode = DEFAULT_CODE,
  sampleInput = DEFAULT_SAMPLE_INPUT,
  onSave,
  height = '500px'
}: TransformationEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState(JSON.stringify(sampleInput, null, 2));
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(false);
  }, [code]);

  const runTransformation = async () => {
    setIsRunning(true);
    setTestResult(null);

    const startTime = performance.now();

    try {
      // Parse the input
      const parsedInput = JSON.parse(input);

      // Simulate Python execution (in a real app, this would call the backend API)
      // For demo purposes, we'll use JavaScript to simulate the transformation
      const result = await simulatePythonExecution(code, parsedInput);

      const executionTime = performance.now() - startTime;

      setTestResult({
        success: true,
        output: result,
        executionTime: Math.round(executionTime)
      });
    } catch (error: any) {
      const executionTime = performance.now() - startTime;

      setTestResult({
        success: false,
        error: error.message || 'Unknown error occurred',
        executionTime: Math.round(executionTime)
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Simulate Python execution with JavaScript (for demo purposes)
  const simulatePythonExecution = async (pythonCode: string, data: any): Promise<any> => {
    // In production, this would make an API call to the backend
    // For now, we'll do a simple JavaScript simulation

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Basic simulation - just apply a simple transformation
    if (pythonCode.includes('upper()')) {
      if (typeof data === 'object' && !Array.isArray(data)) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
          result[key] = typeof value === 'string' ? value.toUpperCase() : value;
        }
        return result;
      }
    }

    // If we can't simulate, return the input
    return data;
  };

  const resetCode = () => {
    setCode(DEFAULT_CODE);
    setInput(JSON.stringify(DEFAULT_SAMPLE_INPUT, null, 2));
    setTestResult(null);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
    setIsSaved(true);
  };

  const formatInput = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Invalid JSON, keep as is
    }
  };

  return (
    <div className="transformation-editor">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Python Transformation Code
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCode}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              {onSave && (
                <Button
                  variant={isSaved ? "outline" : "primary"}
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center gap-2"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <Card>
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height={height}
                defaultLanguage="python"
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                }}
              />
            </div>
          </Card>
        </div>

        {/* Input/Output Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Test Transformation
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={runTransformation}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </div>

          {/* Sample Input */}
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Sample Input (JSON)
                </label>
                <button
                  onClick={formatInput}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Format JSON
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter sample input data as JSON..."
              />
            </div>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Test Results
                  </h4>
                  {testResult.executionTime !== undefined && (
                    <span className="text-xs text-gray-500">
                      {testResult.executionTime}ms
                    </span>
                  )}
                </div>

                {testResult.success ? (
                  <div className="space-y-2">
                    <Alert type="success" className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Transformation successful!</div>
                        <div className="text-sm mt-1">Your transformation executed without errors.</div>
                      </div>
                    </Alert>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Output:
                      </label>
                      <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto max-h-64 text-sm font-mono">
                        {JSON.stringify(testResult.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <Alert type="error" className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Transformation failed</div>
                      <div className="text-sm mt-1 font-mono">{testResult.error}</div>
                    </div>
                  </Alert>
                )}
              </div>
            </Card>
          )}

          {/* No Results Yet */}
          {!testResult && !isRunning && (
            <Card className="bg-gray-50">
              <div className="text-center py-8 text-gray-500">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Click &quot;Run Test&quot; to test your transformation
                </p>
              </div>
            </Card>
          )}

          {/* Running State */}
          {isRunning && (
            <Card className="bg-blue-50">
              <div className="text-center py-8 text-blue-600">
                <div className="w-12 h-12 mx-auto mb-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-sm font-medium">
                  Executing transformation...
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Tips for writing transformations:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Define a <code className="bg-blue-100 px-1 rounded">transform(data)</code> function that takes input data and returns transformed output</li>
              <li>Use Python built-in functions and common libraries (json, re, datetime, etc.)</li>
              <li>Handle edge cases and validate input data types</li>
              <li>Test with different sample inputs to ensure your transformation works correctly</li>
              <li>Add comments to explain complex logic for future reference</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
