import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      dot = false,
      removable = false,
      onRemove,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all duration-300';

    const variantStyles = {
      default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm hover:shadow-md',
      primary: 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 shadow-sm hover:shadow-md',
      success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm hover:shadow-md',
      warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 shadow-sm hover:shadow-md',
      danger: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-sm hover:shadow-md',
      info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const dotColors = {
      default: 'bg-gray-500',
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-blue-500',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {dot && (
          <span
            className={`w-2 h-2 rounded-full mr-1.5 ${dotColors[variant]}`}
          ></span>
        )}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1.5 inline-flex items-center justify-center hover:opacity-70 focus:outline-none"
            aria-label="Remove"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
