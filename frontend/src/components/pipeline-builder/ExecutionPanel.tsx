'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, RefreshCw, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';
import { Node, Edge } from 'reactflow';

interface ExecutionPanelProps {
  pipelineId: number | null;
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  onToggle: () => void;
}

interface ExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  currentNode?: string;
  progress?: number;
  recordsProcessed?: number;
  errorMessage?: string;
  nodeStatuses?: {
    node_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    records_processed?: number;
    error?: string;
  }[];
}

export function ExecutionPanel({ pipelineId, nodes, edges, isOpen, onToggle }: ExecutionPanelProps) {
  const [executionState, setExecutionState] = useState<ExecutionState>({ status: 'idle' });
  const [isExecuting, setIsExecuting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Poll execution state while running
  useEffect(() => {
    if (executionState.status === 'running' && pipelineId) {
      const interval = setInterval(async () => {
        try {
          const state = await pipelineBuilderService.getExecutionState(pipelineId);
          setExecutionState(state);

          // Stop polling if execution is complete
          if (state.status === 'completed' || state.status === 'failed' || state.status === 'cancelled') {
            clearInterval(interval);
            setPollingInterval(null);
            setIsExecuting(false);
          }
        } catch (error) {
          console.error('Error polling execution state:', error);
        }
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);

      return () => clearInterval(interval);
    }
  }, [executionState.status, pipelineId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleExecute = async () => {
    if (!pipelineId) {
      alert('Please save the pipeline before executing');
      return;
    }

    setIsExecuting(true);
    setExecutionState({ status: 'running', startTime: new Date().toISOString() });

    try {
      await pipelineBuilderService.executePipeline(pipelineId, nodes, edges);
      // Execution started, polling will update the state
    } catch (error: any) {
      setExecutionState({
        status: 'failed',
        errorMessage: error.message || 'Execution failed',
        endTime: new Date().toISOString()
      });
      setIsExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (!pipelineId) return;

    try {
      await pipelineBuilderService.cancelExecution(pipelineId);
      setExecutionState({ ...executionState, status: 'cancelled' });
      setIsExecuting(false);
    } catch (error: any) {
      console.error('Error cancelling execution:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <StopCircle className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return null;
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <Play className="h-4 w-4" />
        Execution Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-white border-l border-t border-gray-200 shadow-xl z-40" style={{ height: '60vh' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Execution Status</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(60vh - 140px)' }}>
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${
          executionState.status === 'running'
            ? 'bg-blue-50 border-blue-200'
            : executionState.status === 'completed'
            ? 'bg-green-50 border-green-200'
            : executionState.status === 'failed'
            ? 'bg-red-50 border-red-200'
            : executionState.status === 'cancelled'
            ? 'bg-orange-50 border-orange-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start gap-3">
            {getStatusIcon(executionState.status)}
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm ${
                executionState.status === 'running'
                  ? 'text-blue-900'
                  : executionState.status === 'completed'
                  ? 'text-green-900'
                  : executionState.status === 'failed'
                  ? 'text-red-900'
                  : executionState.status === 'cancelled'
                  ? 'text-orange-900'
                  : 'text-gray-900'
              }`}>
                {executionState.status === 'idle' && 'Ready to Execute'}
                {executionState.status === 'running' && 'Execution in Progress'}
                {executionState.status === 'completed' && 'Execution Completed'}
                {executionState.status === 'failed' && 'Execution Failed'}
                {executionState.status === 'cancelled' && 'Execution Cancelled'}
              </h4>

              {executionState.currentNode && (
                <p className="text-xs text-gray-600 mt-1">
                  Current: {getNodeLabel(executionState.currentNode)}
                </p>
              )}

              {executionState.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{executionState.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${executionState.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {executionState.recordsProcessed !== undefined && (
                <p className="text-xs text-gray-600 mt-2">
                  Records processed: {executionState.recordsProcessed.toLocaleString()}
                </p>
              )}

              {executionState.startTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {formatDuration(executionState.startTime, executionState.endTime)}
                </p>
              )}

              {executionState.errorMessage && (
                <p className="text-xs text-red-600 mt-2">{executionState.errorMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Node Statuses */}
        {executionState.nodeStatuses && executionState.nodeStatuses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Node Progress</h4>
            <div className="space-y-2">
              {executionState.nodeStatuses.map((nodeStatus, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    nodeStatus.status === 'completed'
                      ? 'bg-white border-green-200'
                      : nodeStatus.status === 'running'
                      ? 'bg-blue-50 border-blue-200'
                      : nodeStatus.status === 'failed'
                      ? 'bg-white border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(nodeStatus.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getNodeLabel(nodeStatus.node_id)}
                        </p>
                        {nodeStatus.records_processed !== undefined && (
                          <span className="text-xs text-gray-600 ml-2">
                            {nodeStatus.records_processed.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {nodeStatus.error && (
                        <p className="text-xs text-red-600 mt-1">{nodeStatus.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {executionState.status === 'idle' && (
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Click "Execute Pipeline" to start processing data
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        {executionState.status === 'running' ? (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2 w-full"
          >
            <StopCircle className="h-4 w-4" />
            Cancel Execution
          </Button>
        ) : (
          <Button
            onClick={handleExecute}
            disabled={!pipelineId || isExecuting}
            className="flex items-center gap-2 w-full"
          >
            <Play className="h-4 w-4" />
            Execute Pipeline
          </Button>
        )}
      </div>
    </div>
  );
}
