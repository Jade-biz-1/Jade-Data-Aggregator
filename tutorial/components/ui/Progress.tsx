import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      label,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };

    const variantStyles = {
      default: 'bg-gradient-to-r from-primary-400 to-primary-500',
      success: 'bg-gradient-to-r from-green-400 to-green-500',
      warning: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      danger: 'bg-gradient-to-r from-red-400 to-red-500',
    };

    const displayLabel = label || `${Math.round(percentage)}%`;

    return (
      <div ref={ref} className={className} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              {displayLabel}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={`w-full bg-gray-200 rounded-full overflow-hidden shadow-inner ${sizeStyles[size]}`}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

export const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value,
      max = 100,
      size = 120,
      strokeWidth = 8,
      variant = 'default',
      showLabel = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const variantColors = {
      default: 'stroke-primary-500',
      success: 'stroke-green-500',
      warning: 'stroke-yellow-500',
      danger: 'stroke-red-500',
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center ${className}`.trim()}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${variantColors[variant]} transition-all duration-500 ease-out`}
            style={{
              filter: 'drop-shadow(0 0 4px currentColor)',
            }}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-lg font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export default Progress;
