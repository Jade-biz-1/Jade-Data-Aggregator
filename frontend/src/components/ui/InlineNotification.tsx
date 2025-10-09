'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface InlineNotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  className?: string;
}

export const InlineNotification: React.FC<InlineNotificationProps> = ({
  type,
  title,
  message,
  onClose,
  closable = false,
  className = '',
}) => {
  const icons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  };

  const colors = {
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  };

  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]} ${className}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconColors[type]}`}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      {closable && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default InlineNotification;
