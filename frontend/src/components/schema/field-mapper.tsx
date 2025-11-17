'use client';

import React, { useState } from 'react';
import { ArrowRight, Wand2, Check, X } from 'lucide-react';
import type { SchemaField, SchemaFieldMapping } from '@/types/schema';

interface FieldMapperProps {
  sourceFields: SchemaField[];
  destinationFields: SchemaField[];
  mappings: SchemaFieldMapping[];
  onMappingsChange: (mappings: SchemaFieldMapping[]) => void;
  onAutoGenerate?: () => void;
  isGenerating?: boolean;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  sourceFields,
  destinationFields,
  mappings,
  onMappingsChange,
  onAutoGenerate,
  isGenerating = false
}) => {
  const [selectedDestField, setSelectedDestField] = useState<string | null>(null);

  const getMappingForDestField = (destFieldName: string): SchemaFieldMapping | undefined => {
    return mappings.find(m => m.destination_field === destFieldName);
  };

  const addMapping = (sourceField: string, destField: string) => {
    // Remove existing mapping for this dest field if any
    const newMappings = mappings.filter(m => m.destination_field !== destField);

    // Add new mapping
    newMappings.push({
      source_field: sourceField,
      destination_field: destField,
      mapping_type: 'direct'
    });

    onMappingsChange(newMappings);
  };

  const removeMapping = (destField: string) => {
    const newMappings = mappings.filter(m => m.destination_field !== destField);
    onMappingsChange(newMappings);
  };

  const isMapped = (destFieldName: string): boolean => {
    return mappings.some(m => m.destination_field === destFieldName);
  };

  const getMappedSourceField = (destFieldName: string): string | undefined => {
    const mapping = getMappingForDestField(destFieldName);
    return mapping?.source_field;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Field Mappings</h3>
        <button
          onClick={onAutoGenerate}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
            isGenerating
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Auto-Generate'}
        </button>
      </div>

      {/* Mapping Grid */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
        {/* Source Fields Column */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Source Fields</h4>
          <div className="border border-gray-200 rounded-lg p-2 space-y-1 max-h-96 overflow-y-auto">
            {sourceFields.map((field, idx) => (
              <div
                key={idx}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  if (selectedDestField) {
                    addMapping(field.name, selectedDestField);
                    setSelectedDestField(null);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{field.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{field.data_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Column */}
        <div className="flex items-center justify-center pt-8">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>

        {/* Destination Fields Column */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Destination Fields</h4>
          <div className="border border-gray-200 rounded-lg p-2 space-y-1 max-h-96 overflow-y-auto">
            {destinationFields.map((field, idx) => {
              const mappedSource = getMappedSourceField(field.name);
              const isFieldMapped = isMapped(field.name);

              return (
                <div
                  key={idx}
                  className={`p-2 rounded cursor-pointer ${
                    selectedDestField === field.name
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : isFieldMapped
                      ? 'bg-green-50 border border-green-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedDestField(
                      selectedDestField === field.name ? null : field.name
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.name}</span>
                        {!field.nullable && (
                          <span className="text-xs text-red-500 font-bold">*</span>
                        )}
                      </div>
                      {mappedSource && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-green-600">← {mappedSource}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">{field.data_type}</span>
                      {isFieldMapped && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMapping(field.name);
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                {mappings.length} / {destinationFields.length} fields mapped
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Required unmapped:{' '}
                {destinationFields.filter(f => !f.nullable && !isMapped(f.name)).length}
              </span>
            </div>
          </div>

          {selectedDestField && (
            <div className="text-sm text-blue-600">
              Click a source field to map to <strong>{selectedDestField}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Unmapped Required Fields Warning */}
      {destinationFields.filter(f => !f.nullable && !isMapped(f.name)).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-yellow-800 mb-2">
            Unmapped Required Fields
          </h5>
          <ul className="list-disc list-inside space-y-1">
            {destinationFields
              .filter(f => !f.nullable && !isMapped(f.name))
              .map((field, idx) => (
                <li key={idx} className="text-sm text-yellow-700">
                  {field.name} ({field.data_type})
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};
