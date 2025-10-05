'use client';

import { ReactNode } from 'react';

interface BaseChartContainerProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  minHeight?: string;
}

export function BaseChartContainer({
  children,
  isLoading = false,
  error = null,
  minHeight = '300px'
}: BaseChartContainerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return <div style={{ minHeight }}>{children}</div>;
}
