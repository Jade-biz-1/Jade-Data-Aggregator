'use client';

import React from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';

interface ValidationRule {
  type: string;
  value?: any;
  message: string;
}

interface FieldOption {
  value: string | number;
  label: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  field_type: string;
  default_value?: any;
  placeholder?: string;
  help_text?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  conditional?: {
    field: string;
    operator: string;
    value: any;
  };
  group?: string;
}

interface DynamicFormFieldProps {
  field: FormFieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  formValues?: Record<string, any>;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  formValues = {}
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  // Check if field should be visible based on conditional logic
  const isVisible = React.useMemo(() => {
    if (!field.conditional) return true;

    const conditionField = field.conditional.field;
    const conditionValue = field.conditional.value;
    const operator = field.conditional.operator;
    const currentValue = formValues[conditionField];

    if (operator === 'equals') {
      return currentValue === conditionValue;
    }
    return true;
  }, [field.conditional, formValues]);

  if (!isVisible) return null;

  const renderField = () => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: value ?? field.default_value ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onChange(field.name, e.target.value);
      },
      placeholder: field.placeholder,
      required: field.required,
  // All fields editable unless schema is updated to support these properties
      className: `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`
    };

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.field_type}
            {...commonProps}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...commonProps}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            value={value ?? field.default_value ?? ''}
            onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : '')}
          />
        );

      case 'select':
        return (
          <select {...commonProps} className={`${commonProps.className} bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100`}>
            <option value="">Select an option...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option.value} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value ?? field.default_value ?? false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`${commonProps.className} resize-vertical`}
          />
        );

      case 'json':
        return (
          <textarea
            {...commonProps}
            rows={6}
            className={`${commonProps.className} font-mono text-sm resize-vertical`}
            placeholder={field.placeholder || '{"key": "value"}'}
          />
        );

      case 'file':
        return (
          <div>
            <input
              type="file"
              id={field.name}
              name={field.name}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(field.name, file); // Pass the file object, not just the name
                } else {
                  onChange(field.name, undefined);
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {/* Show selected file name if present */}
            {value && value.name && (
              <div className="mt-1 text-sm text-gray-700 truncate" data-testid="selected-file-name">
                Selected file: {value.name}
              </div>
            )}
          </div>
        );

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  // Don't show label for boolean fields (checkbox handles it)
  if (field.field_type === 'boolean') {
    return (
      <div className="space-y-1">
        {renderField()}
        {field.help_text && (
          <p className="text-xs text-gray-500 flex items-start gap-1">
            <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {field.help_text}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {renderField()}

      {field.help_text && (
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {field.help_text}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
