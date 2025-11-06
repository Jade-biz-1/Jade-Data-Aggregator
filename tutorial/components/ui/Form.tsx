'use client';

import React from 'react';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <form ref={ref} className={`space-y-4 ${className}`.trim()} {...props}>
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ children, className = '' }) => {
  return <div className={`space-y-1 ${className}`.trim()}>{children}</div>;
};

FormField.displayName = 'FormField';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ required, children, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-gray-700 ${className}`.trim()}
        {...props}
      >
        {children}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

export interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ children, className = '' }) => {
  if (!children) return null;

  return (
    <p className={`text-sm text-danger-600 mt-1 ${className}`.trim()} role="alert">
      {children}
    </p>
  );
};

FormError.displayName = 'FormError';

export interface FormHelperTextProps {
  children: React.ReactNode;
  className?: string;
}

export const FormHelperText: React.FC<FormHelperTextProps> = ({
  children,
  className = '',
}) => {
  if (!children) return null;

  return <p className={`text-sm text-gray-500 mt-1 ${className}`.trim()}>{children}</p>;
};

FormHelperText.displayName = 'FormHelperText';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {(title || description) && (
        <div className="border-b border-gray-200 pb-3">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

FormSection.displayName = 'FormSection';

export interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
  className = '',
}) => {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div
      className={`flex gap-3 pt-4 border-t border-gray-200 ${alignStyles[align]} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

FormActions.displayName = 'FormActions';

export default Form;
