'use client';

import { Handle, Position } from 'reactflow';
import { Filter, Layers, BarChart3, GitMerge, ArrowUpDown } from 'lucide-react';

interface TransformationNodeProps {
  data: {
    label: string;
    transformationType?: 'filter' | 'map' | 'aggregate' | 'join' | 'sort';
    config?: any;
  };
  selected?: boolean;
}

export function TransformationNode({ data, selected }: TransformationNodeProps) {
  const getIcon = () => {
    switch (data.transformationType) {
      case 'filter':
        return <Filter className="h-5 w-5" />;
      case 'map':
        return <Layers className="h-5 w-5" />;
      case 'aggregate':
        return <BarChart3 className="h-5 w-5" />;
      case 'join':
        return <GitMerge className="h-5 w-5" />;
      case 'sort':
        return <ArrowUpDown className="h-5 w-5" />;
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-purple-50 min-w-[200px] ${
        selected ? 'border-purple-600 shadow-lg' : 'border-purple-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center space-x-2">
        <div className="text-purple-600">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-purple-900">
            {data.label || 'Transform'}
          </div>
          <div className="text-xs text-purple-700">
            {data.transformationType || 'map'}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  );
}
