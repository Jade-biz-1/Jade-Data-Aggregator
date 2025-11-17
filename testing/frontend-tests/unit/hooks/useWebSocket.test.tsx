/**
 * useWebSocket Hook Tests
 * Tests WebSocket connection, messaging, and subscription management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WebSocketClient } from '@/lib/websocket';

// Mock WebSocketClient
jest.mock('@/lib/websocket', () => ({
  WebSocketClient: jest.fn(),
  getWebSocketUrl: jest.fn((path) => `ws://localhost:8001${path}`),
}));

// Mock Cookies
jest.mock('js-cookie', () => ({
  get: jest.fn(() => 'test-access-token'),
}));

describe('useWebSocket', () => {
  let mockWsClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock WebSocket client instance
    mockWsClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      getConnectionState: jest.fn(() => 'CONNECTED'),
    };

    (WebSocketClient as jest.Mock).mockImplementation((config) => {
      // Simulate connected state after connect is called
      setTimeout(() => {
        if (config.onConnect) {
          config.onConnect();
        }
      }, 0);
      return mockWsClient;
    });
  });

  describe('Initialization', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      expect(result.current.isConnected).toBe(false);
    });

    it('should create WebSocketClient with correct configuration', () => {
      renderHook(() => useWebSocket('/ws/test'));

      expect(WebSocketClient).toHaveBeenCalledWith({
        url: 'ws://localhost:8001/ws/test',
        token: 'test-access-token',
        onMessage: undefined,
        onConnect: expect.any(Function),
        onDisconnect: expect.any(Function),
      });
    });

    it('should connect automatically by default', () => {
      renderHook(() => useWebSocket('/ws/test'));

      expect(mockWsClient.connect).toHaveBeenCalled();
    });

    it('should not auto-connect when autoConnect is false', () => {
      renderHook(() => useWebSocket('/ws/test', { autoConnect: false }));

      expect(mockWsClient.connect).not.toHaveBeenCalled();
    });

    it('should not connect without authentication token', () => {
      const Cookies = require('js-cookie');
      Cookies.get.mockReturnValue(null);

      renderHook(() => useWebSocket('/ws/test'));

      expect(WebSocketClient).not.toHaveBeenCalled();
    });
  });

  describe('Connection State', () => {
    it('should update isConnected when connection established', async () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should update connectionState periodically', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      mockWsClient.getConnectionState.mockReturnValue('CONNECTING');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('CONNECTING');
      });

      jest.useRealTimers();
    });

    it('should call onConnect callback when connected', async () => {
      const onConnect = jest.fn();
      renderHook(() => useWebSocket('/ws/test', { onConnect }));

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });

    it('should call onDisconnect callback when disconnected', async () => {
      const onDisconnect = jest.fn();
      let wsConfig: any;

      (WebSocketClient as jest.Mock).mockImplementation((config) => {
        wsConfig = config;
        return mockWsClient;
      });

      renderHook(() => useWebSocket('/ws/test', { onDisconnect }));

      act(() => {
        wsConfig.onDisconnect();
      });

      expect(onDisconnect).toHaveBeenCalled();
    });

    it('should set isConnected to false on disconnect', async () => {
      let wsConfig: any;

      (WebSocketClient as jest.Mock).mockImplementation((config) => {
        wsConfig = config;
        // Immediately call onConnect
        setTimeout(() => config.onConnect(), 0);
        return mockWsClient;
      });

      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        wsConfig.onDisconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('DISCONNECTED');
    });
  });

  describe('Messaging', () => {
    it('should send messages through WebSocket', async () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        result.current.send({ type: 'test', data: 'hello' });
      });

      expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'test', data: 'hello' });
    });

    it('should handle onMessage callback', async () => {
      const onMessage = jest.fn();
      let wsConfig: any;

      (WebSocketClient as jest.Mock).mockImplementation((config) => {
        wsConfig = config;
        setTimeout(() => config.onConnect(), 0);
        return mockWsClient;
      });

      renderHook(() => useWebSocket('/ws/test', { onMessage }));

      await waitFor(() => {
        expect(mockWsClient.connect).toHaveBeenCalled();
      });

      const testMessage = { type: 'update', data: 'test data' };
      act(() => {
        wsConfig.onMessage(testMessage);
      });

      expect(onMessage).toHaveBeenCalledWith(testMessage);
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to message types', async () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const handler = jest.fn();
      act(() => {
        result.current.subscribe('metrics', handler);
      });

      expect(mockWsClient.subscribe).toHaveBeenCalledWith('metrics', handler);
    });

    it('should unsubscribe from message types', async () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const handler = jest.fn();
      act(() => {
        result.current.unsubscribe('metrics', handler);
      });

      expect(mockWsClient.unsubscribe).toHaveBeenCalledWith('metrics', handler);
    });

    it('should maintain subscription handlers across renders', async () => {
      const { result, rerender } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const initialSubscribe = result.current.subscribe;
      const initialUnsubscribe = result.current.unsubscribe;

      rerender();

      expect(result.current.subscribe).toBe(initialSubscribe);
      expect(result.current.unsubscribe).toBe(initialUnsubscribe);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on unmount', async () => {
      const { unmount } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(mockWsClient.connect).toHaveBeenCalled();
      });

      unmount();

      expect(mockWsClient.disconnect).toHaveBeenCalled();
    });

    it('should clear interval on unmount', async () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(mockWsClient.connect).toHaveBeenCalled();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Client Reference', () => {
    it('should provide access to WebSocket client', async () => {
      const { result } = renderHook(() => useWebSocket('/ws/test'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(result.current.client).toBe(mockWsClient);
    });
  });

  describe('Path Changes', () => {
    it('should reconnect when path changes', async () => {
      const { rerender } = renderHook(
        ({ path }) => useWebSocket(path),
        { initialProps: { path: '/ws/test1' } }
      );

      await waitFor(() => {
        expect(mockWsClient.connect).toHaveBeenCalledTimes(1);
      });

      rerender({ path: '/ws/test2' });

      await waitFor(() => {
        expect(mockWsClient.disconnect).toHaveBeenCalled();
        expect(WebSocketClient).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const Cookies = require('js-cookie');
      Cookies.get.mockReturnValue(null);

      renderHook(() => useWebSocket('/ws/test'));

      expect(consoleErrorSpy).toHaveBeenCalledWith('No authentication token found');

      consoleErrorSpy.mockRestore();
    });

    it('should handle getWebSocketUrl returning null', async () => {
      const { getWebSocketUrl } = require('@/lib/websocket');
      getWebSocketUrl.mockReturnValue(null);

      renderHook(() => useWebSocket('/ws/test'));

      expect(WebSocketClient).not.toHaveBeenCalled();

      getWebSocketUrl.mockReturnValue((path: string) => `ws://localhost:8001${path}`);
    });
  });
});
