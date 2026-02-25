'use client';

/**
 * UX-001: Pipeline Builder page error boundary.
 * Isolates render errors in the pipeline-builder route from the rest of the app.
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PipelineBuilderError({ error, reset }: ErrorProps) {
  useEffect(() => {
    import('../../../lib/sentry')
      .then(({ captureException }) => captureException(error, { tags: { page: 'pipeline-builder' } }))
      .catch(() => {});
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <svg
        className="h-12 w-12 text-orange-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
        />
      </svg>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Pipeline Builder failed to load
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        There was a problem rendering the pipeline builder. Your saved pipelines are safe.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reload builder
      </button>
    </div>
  );
}
