'use client';

import React, { useState } from 'react';
import { ArrowRight, Wand2, Check, X, Merge, Scissors } from 'lucide-react';
import type { SchemaField, SchemaFieldMapping } from '@/types/schema';

type MappingMode = 'direct' | 'concat' | 'split';

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
  isGenerating = false,
}) => {
  const [mode, setMode] = useState<MappingMode>('direct');

  // Direct mode
  const [selectedDestField, setSelectedDestField] = useState<string | null>(null);

  // Concat mode
  const [concatSources, setConcatSources] = useState<string[]>([]);
  const [concatSeparator, setConcatSeparator] = useState(' ');

  // Split mode
  const [splitSource, setSplitSource] = useState<string | null>(null);
  const [splitSeparator, setSplitSeparator] = useState(' ');

  const getMappingForDestField = (name: string) =>
    mappings.find(m => m.destination_field === name);

  const isMapped = (name: string) =>
    mappings.some(m => m.destination_field === name);

  const removeMapping = (destField: string) =>
    onMappingsChange(mappings.filter(m => m.destination_field !== destField));

  const resetModeState = () => {
    setSelectedDestField(null);
    setConcatSources([]);
    setSplitSource(null);
  };

  const handleModeChange = (next: MappingMode) => {
    setMode(next);
    resetModeState();
  };

  // ── Direct ──────────────────────────────────────────────────────────────
  const handleDirectDestClick = (dest: string) =>
    setSelectedDestField(prev => (prev === dest ? null : dest));

  const handleDirectSourceClick = (src: string) => {
    if (!selectedDestField) return;
    const rest = mappings.filter(m => m.destination_field !== selectedDestField);
    onMappingsChange([...rest, { source_field: src, destination_field: selectedDestField, mapping_type: 'direct' }]);
    setSelectedDestField(null);
  };

  // ── Concat ───────────────────────────────────────────────────────────────
  const toggleConcatSource = (src: string) =>
    setConcatSources(prev =>
      prev.includes(src) ? prev.filter(f => f !== src) : [...prev, src],
    );

  const handleConcatDestClick = (dest: string) => {
    if (concatSources.length < 2) return;
    const rest = mappings.filter(m => m.destination_field !== dest);
    onMappingsChange([
      ...rest,
      {
        source_field: concatSources[0],
        destination_field: dest,
        mapping_type: 'concat',
        transformation: { source_fields: [...concatSources], separator: concatSeparator },
      },
    ]);
    setConcatSources([]);
  };

  // ── Split ────────────────────────────────────────────────────────────────
  const handleSplitSourceClick = (src: string) =>
    setSplitSource(prev => (prev === src ? null : src));

  const handleSplitDestClick = (dest: string) => {
    if (!splitSource) return;
    const existingForSource = mappings.filter(
      m => m.mapping_type === 'split' && m.source_field === splitSource,
    );
    const nextIndex = existingForSource.length;
    const rest = mappings.filter(m => m.destination_field !== dest);
    onMappingsChange([
      ...rest,
      {
        source_field: splitSource,
        destination_field: dest,
        mapping_type: 'split',
        transformation: { separator: splitSeparator, index: nextIndex },
      },
    ]);
  };

  // ── Display helpers ──────────────────────────────────────────────────────
  const getMappingLabel = (dest: string): string | null => {
    const m = getMappingForDestField(dest);
    if (!m) return null;
    if (m.mapping_type === 'concat') {
      const srcs = (m.transformation?.source_fields as string[]) ?? [m.source_field ?? ''];
      const sep = (m.transformation?.separator as string) ?? ' ';
      return `← ${srcs.join(` + `)} (sep: "${sep}")`;
    }
    if (m.mapping_type === 'split') {
      const idx = m.transformation?.index as number ?? 0;
      const sep = (m.transformation?.separator as string) ?? ' ';
      return `← ${m.source_field}.split("${sep}")[${idx}]`;
    }
    return `← ${m.source_field}`;
  };

  const getMappingBadge = (dest: string): 'concat' | 'split' | null => {
    const m = getMappingForDestField(dest);
    if (m?.mapping_type === 'concat') return 'concat';
    if (m?.mapping_type === 'split') return 'split';
    return null;
  };

  const getHint = (): string => {
    if (mode === 'direct')
      return selectedDestField
        ? `Click a source field to map to "${selectedDestField}"`
        : 'Click a destination field, then click a source field';
    if (mode === 'concat') {
      if (concatSources.length === 0) return 'Select 2 or more source fields to concatenate';
      if (concatSources.length === 1) return `1 source selected (${concatSources[0]}) — select at least one more`;
      return `${concatSources.length} sources selected — click a destination field to finish`;
    }
    if (mode === 'split')
      return splitSource
        ? `"${splitSource}" selected — click destination fields in order (index 0, 1, 2…)`
        : 'Click a source field to split';
    return '';
  };

  const unmappedRequired = destinationFields.filter(f => !f.nullable && !isMapped(f.name));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Field Mappings</h3>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => handleModeChange('direct')}
              title="Direct: one source → one destination"
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                mode === 'direct' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Direct
            </button>
            <button
              onClick={() => handleModeChange('concat')}
              title="Concat: multiple sources → one destination"
              className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-300 transition-colors ${
                mode === 'concat' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Merge className="w-3.5 h-3.5" />
              Concat
            </button>
            <button
              onClick={() => handleModeChange('split')}
              title="Split: one source → multiple destinations"
              className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-gray-300 transition-colors ${
                mode === 'split' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Split
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Separator input — only for concat/split */}
          {(mode === 'concat' || mode === 'split') && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Separator:</label>
              <input
                type="text"
                value={mode === 'concat' ? concatSeparator : splitSeparator}
                onChange={e =>
                  mode === 'concat'
                    ? setConcatSeparator(e.target.value)
                    : setSplitSeparator(e.target.value)
                }
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                placeholder=" "
              />
            </div>
          )}

          <button
            onClick={onAutoGenerate}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm ${
              isGenerating ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating…' : 'Auto-Generate'}
          </button>
        </div>
      </div>

      {/* Mapping grid */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
        {/* Source fields */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Source Fields
            {mode === 'concat' && concatSources.length > 0 && (
              <span className="ml-2 text-xs font-normal text-orange-600">
                {concatSources.length} selected
              </span>
            )}
          </h4>
          <div className="border border-gray-200 rounded-lg p-2 space-y-1 max-h-96 overflow-y-auto">
            {sourceFields.map((field, idx) => {
              const isConcatSel = mode === 'concat' && concatSources.includes(field.name);
              const isSplitSel = mode === 'split' && splitSource === field.name;
              const isDirectPending = mode === 'direct' && selectedDestField !== null;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (mode === 'direct') handleDirectSourceClick(field.name);
                    else if (mode === 'concat') toggleConcatSource(field.name);
                    else handleSplitSourceClick(field.name);
                  }}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    isConcatSel
                      ? 'bg-orange-100 border-2 border-orange-400'
                      : isSplitSel
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : isDirectPending
                      ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{field.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">{field.data_type}</span>
                      {isConcatSel && (
                        <span className="text-xs font-bold text-orange-600">
                          #{concatSources.indexOf(field.name) + 1}
                        </span>
                      )}
                      {isSplitSel && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center pt-8">
          <ArrowRight
            className={`w-6 h-6 ${
              mode === 'concat'
                ? 'text-orange-400'
                : mode === 'split'
                ? 'text-purple-400'
                : 'text-gray-400'
            }`}
          />
        </div>

        {/* Destination fields */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Destination Fields</h4>
          <div className="border border-gray-200 rounded-lg p-2 space-y-1 max-h-96 overflow-y-auto">
            {destinationFields.map((field, idx) => {
              const isFieldMapped = isMapped(field.name);
              const isDirectSel = mode === 'direct' && selectedDestField === field.name;
              const badge = getMappingBadge(field.name);
              const label = getMappingLabel(field.name);
              const isSplitTargetOfCurrent =
                mode === 'split' &&
                splitSource !== null &&
                mappings.some(
                  m =>
                    m.mapping_type === 'split' &&
                    m.source_field === splitSource &&
                    m.destination_field === field.name,
                );

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (mode === 'direct') handleDirectDestClick(field.name);
                    else if (mode === 'concat') handleConcatDestClick(field.name);
                    else handleSplitDestClick(field.name);
                  }}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    isDirectSel
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : isSplitTargetOfCurrent
                      ? 'bg-purple-50 border border-purple-300'
                      : badge === 'concat'
                      ? 'bg-orange-50 border border-orange-300'
                      : isFieldMapped
                      ? 'bg-green-50 border border-green-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.name}</span>
                        {!field.nullable && <span className="text-xs text-red-500 font-bold">*</span>}
                        {badge && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              badge === 'concat'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      {label && (
                        <p className="text-xs text-green-600 mt-0.5 truncate">{label}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-mono">{field.data_type}</span>
                      {isFieldMapped && (
                        <button
                          onClick={e => {
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

      {/* Status bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                {mappings.length} / {destinationFields.length} fields mapped
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Required unmapped: {unmappedRequired.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 italic">{getHint()}</p>
        </div>
      </div>

      {/* Unmapped required warning */}
      {unmappedRequired.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-yellow-800 mb-2">Unmapped Required Fields</h5>
          <ul className="list-disc list-inside space-y-1">
            {unmappedRequired.map((field, idx) => (
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
