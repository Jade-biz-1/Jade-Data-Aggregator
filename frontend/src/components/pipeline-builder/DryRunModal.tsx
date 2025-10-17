'use client';

import { useState } from 'react';
import { X, Play, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import { Node, Edge } from 'reactflow';

interface DryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: number | null;
  nodes: Node[];
  edges: Edge[];
}

interface DryRunResult {
  status: 'running' | 'success' | 'failed';
  message?: string;
  nodeResults?: {
    node_id: string;
    status: 'success' | 'failed' | 'pending';
    records_processed?: number;
    error?: string;
  }[];
  totalRecords?: number;
}

export function DryRunModal({ isOpen, onClose, pipelineId, nodes, edges }: DryRunModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);

  if (!isOpen) return null;

  const handleDryRun = async () => {
    if (!pipelineId) {
      setResult({
        status: 'failed',
        message: 'Pipeline must be saved before running a dry-run test'
      });
      return;
    }

    setIsRunning(true);
    setResult({ status: 'running' });

    try {
      const response = await pipelineBuilderService.dryRunPipeline(pipelineId, nodes, edges);

      setResult({
        status: response.status === 'success' ? 'success' : 'failed',
        message: response.message,
        nodeResults: response.node_results,
        totalRecords: response.total_records
      });
    } catch (error: any) {
      setResult({
        status: 'failed',
        message: error.message || 'Dry-run test failed'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dry-Run Test</h2>
            <p className="text-sm text-gray-600 mt-1">
              Test your pipeline with sample data without saving results
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!result && (
            <div className="text-center py-8">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                Click the button below to start a dry-run test of your pipeline.
                This will process a small sample of data through each node.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">What is a dry-run?</p>
                <ul className="text-left space-y-1 ml-4">
                  <li>• Processes sample data through your pipeline</li>
                  <li>• Tests node configurations and connections</li>
                  <li>• Does not save results to destinations</li>
                  <li>• Helps identify issues before full execution</li>
                </ul>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      result.status === 'success'
                        ? 'text-green-900'
                        : result.status === 'failed'
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}>
                      {result.status === 'running'
                        ? 'Running dry-run test...'
                        : result.status === 'success'
                        ? 'Dry-run completed successfully'
                        : 'Dry-run failed'}
                    </h3>
                    {result.message && (
                      <p className={`text-sm mt-1 ${
                        result.status === 'success'
                          ? 'text-green-700'
                          : result.status === 'failed'
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>
                        {result.message}
                      </p>
                    )}
                    {result.totalRecords !== undefined && (
                      <p className="text-sm mt-2 font-medium text-gray-700">
                        Total records processed: {result.totalRecords}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Node Results */}
              {result.nodeResults && result.nodeResults.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Node Results</h4>
                  <div className="space-y-2">
                    {result.nodeResults.map((nodeResult, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          nodeResult.status === 'success'
                            ? 'bg-white border-green-200'
                            : nodeResult.status === 'failed'
                            ? 'bg-white border-red-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(nodeResult.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {getNodeLabel(nodeResult.node_id)}
                              </p>
                              {nodeResult.records_processed !== undefined && (
                                <span className="text-xs text-gray-600 ml-2">
                                  {nodeResult.records_processed} records
                                </span>
                              )}
                            </div>
                            {nodeResult.error && (
                              <p className="text-sm text-red-600 mt-1">{nodeResult.error}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {result?.status !== 'running' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleDryRun}
                disabled={isRunning || !pipelineId}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {result ? 'Run Again' : 'Start Dry-Run'}
              </Button>
            </>
          )}
          {result?.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing pipeline...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
