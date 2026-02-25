'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SchemaTree } from '@/components/schema/schema-tree';
import { Database, FileJson, Table, Save, Search, GitCompare, BookOpen, X, Plus, Minus, Edit2, Loader } from 'lucide-react';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

type SchemaType = 'database' | 'api' | 'json' | 'csv';

interface SavedSchema {
  id: number;
  name: string;
  source_type: string;
  schema_data: any;
  created_at: string;
}

interface ComparisonResult {
  schemas_match: boolean;
  added_fields: string[];
  removed_fields: string[];
  modified_fields: Array<{ field: string; modifications: Record<string, { old: any; new: any }> }>;
  type_changes: Array<{ field: string; old_type: string; new_type: string }>;
  compared_at: string;
  compatibility_score: number;
}

const SchemaIntrospectPage = () => {
  const [schemaType, setSchemaType] = useState<SchemaType>('database');
  const [introspectedSchema, setIntrospectedSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [dbConnectionString, setDbConnectionString] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [jsonSample, setJsonSample] = useState('');
  const [csvSample, setCsvSample] = useState('');
  const [csvDelimiter, setCsvDelimiter] = useState(',');

  // Save schema modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSchemaName, setSaveSchemaName] = useState('');
  const [saving, setSaving] = useState(false);

  // Saved schemas & comparison
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [compareSchema, setCompareSchema] = useState<any>(null);
  const [compareResult, setCompareResult] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error: toastError, success } = useToast();

  useEffect(() => {
    fetchSavedSchemas();
  }, []);

  const fetchSavedSchemas = async () => {
    try {
      const response = await api.get('/schema/schemas');
      setSavedSchemas(response.data || []);
    } catch {
      // Non-critical — silently fail
    }
  };

  const handleIntrospect = async () => {
    setLoading(true);
    setError(null);
    setIntrospectedSchema(null);
    setCompareResult(null);

    try {
      let response;

      if (schemaType === 'database') {
        response = await api.post('/schema/introspect/database', {
          connection_string: dbConnectionString
        });
      } else if (schemaType === 'api') {
        response = await api.post('/schema/introspect/api', {
          openapi_url: apiUrl,
          api_key: apiKey || null
        });
      } else if (schemaType === 'json') {
        const jsonData = JSON.parse(jsonSample);
        response = await api.post('/schema/introspect/json', {
          json_data: jsonData,
          schema_name: 'sample'
        });
      } else {
        response = await api.post('/schema/introspect/csv', {
          sample_data: csvSample,
          delimiter: csvDelimiter,
          has_header: true
        });
      }

      setIntrospectedSchema(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Introspection failed';
      setError(msg);
      toastError(msg, 'Introspection Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchema = async () => {
    if (!introspectedSchema || !saveSchemaName.trim()) return;

    setSaving(true);
    try {
      await api.post('/schema/schemas', {
        name: saveSchemaName.trim(),
        source_type: schemaType,
        schema_data: introspectedSchema
      });
      success('Schema saved successfully', 'Saved');
      setShowSaveModal(false);
      setSaveSchemaName('');
      await fetchSavedSchemas();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save schema', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompare = async () => {
    if (!introspectedSchema || !compareSchema) return;

    setComparing(true);
    setCompareResult(null);
    try {
      const response = await api.post('/schema/compare', {
        schema1: introspectedSchema,
        schema2: compareSchema
      });
      setCompareResult(response.data);
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Comparison failed', 'Error');
    } finally {
      setComparing(false);
    }
  };

  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.connectors?.view) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to access schema introspection." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schema Introspection</h1>
          <p className="text-gray-600 mt-1">
            Discover and analyze schemas from various data sources
          </p>
        </div>

        {/* Schema Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Select Source Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['database', 'api', 'json', 'csv'] as SchemaType[]).map((type) => {
              const icons: Record<SchemaType, React.ElementType> = {
                database: Database,
                api: FileJson,
                json: FileJson,
                csv: Table,
              };
              const labels: Record<SchemaType, string> = {
                database: 'Database',
                api: 'API (OpenAPI)',
                json: 'JSON Sample',
                csv: 'CSV Sample',
              };
              const Icon = icons[type];
              return (
                <button
                  key={type}
                  onClick={() => setSchemaType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    schemaType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${schemaType === type ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{labels[type]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>

          {schemaType === 'database' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection String
                </label>
                <input
                  type="text"
                  value={dbConnectionString}
                  onChange={(e) => setDbConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@localhost:5432/database"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: postgresql://user:password@localhost:5432/dbname
                </p>
              </div>
            </div>
          )}

          {schemaType === 'api' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAPI/Swagger URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/swagger.json"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Optional API key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {schemaType === 'json' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample JSON Data
              </label>
              <textarea
                value={jsonSample}
                onChange={(e) => setJsonSample(e.target.value)}
                placeholder='{"id": 1, "name": "Example", "created_at": "2025-01-01"}'
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {schemaType === 'csv' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample CSV Data (first few lines)
                </label>
                <textarea
                  value={csvSample}
                  onChange={(e) => setCsvSample(e.target.value)}
                  placeholder="id,name,email,created_at&#10;1,John Doe,john@example.com,2025-01-01&#10;2,Jane Smith,jane@example.com,2025-01-02"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delimiter
                </label>
                <select
                  value={csvDelimiter}
                  onChange={(e) => setCsvDelimiter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value={'\t'}>Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleIntrospect}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <><Loader className="w-5 h-5 animate-spin" /> Introspecting...</>
            ) : (
              <><Search className="w-5 h-5" /> Introspect Schema</>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Schema Display */}
        {introspectedSchema && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Introspected Schema</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowComparePanel(!showComparePanel); setCompareResult(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Schema
                </button>
              </div>
            </div>

            <SchemaTree schema={introspectedSchema} />

            {/* Schema Statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {introspectedSchema.table_count !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Tables</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {introspectedSchema.table_count}
                  </p>
                </div>
              )}
              {introspectedSchema.field_count !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Fields</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {introspectedSchema.field_count}
                  </p>
                </div>
              )}
              {introspectedSchema.schema_count !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Schemas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {introspectedSchema.schema_count}
                  </p>
                </div>
              )}
              {introspectedSchema.source_type && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Source Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {introspectedSchema.source_type}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compare Panel */}
        {showComparePanel && introspectedSchema && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Compare Schemas
              </h3>
              <button onClick={() => { setShowComparePanel(false); setCompareResult(null); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select a saved schema to compare against the current introspected schema.
            </p>

            {savedSchemas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No saved schemas available. Save a schema first to enable comparison.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {savedSchemas.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => setCompareSchema(saved.schema_data)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      compareSchema === saved.schema_data
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{saved.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{saved.source_type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(saved.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleCompare}
              disabled={!compareSchema || comparing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {comparing ? (
                <><Loader className="w-4 h-4 animate-spin" /> Comparing...</>
              ) : (
                <><GitCompare className="w-4 h-4" /> Run Comparison</>
              )}
            </button>

            {/* Comparison Results */}
            {compareResult && (
              <div className="mt-6 space-y-4">
                {/* Compatibility Score */}
                <div className={`p-4 rounded-lg border ${
                  compareResult.schemas_match
                    ? 'bg-green-50 border-green-200'
                    : compareResult.compatibility_score >= 70
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      {compareResult.schemas_match ? 'Schemas are identical' : 'Schemas differ'}
                    </h4>
                    <span className={`text-2xl font-bold ${
                      compareResult.compatibility_score >= 80 ? 'text-green-700'
                      : compareResult.compatibility_score >= 50 ? 'text-yellow-700'
                      : 'text-red-700'
                    }`}>
                      {compareResult.compatibility_score}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Compatibility score</p>
                </div>

                {/* Added Fields */}
                {compareResult.added_fields.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-800 flex items-center gap-1 mb-2">
                      <Plus className="w-4 h-4" />
                      Added Fields ({compareResult.added_fields.length})
                    </h5>
                    <ul className="space-y-1">
                      {compareResult.added_fields.map((f) => (
                        <li key={f} className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Removed Fields */}
                {compareResult.removed_fields.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-800 flex items-center gap-1 mb-2">
                      <Minus className="w-4 h-4" />
                      Removed Fields ({compareResult.removed_fields.length})
                    </h5>
                    <ul className="space-y-1">
                      {compareResult.removed_fields.map((f) => (
                        <li key={f} className="text-sm bg-red-50 text-red-800 px-3 py-1 rounded">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Type Changes */}
                {compareResult.type_changes.length > 0 && (
                  <div>
                    <h5 className="font-medium text-orange-800 flex items-center gap-1 mb-2">
                      <Edit2 className="w-4 h-4" />
                      Type Changes ({compareResult.type_changes.length})
                    </h5>
                    <ul className="space-y-1">
                      {compareResult.type_changes.map((tc) => (
                        <li key={tc.field} className="text-sm bg-orange-50 text-orange-800 px-3 py-1 rounded">
                          <span className="font-medium">{tc.field}</span>: {tc.old_type} → {tc.new_type}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Modified Fields */}
                {compareResult.modified_fields.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800 flex items-center gap-1 mb-2">
                      <Edit2 className="w-4 h-4" />
                      Modified Fields ({compareResult.modified_fields.length})
                    </h5>
                    <ul className="space-y-1">
                      {compareResult.modified_fields.map((mf) => (
                        <li key={mf.field} className="text-sm bg-yellow-50 text-yellow-800 px-3 py-1 rounded">
                          <span className="font-medium">{mf.field}</span>:{' '}
                          {Object.entries(mf.modifications)
                            .map(([k, v]) => `${k}: ${v.old} → ${v.new}`)
                            .join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Saved Schemas Panel */}
        {savedSchemas.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Saved Schemas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSchemas.map((saved) => (
                <div key={saved.id} className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900">{saved.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {saved.source_type} · {new Date(saved.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Schema Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Schema</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveSchemaName(''); }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schema Name</label>
                <input
                  type="text"
                  value={saveSchemaName}
                  onChange={(e) => setSaveSchemaName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSchema()}
                  placeholder="Enter a name for this schema"
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowSaveModal(false); setSaveSchemaName(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchema}
                  disabled={!saveSchemaName.trim() || saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchemaIntrospectPage;
