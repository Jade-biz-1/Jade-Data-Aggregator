'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

const CATEGORIES = ['String', 'Math', 'Date', 'Type', 'Null', 'Array', 'Custom'];

const PARAM_TYPES = ['str', 'int', 'float', 'bool', 'any', 'list', 'dict'];

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export default function NewFunctionPage() {
  const router = useRouter();
  const { toasts, success, error } = useToast();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [returnType, setReturnType] = useState('str');
  const [functionCode, setFunctionCode] = useState(`def transform(row):
    """
    Custom transformation function.

    Args:
        row: dict containing the current data row

    Returns:
        Transformed value
    """
    # Example: return the value of a column, modified
    value = row.get("column_name", "")
    return value.upper()
`);
  const [exampleUsage, setExampleUsage] = useState('');
  const [tags, setTags] = useState('');
  const [parameters, setParameters] = useState<Parameter[]>([
    { name: 'row', type: 'dict', required: true, description: 'The current data row as a dictionary' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addParameter = () => {
    setParameters([...parameters, { name: '', type: 'str', required: false, description: '' }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof Parameter, value: string | boolean) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) { error('Function name is required', 'Validation'); return; }
    if (!description.trim()) { error('Description is required', 'Validation'); return; }
    if (!functionCode.trim()) { error('Function code is required', 'Validation'); return; }

    setIsSaving(true);
    try {
      await apiClient.post('/transformation-functions', {
        name: name.trim(),
        display_name: displayName.trim() || name.trim(),
        description: description.trim(),
        category,
        function_code: functionCode,
        return_type: returnType,
        parameters: parameters.filter(p => p.name.trim()),
        example_usage: exampleUsage.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_public: true,
      });
      success('Function created successfully', 'Saved');
      router.push('/transformations/functions');
    } catch (err: any) {
      error(err.message || 'Failed to create function', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/transformations/functions')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Custom Function</h1>
            <p className="text-sm text-gray-600 mt-0.5">Define a reusable Python transformation function</p>
          </div>
        </div>

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>How custom functions work:</strong> Write a Python function that takes <code className="bg-blue-100 px-1 rounded">row</code> (a dict of column values) and returns the transformed value.
              Use it in a Map transformation as: <code className="bg-blue-100 px-1 rounded">your_function_name(row)</code>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Function Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                placeholder="e.g. format_phone_number"
              />
              <p className="text-xs text-gray-500 mt-1">Lowercase, underscores only. Used in expressions.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Format Phone Number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this function do? When should it be used?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
              <select
                value={returnType}
                onChange={e => setReturnType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400"
              >
                {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="e.g. phone, formatting"
              />
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Parameters</h2>
            <button
              onClick={addParameter}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Parameter
            </button>
          </div>
          <div className="space-y-3">
            {parameters.map((param, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-3">
                <div className="col-span-3">
                  <Input
                    value={param.name}
                    onChange={e => updateParameter(i, 'name', e.target.value)}
                    placeholder="name"
                    className="text-sm"
                    disabled={i === 0}
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={param.type}
                    onChange={e => updateParameter(i, 'type', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    disabled={i === 0}
                  >
                    {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={e => updateParameter(i, 'required', e.target.checked)}
                    disabled={i === 0}
                    title="Required"
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    value={param.description}
                    onChange={e => updateParameter(i, 'description', e.target.value)}
                    placeholder="description"
                    className="text-sm"
                    disabled={i === 0}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  {i > 0 && (
                    <button
                      onClick={() => removeParameter(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500">Headers: Name | Type | Required | Description</p>
          </div>
        </div>

        {/* Code */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Function Code <span className="text-red-500">*</span></h2>
          <textarea
            value={functionCode}
            onChange={e => setFunctionCode(e.target.value)}
            rows={14}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-y"
            spellCheck={false}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Example Usage</label>
            <Input
              value={exampleUsage}
              onChange={e => setExampleUsage(e.target.value)}
              placeholder={`e.g. ${name || 'my_function'}(row["phone_number"])`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => router.push('/transformations/functions')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving…' : 'Save Function'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
