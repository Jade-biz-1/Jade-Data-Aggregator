'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevWarningBannerProps {
  message?: string;
  expiresAt?: string;
}

export function DevWarningBanner({ message, expiresAt }: DevWarningBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {message || 'Developer role is active in PRODUCTION environment'}
              </p>
              {timeRemaining && (
                <p className="text-xs opacity-90">
                  Auto-expires in: {timeRemaining}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
