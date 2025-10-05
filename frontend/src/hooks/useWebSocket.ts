/**
 * React Hooks for WebSocket Connections
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketClient, getWebSocketUrl } from '@/lib/websocket';
import Cookies from 'js-cookie';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const wsClientRef = useRef<WebSocketClient | null>(null);

  const { onMessage, onConnect, onDisconnect, autoConnect = true } = options;

  useEffect(() => {
    if (!autoConnect) return;

    const token = Cookies.get('access_token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const wsUrl = getWebSocketUrl(path);
    if (!wsUrl) return;

    const wsClient = new WebSocketClient({
      url: wsUrl,
      token,
      onMessage,
      onConnect: () => {
        setIsConnected(true);
        setConnectionState('CONNECTED');
        onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionState('DISCONNECTED');
        onDisconnect?.();
      }
    });

    wsClient.connect();
    wsClientRef.current = wsClient;

    // Update connection state periodically
    const interval = setInterval(() => {
      if (wsClient) {
        setConnectionState(wsClient.getConnectionState());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      wsClient.disconnect();
    };
  }, [path, autoConnect]);

  const send = useCallback((message: any) => {
    wsClientRef.current?.send(message);
  }, []);

  const subscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    wsClientRef.current?.subscribe(messageType, handler);
  }, []);

  const unsubscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    wsClientRef.current?.unsubscribe(messageType, handler);
  }, []);

  return {
    isConnected,
    connectionState,
    send,
    subscribe,
    unsubscribe,
    client: wsClientRef.current
  };
}
