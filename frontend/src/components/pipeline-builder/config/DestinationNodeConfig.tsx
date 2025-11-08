'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
// Removed Label import; use inline <label> instead
import { Select } from '../../ui';
import { apiClient } from '@/lib/api';

interface DestinationNodeConfigProps {
  config: any;
  onChange: (config: any) => void;
  subtype: string;
}

export function DestinationNodeConfig({ config, onChange, subtype }: DestinationNodeConfigProps) {
  const [connectors, setConnectors] = useState<any[]>([]);

  useEffect(() => {
    if (subtype === 'database' || subtype === 'warehouse') {
      loadConnectors();
    }
  }, [subtype]);

  const loadConnectors = async () => {
    try {
      const data = await apiClient.getConnectors();
      setConnectors(data);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    }
  };

  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  // Database Destination
  if (subtype === 'database') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="connector" className="block text-sm font-medium text-gray-700 mb-1">Database Connector</label>
          <Select
            id="connector"
            value={config.connector_id || ''}
            onChange={(e) => updateConfig('connector_id', e.target.value)}
          >
            <option value="">Select a connector...</option>
            {connectors.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="table_name" className="block text-sm font-medium text-gray-700 mb-1">Target Table</label>
          <Input
            id="table_name"
            type="text"
            value={config.table_name || ''}
            onChange={(e) => updateConfig('table_name', e.target.value)}
            placeholder="target_table"
          />
        </div>

        <div>
          <label htmlFor="write_mode" className="block text-sm font-medium text-gray-700 mb-1">Write Mode</label>
          <Select
            id="write_mode"
            value={config.write_mode || 'insert'}
            onChange={(e) => updateConfig('write_mode', e.target.value)}
          >
            <option value="insert">Insert (append)</option>
            <option value="upsert">Upsert (insert or update)</option>
            <option value="replace">Replace (truncate and insert)</option>
          </Select>
        </div>

        {config.write_mode === 'upsert' && (
          <div>
            <label htmlFor="unique_key" className="block text-sm font-medium text-gray-700 mb-1">Unique Key (for upsert)</label>
            <Input
              id="unique_key"
              type="text"
              value={config.unique_key || ''}
              onChange={(e) => updateConfig('unique_key', e.target.value)}
              placeholder="id"
            />
          </div>
        )}
      </div>
    );
  }

  // File Destination
  if (subtype === 'file') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="file_path" className="block text-sm font-medium text-gray-700 mb-1">Output File Path</label>
          <Input
            id="file_path"
            type="text"
            value={config.file_path || ''}
            onChange={(e) => updateConfig('file_path', e.target.value)}
            placeholder="/path/to/output.csv"
          />
        </div>
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">File Format</label>
          <Select
            id="format"
            value={config.format || 'csv'}
            onChange={(e) => updateConfig('format', e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
            <option value="parquet">Parquet</option>
          </Select>
        </div>
        <div>
          <label htmlFor="compression" className="block text-sm font-medium text-gray-700 mb-1">Compression</label>
          <Select
            id="compression"
            value={config.compression || 'none'}
            onChange={(e) => updateConfig('compression', e.target.value)}
          >
            <option value="none">None</option>
            <option value="gzip">GZIP</option>
            <option value="zip">ZIP</option>
            <option value="bz2">BZ2</option>
          </Select>
        </div>
        <div className="flex items-center">
          <input
            id="overwrite"
            type="checkbox"
            checked={config.overwrite || false}
            onChange={(e) => updateConfig('overwrite', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="overwrite" className="text-sm font-medium text-gray-700">Overwrite if exists</label>
        </div>
      </div>
    );
  }

  // Warehouse Destination
  if (subtype === 'warehouse') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="connector" className="block text-sm font-medium text-gray-700 mb-1">Warehouse Connector</label>
          <Select
            id="connector"
            value={config.connector_id || ''}
            onChange={(e) => updateConfig('connector_id', e.target.value)}
          >
            <option value="">Select a connector...</option>
            {connectors.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="schema" className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
          <Input
            id="schema"
            type="text"
            value={config.schema || ''}
            onChange={(e) => updateConfig('schema', e.target.value)}
            placeholder="public"
          />
        </div>

        <div>
          <label htmlFor="table_name" className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
          <Input
            id="table_name"
            type="text"
            value={config.table_name || ''}
            onChange={(e) => updateConfig('table_name', e.target.value)}
            placeholder="fact_table"
          />
        </div>

        <div>
          <label htmlFor="partition_by" className="block text-sm font-medium text-gray-700 mb-1">Partition By (optional)</label>
          <Input
            id="partition_by"
            type="text"
            value={config.partition_by || ''}
            onChange={(e) => updateConfig('partition_by', e.target.value)}
            placeholder="date_column"
          />
        </div>
      </div>
    );
  }

  // API Destination
  if (subtype === 'api') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
          <Input
            id="endpoint"
            type="url"
            value={config.endpoint || ''}
            onChange={(e) => updateConfig('endpoint', e.target.value)}
            placeholder="https://api.example.com/data"
          />
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
          <Select
            id="method"
            value={config.method || 'POST'}
            onChange={(e) => updateConfig('method', e.target.value)}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </Select>
        </div>

        <div>
          <label htmlFor="batch_size" className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
          <Input
            id="batch_size"
            type="number"
            value={config.batch_size || ''}
            onChange={(e) => updateConfig('batch_size', parseInt(e.target.value) || undefined)}
            placeholder="100"
          />
          <p className="text-xs text-gray-500 mt-1">Records per API call</p>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Unknown destination type: {subtype}</div>;
}
