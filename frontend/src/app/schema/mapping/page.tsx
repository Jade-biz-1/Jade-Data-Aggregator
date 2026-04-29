'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SchemaTree } from '@/components/schema/schema-tree';
import { FieldMapper } from '@/components/schema/field-mapper';
import {
  Database,
  Save,
  Code,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import type {
  SchemaDefinition,
  SchemaField,
  SchemaFieldMapping,
  SchemaMappingValidationResult
} from '@/types/schema';

const SchemaMappingPage = () => {
  const searchParams = useSearchParams();

  const [sourceSchema, setSourceSchema] = useState<SchemaDefinition | null>(null);
  const [destSchema, setDestSchema] = useState<SchemaDefinition | null>(null);
  const [mappings, setMappings] = useState<SchemaFieldMapping[]>([]);
  const [savedSchemas, setSavedSchemas] = useState<SchemaDefinition[]>([]);
  const [isGeneratingMapping, setIsGeneratingMapping] = useState(false);
  const [validationResult, setValidationResult] = useState<SchemaMappingValidationResult | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<number | null>(null);
  const [currentMappingId, setCurrentMappingId] = useState<number | null>(null);
  const [isSavingMapping, setIsSavingMapping] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<'python' | 'sql' | null>(null);
  const [mappingName, setMappingName] = useState('');

  // Save-name modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');
  const [saveModalError, setSaveModalError] = useState('');

  const { toasts, success, error, warning } = useToast();

  const fetchSavedSchemas = useCallback(async () => {
    try {
      const schemas = await apiClient.getSchemas();
      setSavedSchemas(schemas);
    } catch (err: unknown) {
      console.error('Error fetching schemas:', err);
      const message = err instanceof Error ? err.message : 'Failed to load schemas';
      error(message, 'Error');
    }
  }, [error]);

  useEffect(() => {
    fetchSavedSchemas();
  }, [fetchSavedSchemas]);

  // Load a specific mapping when ?id=X is in the URL (e.g. opened from Pipeline Builder)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    const mappingId = Number(idParam);
    if (!mappingId) return;

    (async () => {
      try {
        const mapping = await apiClient.fetch<any>(`/schema/mappings/${mappingId}`);
        const m = mapping as any;
        setCurrentMappingId(m.id);
        setMappingName(m.name ?? '');
        setMappings(m.field_mappings ?? []);
        // Load source and destination schemas
        const [src, dst] = await Promise.all([
          apiClient.getSchema(m.source_schema_id),
          apiClient.getSchema(m.destination_schema_id),
        ]);
        setSourceSchema(src);
        setSelectedSourceId(m.source_schema_id);
        setDestSchema(dst);
        setSelectedDestId(m.destination_schema_id);
      } catch {
        // Non-critical — proceed without pre-loading
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetMappingState = useCallback(() => {
    setMappings([]);
    setCurrentMappingId(null);
    setValidationResult(null);
    setGeneratedCode(null);
  }, []);

  const loadSchema = async (schemaId: number, isSource: boolean) => {
    if (!schemaId) {
      if (isSource) {
        setSourceSchema(null);
        setSelectedSourceId(null);
      } else {
        setDestSchema(null);
        setSelectedDestId(null);
      }
      resetMappingState();
      return;
    }

    try {
      const schema = await apiClient.getSchema(schemaId);
      if (isSource) {
        setSourceSchema(schema);
        setSelectedSourceId(schemaId);
        if (!currentMappingId) {
          const destName = destSchema?.name;
          setMappingName(destName ? `${schema.name} -> ${destName}` : schema.name);
        }
      } else {
        setDestSchema(schema);
        setSelectedDestId(schemaId);
        if (!currentMappingId) {
          const srcName = sourceSchema?.name;
          setMappingName(srcName ? `${srcName} -> ${schema.name}` : schema.name);
        }
      }

      resetMappingState();
    } catch (err: unknown) {
      console.error('Error loading schema:', err);
      const message = err instanceof Error ? err.message : 'Failed to load schema';
      error(message, 'Error');
    }
  };

  const buildMappingName = useCallback(() => {
    if (sourceSchema?.name && destSchema?.name) {
      return `${sourceSchema.name} -> ${destSchema.name}`;
    }
    return 'Schema Mapping';
  }, [sourceSchema, destSchema]);

  const syncMappingToServer = useCallback(async (nameOverride?: string) => {
    if (!selectedSourceId || !selectedDestId) {
      throw new Error('Select both source and destination schemas before saving.');
    }

    const nameToUse = nameOverride ?? mappingName.trim() ?? buildMappingName();
    let mappingId = currentMappingId;

    if (!mappingId) {
      const created = await apiClient.createSchemaMapping({
        name: nameToUse,
        source_schema_id: selectedSourceId,
        destination_schema_id: selectedDestId,
        auto_generate: false,
      });

      mappingId = created.id;
      setCurrentMappingId(mappingId);

      if (!mappings.length && created.field_mappings?.length) {
        setMappings(created.field_mappings);
      }
    }

    await apiClient.updateSchemaMappingFields(mappingId, mappings);
    return mappingId;
  }, [buildMappingName, currentMappingId, mappingName, mappings, selectedDestId, selectedSourceId]);

  const handleAutoGenerate = async () => {
    if (!selectedSourceId || !selectedDestId) {
      warning('Select both source and destination schemas before generating mappings.', 'Schema Mapping');
      return;
    }

    setIsGeneratingMapping(true);
    try {
      const response = await apiClient.createSchemaMapping({
        name: mappingName.trim() || buildMappingName(),
        source_schema_id: selectedSourceId,
        destination_schema_id: selectedDestId,
        auto_generate: true,
      });

      setMappings(response.field_mappings || []);
      setCurrentMappingId(response.id);
      setValidationResult(null);
      setGeneratedCode(null);
      success('Generated mappings automatically.', 'Success');
    } catch (err: unknown) {
      console.error('Error auto-generating mappings:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate mappings';
      error(message, 'Error');
    } finally {
      setIsGeneratingMapping(false);
    }
  };

  const handleMappingsChange = (updated: SchemaFieldMapping[]) => {
    setMappings(updated);
    setValidationResult(null);
    setGeneratedCode(null);
  };

  const handleSaveMapping = () => {
    if (!mappings.length) {
      warning('Add at least one field mapping before saving.', 'Schema Mapping');
      return;
    }
    if (!selectedSourceId || !selectedDestId) {
      warning('Select both source and destination schemas before saving.', 'Schema Mapping');
      return;
    }
    if (currentMappingId) {
      // Already named — just update field mappings silently
      doSave(mappingName);
    } else {
      // First save — ask for a name
      setSaveModalName(mappingName || buildMappingName());
      setSaveModalError('');
      setShowSaveModal(true);
    }
  };

  const doSave = async (nameToUse: string) => {
    setIsSavingMapping(true);
    try {
      await syncMappingToServer(nameToUse);
      setMappingName(nameToUse);
      success(`Mapping "${nameToUse}" saved. Select it by this name in the Pipeline Builder.`, 'Saved');
    } catch (err: unknown) {
      console.error('Error saving mapping:', err);
      const message = err instanceof Error ? err.message : 'Failed to save mapping';
      error(message, 'Error');
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleSaveModalConfirm = () => {
    const name = saveModalName.trim();
    if (!name) {
      setSaveModalError('Please enter a name for this mapping.');
      return;
    }
    setShowSaveModal(false);
    doSave(name);
  };

  const handleValidate = async () => {
    if (!mappings.length) {
      warning('Map at least one field before validating.', 'Schema Mapping');
      return;
    }

    setIsValidating(true);
    try {
      const mappingId = await syncMappingToServer(mappingName || buildMappingName());
      const result = await apiClient.validateSchemaMapping(mappingId);
      setValidationResult(result);

      if (result.is_valid) {
        success('Mapping validated successfully.', 'Success');
      } else if (result.errors && result.errors.length > 0) {
        warning('Validation completed with errors.', 'Validation');
      }
    } catch (err: unknown) {
      console.error('Error validating mapping:', err);
      const message = err instanceof Error ? err.message : 'Failed to validate mapping';
      if (message.toLowerCase().includes('select both')) {
        warning(message, 'Schema Mapping');
      } else {
        error(message, 'Error');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateCode = async (language: 'python' | 'sql') => {
    if (!mappings.length) {
      warning('Map at least one field before generating code.', 'Schema Mapping');
      return;
    }

    setIsGeneratingCode(language);
    try {
      const mappingId = await syncMappingToServer(mappingName || buildMappingName());
      const result = await apiClient.generateSchemaMappingCode(mappingId, language);
      setGeneratedCode(result.code);
      success(`Generated ${language.toUpperCase()} code.`, 'Success');
    } catch (err: unknown) {
      console.error('Error generating code:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate code';
      if (message.toLowerCase().includes('select both')) {
        warning(message, 'Schema Mapping');
      } else {
        error(message, 'Error');
      }
    } finally {
      setIsGeneratingCode(null);
    }
  };

  const getSourceFields = (): SchemaField[] => {
    if (!sourceSchema?.schema_data) return [];
    if (sourceSchema.schema_data.fields) return sourceSchema.schema_data.fields;
    if (sourceSchema.schema_data.tables && sourceSchema.schema_data.tables[0]) {
      return sourceSchema.schema_data.tables[0].fields;
    }
    return [];
  };

  const getDestFields = (): SchemaField[] => {
    if (!destSchema?.schema_data) return [];
    if (destSchema.schema_data.fields) return destSchema.schema_data.fields;
    if (destSchema.schema_data.tables && destSchema.schema_data.tables[0]) {
      return destSchema.schema_data.tables[0].fields;
    }
    return [];
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
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

        {/* Saved mapping name banner */}
        {currentMappingId && mappingName && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-green-900">
              Editing mapping: <strong>{mappingName}</strong>
            </span>
            <span className="text-xs text-green-700">
              Select this name in the Pipeline Builder → Schema Mapping node
            </span>
          </div>
        )}

        {/* Field Mapper */}
        {sourceSchema && destSchema && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FieldMapper
              sourceFields={getSourceFields()}
              destinationFields={getDestFields()}
              mappings={mappings}
              onMappingsChange={handleMappingsChange}
              onAutoGenerate={handleAutoGenerate}
              isGenerating={isGeneratingMapping}
            />
          </div>
        )}

        {/* Actions */}
        {mappings.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSaveMapping}
                disabled={isSavingMapping}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
                  isSavingMapping ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save className={`w-4 h-4 ${isSavingMapping ? 'animate-spin' : ''}`} />
                {isSavingMapping ? 'Saving...' : 'Save Mapping'}
              </button>

              <button
                onClick={handleValidate}
                disabled={isValidating}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
                  isValidating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                {isValidating ? 'Validating...' : 'Validate Mapping'}
              </button>

              <button
                onClick={() => handleGenerateCode('python')}
                disabled={isGeneratingCode === 'python'}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
                  isGeneratingCode === 'python' ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Code className="w-4 h-4" />
                {isGeneratingCode === 'python' ? 'Generating...' : 'Generate Python Code'}
              </button>

              <button
                onClick={() => handleGenerateCode('sql')}
                disabled={isGeneratingCode === 'sql'}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
                  isGeneratingCode === 'sql' ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Code className="w-4 h-4" />
                {isGeneratingCode === 'sql' ? 'Generating...' : 'Generate SQL'}
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
              <h3 className="text-lg font-semibold text-gray-900">Generated Transformation Code</h3>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generatedCode);
                    success('Code copied to clipboard.', 'Copied');
                  } catch (err: unknown) {
                    console.error('Clipboard error:', err);
                    error('Failed to copy code to clipboard', 'Error');
                  }
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

      {/* Save Mapping modal — asks for a name before first save */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Name this Mapping</h2>
              <button onClick={() => setShowSaveModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Give your mapping a clear name — this is how you'll identify it in the Pipeline Builder dropdown.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Mapping Name</label>
              <input
                type="text"
                value={saveModalName}
                onChange={e => { setSaveModalName(e.target.value); setSaveModalError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveModalConfirm(); }}
                placeholder="e.g. CRM Contacts to Warehouse"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {saveModalError && (
                <p className="text-xs text-red-600">{saveModalError}</p>
              )}
              <p className="text-xs text-gray-400">
                Tip: use a name that describes what data is being reshaped, e.g. &quot;Person to Contact&quot;.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalConfirm}
                disabled={isSavingMapping}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingMapping ? 'Saving…' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function SchemaMappingPageWrapper() {
  return (
    <Suspense>
      <SchemaMappingPage />
    </Suspense>
  );
}
