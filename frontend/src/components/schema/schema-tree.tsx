'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Key, Link as LinkIcon, Type } from 'lucide-react';
import type { SchemaField, SchemaTable, SchemaData } from '@/types/schema';

interface SchemaTreeProps {
  schema: SchemaData;
  onFieldClick?: (field: SchemaField, table?: SchemaTable) => void;
  selectedFields?: Set<string>;
}

const getTypeColor = (dataType: string): string => {
  const type = dataType.toLowerCase();
  if (type.includes('string') || type.includes('text') || type.includes('varchar')) {
    return 'text-blue-600';
  } else if (type.includes('int') || type.includes('number')) {
    return 'text-green-600';
  } else if (type.includes('bool')) {
    return 'text-purple-600';
  } else if (type.includes('date') || type.includes('time')) {
    return 'text-orange-600';
  } else if (type.includes('json')) {
    return 'text-pink-600';
  }
  return 'text-gray-600';
};

const FieldItem: React.FC<{
  field: SchemaField;
  table?: SchemaTable;
  onFieldClick?: (field: SchemaField, table?: SchemaTable) => void;
  isSelected?: boolean;
}> = ({ field, table, onFieldClick, isSelected }) => {
  return (
    <div
      className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
        isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
      }`}
      onClick={() => onFieldClick?.(field, table)}
    >
      <div className="flex items-center gap-2 flex-1">
        <Type className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-sm">{field.name}</span>
        {field.primary_key && (
          <Key className="w-3 h-3 text-yellow-500" title="Primary Key" />
        )}
        {field.foreign_key && (
          <LinkIcon className="w-3 h-3 text-blue-500" title={`Foreign Key: ${field.foreign_key}`} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${getTypeColor(field.data_type)}`}>
          {field.data_type}
        </span>
        {!field.nullable && (
          <span className="text-xs text-red-500 font-semibold" title="Not Nullable">
            *
          </span>
        )}
      </div>
    </div>
  );
};

const TableItem: React.FC<{
  table: SchemaTable;
  onFieldClick?: (field: SchemaField, table?: SchemaTable) => void;
  selectedFields?: Set<string>;
}> = ({ table, onFieldClick, selectedFields }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
        <Database className="w-4 h-4 text-gray-700" />
        <span className="font-semibold text-gray-900">{table.name}</span>
        <span className="text-xs text-gray-500">({table.fields.length} fields)</span>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {table.fields.map((field, idx) => (
            <FieldItem
              key={idx}
              field={field}
              table={table}
              onFieldClick={onFieldClick}
              isSelected={selectedFields?.has(`${table.name}.${field.name}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SchemaTree: React.FC<SchemaTreeProps> = ({
  schema,
  onFieldClick,
  selectedFields
}) => {
  // Handle different schema structures
  const hasTables = schema.tables && schema.tables.length > 0;
  const hasFields = schema.fields && schema.fields.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {schema.schema_name || 'Schema'}
        </h3>
        {schema.source_type && (
          <p className="text-sm text-gray-600 mt-1">
            Type: {schema.source_type}
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {hasTables && schema.tables?.map((table, idx) => (
          <TableItem
            key={idx}
            table={table}
            onFieldClick={onFieldClick}
            selectedFields={selectedFields}
          />
        ))}

        {hasFields && !hasTables && (
          <div className="space-y-1">
            {schema.fields?.map((field, idx) => (
              <FieldItem
                key={idx}
                field={field}
                onFieldClick={onFieldClick}
                isSelected={selectedFields?.has(field.name)}
              />
            ))}
          </div>
        )}

        {!hasTables && !hasFields && (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No schema data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
