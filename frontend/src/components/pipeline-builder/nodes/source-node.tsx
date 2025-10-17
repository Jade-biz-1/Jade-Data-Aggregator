'use client';

import { Handle, Position } from 'reactflow';
import { Database, Globe, FileText, CheckCircle } from 'lucide-react';

interface SourceNodeProps {
  data: {
    label: string;
    sourceType?: 'database' | 'api' | 'file';
    config?: any;
    isConfigured?: boolean;
  };
  selected?: boolean;
}

export function SourceNode({ data, selected }: SourceNodeProps) {
  const getIcon = () => {
    switch (data.sourceType) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'api':
        return <Globe className="h-5 w-5" />;
      case 'file':
        return <FileText className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-blue-50 min-w-[200px] relative ${
        selected ? 'border-blue-600 shadow-lg' : 'border-blue-300'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="text-blue-600">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-900">
            {data.label || 'Source'}
          </div>
          <div className="text-xs text-blue-700">
            {data.sourceType || 'database'}
          </div>
        </div>
        {data.isConfigured && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
}
