'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SchemaTree } from '@/components/schema/schema-tree';
import { FieldMapper } from '@/components/schema/field-mapper';
import {
  Database,
  FileJson,
  Table as TableIcon,
  Save,
  Code,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface Schema {
  id?: number;
  name: string;
  source_type: string;
  schema_data: any;
  fields?: any[];
  tables?: any[];
}

interface FieldMapping {
  source_field?: string;
  destination_field: string;
  mapping_type: string;
  transformation?: any;
  description?: string;
}

const SchemaMappingPage = () => {
  const [sourceSchema, setSourceSchema] = useState<Schema | null>(null);
  const [destSchema, setDestSchema] = useState<Schema | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [savedSchemas, setSavedSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<number | null>(null);

  useEffect(() => {
    fetchSavedSchemas();
  }, []);

  const fetchSavedSchemas = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(`${baseUrl}/api/v1/schema/schemas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedSchemas(data.schemas || []);
      }
    } catch (error) {
      console.error('Error fetching schemas:', error);
    }
  };

  const loadSchema = async (schemaId: number, isSource: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(`${baseUrl}/api/v1/schema/schemas/${schemaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const schema = await response.json();
        if (isSource) {
          setSourceSchema(schema);
          setSelectedSourceId(schemaId);
        } else {
          setDestSchema(schema);
          setSelectedDestId(schemaId);
        }
      }
    } catch (error) {
      console.error('Error loading schema:', error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedSourceId || !selectedDestId) {
      alert('Please select both source and destination schemas');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(`${baseUrl}/api/v1/schema/mappings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Mapping ${sourceSchema?.name} to ${destSchema?.name}`,
          source_schema_id: selectedSourceId,
          destination_schema_id: selectedDestId,
          auto_generate: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMappings(data.field_mappings || []);
      }
    } catch (error) {
      console.error('Error auto-generating mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    // In a real implementation, this would call the validation endpoint
    const unmappedRequired = getUnmappedRequiredFields();

    setValidationResult({
      is_valid: unmappedRequired.length === 0,
      errors: unmappedRequired.map(f => `Required field '${f.name}' is not mapped`)
    });
  };

  const handleGenerateCode = async (language: 'python' | 'sql') => {
    // Mock code generation
    if (language === 'python') {
      const code = `def transform_data(source_record: dict) -> dict:
    """Transform source record to destination format"""
    destination_record = {}

${mappings.map(m => {
  if (m.mapping_type === 'direct') {
    return `    destination_record['${m.destination_field}'] = source_record.get('${m.source_field}')`;
  }
  return `    # TODO: Transform ${m.source_field} to ${m.destination_field}`;
}).join('\n')}

    return destination_record`;

      setGeneratedCode(code);
    } else {
      const code = `SELECT
${mappings.map((m, idx) => {
  const isLast = idx === mappings.length - 1;
  return `    src.${m.source_field} AS ${m.destination_field}${isLast ? '' : ','}`;
}).join('\n')}
FROM source_table AS src`;

      setGeneratedCode(code);
    }
  };

  const getSourceFields = () => {
    if (!sourceSchema?.schema_data) return [];
    if (sourceSchema.schema_data.fields) return sourceSchema.schema_data.fields;
    if (sourceSchema.schema_data.tables && sourceSchema.schema_data.tables[0]) {
      return sourceSchema.schema_data.tables[0].fields;
    }
    return [];
  };

  const getDestFields = () => {
    if (!destSchema?.schema_data) return [];
    if (destSchema.schema_data.fields) return destSchema.schema_data.fields;
    if (destSchema.schema_data.tables && destSchema.schema_data.tables[0]) {
      return destSchema.schema_data.tables[0].fields;
    }
    return [];
  };

  const getUnmappedRequiredFields = () => {
    const destFields = getDestFields();
    const mappedFields = new Set(mappings.map(m => m.destination_field));
    return destFields.filter(f => !f.nullable && !mappedFields.has(f.name));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schema Mapping</h1>
          <p className="text-gray-600 mt-1">
            Map fields between source and destination schemas
          </p>
        </div>

        {/* Schema Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Schema Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Source Schema
            </h3>
            <select
              value={selectedSourceId || ''}
              onChange={(e) => loadSchema(Number(e.target.value), true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a schema...</option>
              {savedSchemas.map(schema => (
                <option key={schema.id} value={schema.id}>
                  {schema.name} ({schema.source_type})
                </option>
              ))}
            </select>

            {sourceSchema && (
              <div className="mt-4">
                <SchemaTree schema={sourceSchema.schema_data} />
              </div>
            )}
          </div>

          {/* Destination Schema Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Destination Schema
            </h3>
            <select
              value={selectedDestId || ''}
              onChange={(e) => loadSchema(Number(e.target.value), false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a schema...</option>
              {savedSchemas.map(schema => (
                <option key={schema.id} value={schema.id}>
                  {schema.name} ({schema.source_type})
                </option>
              ))}
            </select>

            {destSchema && (
              <div className="mt-4">
                <SchemaTree schema={destSchema.schema_data} />
              </div>
            )}
          </div>
        </div>

        {/* Field Mapper */}
        {sourceSchema && destSchema && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FieldMapper
              sourceFields={getSourceFields()}
              destinationFields={getDestFields()}
              mappings={mappings}
              onMappingsChange={setMappings}
              onAutoGenerate={handleAutoGenerate}
            />
          </div>
        )}

        {/* Actions */}
        {mappings.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="flex gap-4">
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Validate Mapping
              </button>

              <button
                onClick={() => handleGenerateCode('python')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                Generate Python Code
              </button>

              <button
                onClick={() => handleGenerateCode('sql')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                Generate SQL
              </button>
            </div>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.is_valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {validationResult.is_valid ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  validationResult.is_valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {validationResult.is_valid ? 'Mapping is Valid' : 'Validation Errors'}
                </h4>
                {!validationResult.is_valid && validationResult.errors && (
                  <ul className="mt-2 space-y-1">
                    {validationResult.errors.map((error: string, idx: number) => (
                      <li key={idx} className="text-sm text-red-700">• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generated Code */}
        {generatedCode && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generated Transformation Code</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert('Code copied to clipboard!');
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Copy Code
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SchemaMappingPage;
