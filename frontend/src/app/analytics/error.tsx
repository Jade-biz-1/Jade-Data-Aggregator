'use client';

/**
 * UX-001: Analytics page error boundary.
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    import('../../../../../lib/sentry')
      .then(({ captureException }) => captureException(error, { tags: { page: 'analytics' } }))
      .catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <svg
        className="h-12 w-12 text-purple-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Analytics failed to load
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        There was a problem rendering the analytics dashboard. Your data is intact.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Reload analytics
      </button>
    </div>
  );
}
