'use client';

import { Handle, Position } from 'reactflow';
import { Database, FileOutput, Globe, Warehouse } from 'lucide-react';

interface DestinationNodeProps {
  data: {
    label: string;
    destinationType?: 'database' | 'file' | 'api' | 'warehouse';
    config?: any;
  };
  selected?: boolean;
}

export function DestinationNode({ data, selected }: DestinationNodeProps) {
  const getIcon = () => {
    switch (data.destinationType) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'file':
        return <FileOutput className="h-5 w-5" />;
      case 'api':
        return <Globe className="h-5 w-5" />;
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-green-50 min-w-[200px] ${
        selected ? 'border-green-600 shadow-lg' : 'border-green-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      <div className="flex items-center space-x-2">
        <div className="text-green-600">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-green-900">
            {data.label || 'Destination'}
          </div>
          <div className="text-xs text-green-700">
            {data.destinationType || 'database'}
          </div>
        </div>
      </div>
    </div>
  );
}
