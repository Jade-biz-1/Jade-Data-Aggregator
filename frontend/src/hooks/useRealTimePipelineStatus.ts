/**
 * Hook for Real-time Pipeline Status Updates
 */

import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface PipelineStatus {
  pipeline_id: number;
  status: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PipelineProgress {
  pipeline_id: number;
  progress_percent: number;
  current_step: string;
  current_step_number: number;
  total_steps: number;
  records_processed: number;
  timestamp: string;
}

interface PipelineLog {
  pipeline_id: number;
  log_level: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PipelineError {
  pipeline_id: number;
  error_message: string;
  error_type: string;
  stack_trace?: string;
  timestamp: string;
}

export function useRealTimePipelineStatus(pipelineId?: number) {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [errors, setErrors] = useState<PipelineError[]>([]);

  const { isConnected, subscribe, unsubscribe, client } = useWebSocket('/ws', {
    autoConnect: true,
    onConnect: () => {
      // Subscribe to pipeline updates when connected
      if (pipelineId && client) {
        client.subscribeToPipeline(pipelineId);
      }
    }
  });

  useEffect(() => {
    const statusHandler = (data: PipelineStatus) => {
      if (!pipelineId || data.pipeline_id === pipelineId) {
        setStatus(data);
      }
    };

    const progressHandler = (data: PipelineProgress) => {
      if (!pipelineId || data.pipeline_id === pipelineId) {
        setProgress(data);
      }
    };

    const logHandler = (data: PipelineLog) => {
      if (!pipelineId || data.pipeline_id === pipelineId) {
        setLogs(prev => [...prev, data].slice(-100)); // Keep last 100 logs
      }
    };

    const errorHandler = (data: PipelineError) => {
      if (!pipelineId || data.pipeline_id === pipelineId) {
        setErrors(prev => [...prev, data].slice(-50)); // Keep last 50 errors
      }
    };

    subscribe('pipeline_status', statusHandler);
    subscribe('pipeline_progress', progressHandler);
    subscribe('pipeline_log', logHandler);
    subscribe('pipeline_error', errorHandler);

    return () => {
      unsubscribe('pipeline_status', statusHandler);
      unsubscribe('pipeline_progress', progressHandler);
      unsubscribe('pipeline_log', logHandler);
      unsubscribe('pipeline_error', errorHandler);

      // Unsubscribe from pipeline when component unmounts
      if (pipelineId && client) {
        client.unsubscribeFromPipeline(pipelineId);
      }
    };
  }, [pipelineId, subscribe, unsubscribe, client]);

  const clearLogs = () => setLogs([]);
  const clearErrors = () => setErrors([]);

  return {
    status,
    progress,
    logs,
    errors,
    isConnected,
    clearLogs,
    clearErrors
  };
}
