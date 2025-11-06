/**
 * WebSocket Service for Real-time Updates
 * Phase 1.2: WebSocket Integration
 *
 * Provides connection management, authentication, and message handling
 * for real-time updates from the backend.
 */

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

interface WebSocketConfig {
  url: string;
  token?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      debug: false,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (this.config.debug) console.log('[WS] Already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    const token = this.config.token || this.getTokenFromCookie();
    const url = this.buildWebSocketUrl(this.config.url, token);

    if (this.config.debug) console.log('[WS] Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearReconnectTimer();

    if (this.ws) {
      if (this.config.debug) console.log('[WS] Disconnecting...');
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  public send(type: string, data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WS] Cannot send message - not connected');
      return;
    }

    const message = JSON.stringify({ type, data });
    this.ws.send(message);

    if (this.config.debug) console.log('[WS] Sent:', { type, data });
  }

  /**
   * Subscribe to specific message type
   */
  public on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  public onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.push(handler);
    return () => {
      const index = this.connectHandlers.indexOf(handler);
      if (index > -1) this.connectHandlers.splice(index, 1);
    };
  }

  /**
   * Subscribe to disconnection events
   */
  public onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.push(handler);
    return () => {
      const index = this.disconnectHandlers.indexOf(handler);
      if (index > -1) this.disconnectHandlers.splice(index, 1);
    };
  }

  /**
   * Subscribe to error events
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) this.errorHandlers.splice(index, 1);
    };
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  public getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // Private methods

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (this.config.debug) console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.connectHandlers.forEach(handler => handler());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (this.config.debug) console.log('[WS] Received:', message);

        const { type, data } = message;
        const handlers = this.messageHandlers.get(type);

        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('[WS] Error:', error);
      this.errorHandlers.forEach(handler => handler(error));
    };

    this.ws.onclose = (event: CloseEvent) => {
      if (this.config.debug) {
        console.log('[WS] Disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
      }

      this.disconnectHandlers.forEach(handler => handler());

      if (!this.isIntentionallyClosed) {
        this.handleReconnect();
      }
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('[WS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 3000;

    if (this.config.debug) {
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private buildWebSocketUrl(path: string, token?: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_WS_PORT || '8001';

    let url = `${protocol}//${host}:${port}${path}`;

    if (token) {
      url += `?token=${token}`;
    }

    return url;
  }

  private getTokenFromCookie(): string | undefined {
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('access_token='));
    return tokenCookie?.split('=')[1];
  }
}

// Singleton instances for common WebSocket endpoints
let pipelineStatusWS: WebSocketService | null = null;
let metricsWS: WebSocketService | null = null;
let notificationsWS: WebSocketService | null = null;

/**
 * Get or create WebSocket connection for pipeline status updates
 */
export function getPipelineStatusWebSocket(): WebSocketService {
  if (!pipelineStatusWS) {
    pipelineStatusWS = new WebSocketService({
      url: '/api/v1/ws/pipeline-status',
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return pipelineStatusWS;
}

/**
 * Get or create WebSocket connection for system metrics
 */
export function getMetricsWebSocket(): WebSocketService {
  if (!metricsWS) {
    metricsWS = new WebSocketService({
      url: '/api/v1/ws/metrics',
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return metricsWS;
}

/**
 * Get or create WebSocket connection for notifications
 */
export function getNotificationsWebSocket(): WebSocketService {
  if (!notificationsWS) {
    notificationsWS = new WebSocketService({
      url: '/api/v1/ws/notifications',
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return notificationsWS;
}

/**
 * Cleanup all WebSocket connections
 */
export function cleanupWebSockets(): void {
  if (pipelineStatusWS) {
    pipelineStatusWS.disconnect();
    pipelineStatusWS = null;
  }
  if (metricsWS) {
    metricsWS.disconnect();
    metricsWS = null;
  }
  if (notificationsWS) {
    notificationsWS.disconnect();
    notificationsWS = null;
  }
}
