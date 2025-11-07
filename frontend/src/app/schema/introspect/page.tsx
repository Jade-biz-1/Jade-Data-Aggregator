'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SchemaTree } from '@/components/schema/schema-tree';
import { Database, FileJson, Table, Save, Search } from 'lucide-react';

type SchemaType = 'database' | 'api' | 'json' | 'csv';

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

  const handleIntrospect = async () => {
    setLoading(true);
    setError(null);
    setIntrospectedSchema(null);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      let response;

      if (schemaType === 'database') {
        response = await fetch(`${baseUrl}/api/v1/schema/introspect/database`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            connection_string: dbConnectionString
          })
        });
      } else if (schemaType === 'api') {
        response = await fetch(`${baseUrl}/api/v1/schema/introspect/api`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            openapi_url: apiUrl,
            api_key: apiKey || null
          })
        });
      } else if (schemaType === 'json') {
        const jsonData = JSON.parse(jsonSample);
        response = await fetch(`${baseUrl}/api/v1/schema/introspect/json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            json_data: jsonData,
            schema_name: 'sample'
          })
        });
      } else { // csv
        response = await fetch(`${baseUrl}/api/v1/schema/introspect/csv`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sample_data: csvSample,
            delimiter: csvDelimiter,
            has_header: true
          })
        });
      }

      if (response.ok) {
        const schema = await response.json();
        setIntrospectedSchema(schema);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Introspection failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchema = async () => {
    if (!introspectedSchema) return;

    const schemaName = prompt('Enter a name for this schema:');
    if (!schemaName) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(`${baseUrl}/api/v1/schema/schemas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: schemaName,
          source_type: schemaType,
          schema_data: introspectedSchema
        })
      });

      if (response.ok) {
        alert('Schema saved successfully!');
      } else {
        alert('Failed to save schema');
      }
    } catch (error) {
      console.error('Error saving schema:', error);
      alert('An error occurred while saving');
    }
  };

  return (
    <DashboardLayout>
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
            <button
              onClick={() => setSchemaType('database')}
              className={`p-4 rounded-lg border-2 transition-all ${
                schemaType === 'database'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Database className={`w-8 h-8 mx-auto mb-2 ${
                schemaType === 'database' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">Database</span>
            </button>

            <button
              onClick={() => setSchemaType('api')}
              className={`p-4 rounded-lg border-2 transition-all ${
                schemaType === 'api'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileJson className={`w-8 h-8 mx-auto mb-2 ${
                schemaType === 'api' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">API (OpenAPI)</span>
            </button>

            <button
              onClick={() => setSchemaType('json')}
              className={`p-4 rounded-lg border-2 transition-all ${
                schemaType === 'json'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileJson className={`w-8 h-8 mx-auto mb-2 ${
                schemaType === 'json' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">JSON Sample</span>
            </button>

            <button
              onClick={() => setSchemaType('csv')}
              className={`p-4 rounded-lg border-2 transition-all ${
                schemaType === 'csv'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Table className={`w-8 h-8 mx-auto mb-2 ${
                schemaType === 'csv' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">CSV Sample</span>
            </button>
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
                  placeholder="id,name,email,created_at\n1,John Doe,john@example.com,2025-01-01\n2,Jane Smith,jane@example.com,2025-01-02"
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
                  <option value="\t">Tab</option>
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
            <Search className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Introspecting...' : 'Introspect Schema'}
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
              <button
                onClick={handleSaveSchema}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Schema
              </button>
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
      </div>
    </DashboardLayout>
  );
};

export default SchemaIntrospectPage;
