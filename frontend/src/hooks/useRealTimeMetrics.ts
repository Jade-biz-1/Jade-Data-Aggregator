/**
 * Hook for Real-time System Metrics
 */

import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    percent: number;
    count: number;
  };
  memory: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    percent: number;
  };
}

export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, subscribe, unsubscribe } = useWebSocket('/ws', {
    autoConnect: true
  });

  useEffect(() => {
    const handler = (data: any) => {
      if (data.type === 'system_metrics') {
        setMetrics(data);
        setLastUpdate(new Date());
      }
    };

    subscribe('system_metrics', handler);

    return () => {
      unsubscribe('system_metrics', handler);
    };
  }, [subscribe, unsubscribe]);

  return {
    metrics,
    lastUpdate,
    isConnected
  };
}
