/**
 * Developer Role Warning Banner
 * Displays when developer role is active in production environment
 * Phase 8: Production safeguards
 */

'use client';

import React from 'react';
import { DeveloperRoleWarning } from '@/hooks/usePermissions';

interface DevWarningBannerProps {
  warning: DeveloperRoleWarning;
}

export function DevWarningBanner({ warning }: DevWarningBannerProps) {
  if (!warning.isActive) {
    return null;
  }

  const getTimeRemaining = () => {
    if (!warning.expiresAt) return null;

    const expiryDate = new Date(warning.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Expired';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `Expires in ${diffHours}h ${diffMinutes}m`;
    }
    return `Expires in ${diffMinutes}m`;
  };

  return (
    <div className="bg-yellow-600 text-white px-4 py-3 shadow-md" role="alert">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">
              ⚠️ PRODUCTION WARNING: {warning.message}
            </p>
            <p className="text-sm opacity-90">
              This is a development role with elevated privileges. {getTimeRemaining()}
            </p>
          </div>
        </div>
        <div className="text-sm font-medium">
          <span className="px-3 py-1 bg-yellow-700 rounded-full">
            DEVELOPER MODE
          </span>
        </div>
      </div>
    </div>
  );
}
