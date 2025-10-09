'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

export type BannerType = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps {
  type: BannerType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  closable?: boolean;
}

export const Banner: React.FC<BannerProps> = ({
  type,
  message,
  action,
  onClose,
  closable = true,
}) => {
  const icons = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
  };

  const colors = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
  };

  const buttonColors = {
    info: 'bg-blue-700 hover:bg-blue-800',
    success: 'bg-green-700 hover:bg-green-800',
    warning: 'bg-yellow-700 hover:bg-yellow-800',
    error: 'bg-red-700 hover:bg-red-800',
  };

  return (
    <div
      className={`${colors[type]} px-4 py-3 shadow-lg animate-slideDown`}
      role="alert"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>

        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${buttonColors[type]}`}
            >
              {action.label}
            </button>
          )}
          {closable && onClose && (
            <button
              onClick={onClose}
              className="opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Close banner"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;
