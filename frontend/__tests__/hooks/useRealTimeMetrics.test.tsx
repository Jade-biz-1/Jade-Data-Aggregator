/**
 * useRealTimeMetrics Hook Tests
 * Tests real-time system metrics monitoring via WebSocket
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock useWebSocket
jest.mock('@/hooks/useWebSocket');

describe('useRealTimeMetrics', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;
  let mockIsConnected: boolean;
  let subscriptionHandler: ((data: any) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionHandler = null;
    mockIsConnected = true;

    mockSubscribe = jest.fn((messageType, handler) => {
      subscriptionHandler = handler;
    });

    mockUnsubscribe = jest.fn();

    (useWebSocket as jest.Mock).mockReturnValue({
      isConnected: mockIsConnected,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    });
  });

  describe('Initialization', () => {
    it('should initialize with null metrics', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      expect(result.current.metrics).toBeNull();
      expect(result.current.lastUpdate).toBeNull();
    });

    it('should connect to WebSocket on mount', () => {
      renderHook(() => useRealTimeMetrics());

      expect(useWebSocket).toHaveBeenCalledWith('/ws', {
        autoConnect: true,
      });
    });

    it('should subscribe to system_metrics on mount', () => {
      renderHook(() => useRealTimeMetrics());

      expect(mockSubscribe).toHaveBeenCalledWith('system_metrics', expect.any(Function));
    });

    it('should return connection status', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('Receiving Metrics', () => {
    it('should update metrics when receiving system_metrics message', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const metricsData = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:00:00Z',
        cpu: {
          percent: 45.5,
          count: 8,
        },
        memory: {
          total_gb: 16.0,
          used_gb: 8.5,
          available_gb: 7.5,
          percent: 53.1,
        },
        disk: {
          total_gb: 500.0,
          used_gb: 250.0,
          free_gb: 250.0,
          percent: 50.0,
        },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(metricsData);
        }
      });

      expect(result.current.metrics).toEqual(metricsData);
    });

    it('should update lastUpdate timestamp when receiving metrics', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const beforeUpdate = new Date();

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler({
            type: 'system_metrics',
            timestamp: '2025-10-18T10:00:00Z',
            cpu: { percent: 45.5, count: 8 },
            memory: { total_gb: 16.0, used_gb: 8.5, available_gb: 7.5, percent: 53.1 },
            disk: { total_gb: 500.0, used_gb: 250.0, free_gb: 250.0, percent: 50.0 },
          });
        }
      });

      const afterUpdate = new Date();

      expect(result.current.lastUpdate).not.toBeNull();
      expect(result.current.lastUpdate!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(result.current.lastUpdate!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should ignore non-system_metrics messages', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler({
            type: 'pipeline_status',
            data: { pipeline_id: 1, status: 'running' },
          });
        }
      });

      expect(result.current.metrics).toBeNull();
      expect(result.current.lastUpdate).toBeNull();
    });

    it('should handle multiple metric updates', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const metrics1 = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:00:00Z',
        cpu: { percent: 40.0, count: 8 },
        memory: { total_gb: 16.0, used_gb: 8.0, available_gb: 8.0, percent: 50.0 },
        disk: { total_gb: 500.0, used_gb: 200.0, free_gb: 300.0, percent: 40.0 },
      };

      const metrics2 = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:01:00Z',
        cpu: { percent: 60.0, count: 8 },
        memory: { total_gb: 16.0, used_gb: 10.0, available_gb: 6.0, percent: 62.5 },
        disk: { total_gb: 500.0, used_gb: 210.0, free_gb: 290.0, percent: 42.0 },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(metrics1);
        }
      });

      expect(result.current.metrics).toEqual(metrics1);
      const firstUpdate = result.current.lastUpdate;

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(metrics2);
        }
      });

      expect(result.current.metrics).toEqual(metrics2);
      expect(result.current.lastUpdate).not.toEqual(firstUpdate);
    });
  });

  describe('Connection Status', () => {
    it('should reflect WebSocket connection status', () => {
      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      const { result } = renderHook(() => useRealTimeMetrics());

      expect(result.current.isConnected).toBe(false);
    });

    it('should update when connection status changes', () => {
      const { result, rerender } = renderHook(() => useRealTimeMetrics());

      expect(result.current.isConnected).toBe(true);

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      rerender();

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useRealTimeMetrics());

      const handler = mockSubscribe.mock.calls[0][1];

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledWith('system_metrics', handler);
    });

    it('should unsubscribe when dependencies change', () => {
      const { rerender } = renderHook(() => useRealTimeMetrics());

      const firstHandler = mockSubscribe.mock.calls[0][1];

      // Trigger re-subscription by changing subscribe/unsubscribe references
      const newSubscribe = jest.fn((messageType, handler) => {
        subscriptionHandler = handler;
      });
      const newUnsubscribe = jest.fn();

      (useWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        subscribe: newSubscribe,
        unsubscribe: newUnsubscribe,
      });

      rerender();

      expect(mockUnsubscribe).toHaveBeenCalledWith('system_metrics', firstHandler);
      expect(newSubscribe).toHaveBeenCalledWith('system_metrics', expect.any(Function));
    });
  });

  describe('Metrics Data Structure', () => {
    it('should handle complete metrics data structure', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const completeMetrics = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:00:00Z',
        cpu: {
          percent: 75.5,
          count: 16,
        },
        memory: {
          total_gb: 32.0,
          used_gb: 20.5,
          available_gb: 11.5,
          percent: 64.1,
        },
        disk: {
          total_gb: 1000.0,
          used_gb: 600.0,
          free_gb: 400.0,
          percent: 60.0,
        },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(completeMetrics);
        }
      });

      expect(result.current.metrics?.cpu.percent).toBe(75.5);
      expect(result.current.metrics?.cpu.count).toBe(16);
      expect(result.current.metrics?.memory.total_gb).toBe(32.0);
      expect(result.current.metrics?.memory.percent).toBe(64.1);
      expect(result.current.metrics?.disk.free_gb).toBe(400.0);
    });

    it('should preserve metrics timestamp', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const metrics = {
        type: 'system_metrics',
        timestamp: '2025-10-18T15:30:45Z',
        cpu: { percent: 50.0, count: 8 },
        memory: { total_gb: 16.0, used_gb: 8.0, available_gb: 8.0, percent: 50.0 },
        disk: { total_gb: 500.0, used_gb: 250.0, free_gb: 250.0, percent: 50.0 },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(metrics);
        }
      });

      expect(result.current.metrics?.timestamp).toBe('2025-10-18T15:30:45Z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle metrics with zero values', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const metricsWithZeros = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:00:00Z',
        cpu: { percent: 0.0, count: 8 },
        memory: { total_gb: 16.0, used_gb: 0.1, available_gb: 15.9, percent: 0.6 },
        disk: { total_gb: 500.0, used_gb: 0.0, free_gb: 500.0, percent: 0.0 },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(metricsWithZeros);
        }
      });

      expect(result.current.metrics?.cpu.percent).toBe(0.0);
      expect(result.current.metrics?.disk.percent).toBe(0.0);
    });

    it('should handle metrics with high values', () => {
      const { result } = renderHook(() => useRealTimeMetrics());

      const highMetrics = {
        type: 'system_metrics',
        timestamp: '2025-10-18T10:00:00Z',
        cpu: { percent: 99.9, count: 128 },
        memory: { total_gb: 512.0, used_gb: 511.5, available_gb: 0.5, percent: 99.9 },
        disk: { total_gb: 10000.0, used_gb: 9999.0, free_gb: 1.0, percent: 99.99 },
      };

      act(() => {
        if (subscriptionHandler) {
          subscriptionHandler(highMetrics);
        }
      });

      expect(result.current.metrics?.cpu.percent).toBe(99.9);
      expect(result.current.metrics?.memory.percent).toBe(99.9);
      expect(result.current.metrics?.disk.percent).toBe(99.99);
    });
  });
});
