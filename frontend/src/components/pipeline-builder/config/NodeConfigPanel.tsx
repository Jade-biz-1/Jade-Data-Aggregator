'use client';

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceNodeConfig } from './SourceNodeConfig';
import { TransformationNodeConfig } from './TransformationNodeConfig';
import { DestinationNodeConfig } from './DestinationNodeConfig';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

export function NodeConfigPanel({ selectedNode, onClose, onSave }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<any>({});
  const [isValid, setIsValid] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data?.config || {});
      setTestResult(null);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type || 'default';
  const nodeSubtype = (selectedNode.data as any)?.sourceType ||
                      (selectedNode.data as any)?.transformationType ||
                      (selectedNode.data as any)?.destinationType ||
                      'unknown';

  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
    // Basic validation - check if required fields are filled
    setIsValid(Object.keys(newConfig).length > 0);
  };

  const handleSave = () => {
    onSave(selectedNode.id, config);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await pipelineBuilderService.testNode({
        node_id: selectedNode.id,
        node_type: nodeSubtype,
        config: config,
      });

      setTestResult({
        success: result.status === 'success',
        message: result.status === 'success'
          ? `Test passed! Sample records: ${result.test_results?.sample_output_records || 0}`
          : 'Test failed',
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderConfigForm = () => {
    if (nodeType === 'source') {
      return <SourceNodeConfig config={config} onChange={handleConfigChange} subtype={nodeSubtype} />;
    } else if (nodeType === 'transformation') {
      return <TransformationNodeConfig config={config} onChange={handleConfigChange} subtype={nodeSubtype} />;
    } else if (nodeType === 'destination') {
      return <DestinationNodeConfig config={config} onChange={handleConfigChange} subtype={nodeSubtype} />;
    }
    return <div className="text-gray-500">Unknown node type</div>;
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Configure Node
          </h3>
          <p className="text-sm text-gray-500">
            {selectedNode.data?.label || selectedNode.id}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {renderConfigForm()}

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  testResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResult.success ? 'Test Passed' : 'Test Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
