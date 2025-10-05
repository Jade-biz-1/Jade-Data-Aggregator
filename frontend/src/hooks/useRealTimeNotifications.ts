/**
 * Hook for Real-time Notifications and Alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface Notification {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, subscribe, unsubscribe } = useWebSocket('/ws', {
    autoConnect: true
  });

  useEffect(() => {
    const alertHandler = (data: any) => {
      if (data.type === 'system_alert') {
        const notification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          type: data.alert_type,
          severity: data.severity,
          message: data.message,
          timestamp: data.timestamp,
          read: false,
          metadata: data.metadata
        };

        setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100
        setUnreadCount(prev => prev + 1);
      }
    };

    subscribe('system_alert', alertHandler);

    return () => {
      unsubscribe('system_alert', alertHandler);
    };
  }, [subscribe, unsubscribe]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification
  };
}
