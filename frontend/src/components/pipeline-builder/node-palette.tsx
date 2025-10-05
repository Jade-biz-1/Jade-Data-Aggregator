'use client';

import { Database, Globe, FileText, Filter, Layers, BarChart3, GitMerge, ArrowUpDown, FileOutput, Warehouse } from 'lucide-react';

const nodeCategories = [
  {
    category: 'Sources',
    nodes: [
      { type: 'source', subtype: 'database', label: 'Database Source', icon: Database, color: 'blue' },
      { type: 'source', subtype: 'api', label: 'API Source', icon: Globe, color: 'blue' },
      { type: 'source', subtype: 'file', label: 'File Source', icon: FileText, color: 'blue' }
    ]
  },
  {
    category: 'Transformations',
    nodes: [
      { type: 'transformation', subtype: 'filter', label: 'Filter', icon: Filter, color: 'purple' },
      { type: 'transformation', subtype: 'map', label: 'Map', icon: Layers, color: 'purple' },
      { type: 'transformation', subtype: 'aggregate', label: 'Aggregate', icon: BarChart3, color: 'purple' },
      { type: 'transformation', subtype: 'join', label: 'Join', icon: GitMerge, color: 'purple' },
      { type: 'transformation', subtype: 'sort', label: 'Sort', icon: ArrowUpDown, color: 'purple' }
    ]
  },
  {
    category: 'Destinations',
    nodes: [
      { type: 'destination', subtype: 'database', label: 'Database', icon: Database, color: 'green' },
      { type: 'destination', subtype: 'file', label: 'File Output', icon: FileOutput, color: 'green' },
      { type: 'destination', subtype: 'api', label: 'API Destination', icon: Globe, color: 'green' },
      { type: 'destination', subtype: 'warehouse', label: 'Data Warehouse', icon: Warehouse, color: 'green' }
    ]
  }
];

interface NodePaletteProps {
  onAddNode: (type: string, subtype: string, label: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const getColorClasses = (color: string) => {
    const classes = {
      blue: 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-700',
      purple: 'bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-700',
      green: 'bg-green-50 border-green-300 hover:bg-green-100 text-green-700'
    };
    return classes[color as keyof typeof classes] || classes.blue;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Palette</h3>

      {nodeCategories.map((category) => (
        <div key={category.category} className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>

          <div className="space-y-2">
            {category.nodes.map((node) => {
              const Icon = node.icon;

              return (
                <button
                  key={`${node.type}-${node.subtype}`}
                  onClick={() => onAddNode(node.type, node.subtype, node.label)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${getColorClasses(
                    node.color
                  )}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{node.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
