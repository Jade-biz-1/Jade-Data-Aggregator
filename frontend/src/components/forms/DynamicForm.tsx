'use client';

import React, { useState, useEffect } from 'react';
import { DynamicFormField, FormFieldConfig } from './DynamicFormField';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface FieldGroup {
  id: string;
  label: string;
}

interface DynamicFormProps {
  connectorType: string;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onTest?: (values: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
  showTestButton?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  connectorType,
  initialValues = {},
  onSubmit,
  onTest,
  submitLabel = 'Save Configuration',
  showTestButton = true
}) => {
  const [schema, setSchema] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);


  useEffect(() => {
    fetchSchema();
  }, [connectorType]);

  const getAccessToken = () => {
    if (typeof document !== 'undefined') {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];
    }
    return undefined;
  };

  const fetchSchema = async () => {
    try {
      const token = getAccessToken();

      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      // Remove trailing slash
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      // Remove /api/v1 if already present
      let url = '';
      if (baseUrl.endsWith('/api/v1')) {
        url = `${baseUrl}/configuration/schemas/${connectorType}`;
      } else {
        url = `${baseUrl}/api/v1/configuration/schemas/${connectorType}`;
      }
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setSchema(data);

        // Set default values
        const defaults: Record<string, any> = {};
        data.fields.forEach((field: FormFieldConfig) => {
          if (field.default_value !== undefined && field.default_value !== null) {
            defaults[field.name] = field.default_value;
          }
        });
        setFormValues({ ...defaults, ...initialValues });
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    // If the field is file_path and value is a File object, upload it
    if (name === 'file_path' && value instanceof File) {
      const uploadFile = async () => {
        let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        let url = '';
        if (baseUrl.endsWith('/api/v1')) {
          url = `${baseUrl}/files/upload`;
        } else {
          url = `${baseUrl}/api/v1/files/upload`;
        }
        const token = getAccessToken();
        const formData = new FormData();
        formData.append('file', value);
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
          });
          if (response.ok) {
            const data = await response.json();
            setFormValues(prev => ({ ...prev, [name]: { file: value, file_path: data.file_path } }));
          } else {
            setErrors(prev => ({ ...prev, [name]: 'File upload failed' }));
          }
        } catch (err) {
          setErrors(prev => ({ ...prev, [name]: 'File upload error' }));
        }
      };
      uploadFile();
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!schema) return false;

    schema.fields.forEach((field: FormFieldConfig) => {
      const value = formValues[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Skip further validation if empty and not required
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Apply validation rules
      field.validation?.forEach(rule => {
        if (rule.type === 'min' && typeof value === 'number') {
          if (value < rule.value) {
            newErrors[field.name] = rule.message;
          }
        } else if (rule.type === 'max' && typeof value === 'number') {
          if (value > rule.value) {
            newErrors[field.name] = rule.message;
          }
        } else if (rule.type === 'url') {
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            newErrors[field.name] = rule.message;
          }
        } else if (rule.type === 'email') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            newErrors[field.name] = rule.message;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formValues);
  };

  const handleTest = async () => {
    if (!validateForm()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      if (onTest) {
        await onTest(formValues);
      } else {
        // Default test implementation
        // Use the same token extraction as fetchSchema
        let token;
        if (typeof document !== 'undefined') {
          token = document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
        }
        let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        // Remove /api/v1 if already present
        let url = '';
        if (baseUrl.endsWith('/api/v1')) {
          url = `${baseUrl}/configuration/test-connection`;
        } else {
          url = `${baseUrl}/api/v1/configuration/test-connection`;
        }
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(
          url,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              connector_type: connectorType,
              configuration: formValues
            })
          }
        );
        if (response.ok) {
          const result = await response.json();
          setTestResult(result);
        } else {
          setTestResult({
            success: false,
            message: 'Connection test failed'
          });
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'An error occurred during testing'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Unable to load configuration form</p>
      </div>
    );
  }

  // Group fields
  const groupedFields: Record<string, FormFieldConfig[]> = {};
  schema.fields.forEach((field: FormFieldConfig) => {
    const group = field.group || 'general';
    if (!groupedFields[group]) {
      groupedFields[group] = [];
    }
    groupedFields[group].push(field);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{schema.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{schema.description}</p>
      </div>

      {/* Field Groups */}
      {schema.groups && schema.groups.length > 0 ? (
        schema.groups.map((group: FieldGroup) => (
          <div key={group.id} className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              {group.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedFields[group.id]?.map((field) => (
                <DynamicFormField
                  key={field.name}
                  field={field}
                  value={formValues[field.name]}
                  onChange={handleFieldChange}
                  error={errors[field.name]}
                  formValues={formValues}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schema.fields.map((field: FormFieldConfig) => (
            <DynamicFormField
              key={field.name}
              field={field}
              value={formValues[field.name]}
              onChange={handleFieldChange}
              error={errors[field.name]}
              formValues={formValues}
            />
          ))}
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h5
                className={`font-semibold ${
                  testResult.success ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </h5>
              <p
                className={`text-sm mt-1 ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {testResult.message}
              </p>
              {testResult.duration_ms && (
                <p className="text-xs text-gray-600 mt-2">
                  Test completed in {testResult.duration_ms}ms
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        {showTestButton && (
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        )}

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
