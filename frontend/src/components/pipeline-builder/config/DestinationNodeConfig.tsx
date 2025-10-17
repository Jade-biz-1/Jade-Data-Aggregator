'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          <Label htmlFor="connector">Database Connector</Label>
          <select
            id="connector"
            value={config.connector_id || ''}
            onChange={(e) => updateConfig('connector_id', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a connector...</option>
            {connectors.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="table_name">Target Table</Label>
          <Input
            id="table_name"
            type="text"
            value={config.table_name || ''}
            onChange={(e) => updateConfig('table_name', e.target.value)}
            placeholder="target_table"
          />
        </div>

        <div>
          <Label htmlFor="write_mode">Write Mode</Label>
          <select
            id="write_mode"
            value={config.write_mode || 'insert'}
            onChange={(e) => updateConfig('write_mode', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="insert">Insert (append)</option>
            <option value="upsert">Upsert (insert or update)</option>
            <option value="replace">Replace (truncate and insert)</option>
          </select>
        </div>

        {config.write_mode === 'upsert' && (
          <div>
            <Label htmlFor="unique_key">Unique Key (for upsert)</Label>
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
          <Label htmlFor="file_path">Output File Path</Label>
          <Input
            id="file_path"
            type="text"
            value={config.file_path || ''}
            onChange={(e) => updateConfig('file_path', e.target.value)}
            placeholder="/path/to/output.csv"
          />
        </div>

        <div>
          <Label htmlFor="format">File Format</Label>
          <select
            id="format"
            value={config.format || 'csv'}
            onChange={(e) => updateConfig('format', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
            <option value="parquet">Parquet</option>
          </select>
        </div>

        <div>
          <Label htmlFor="compression">Compression</Label>
          <select
            id="compression"
            value={config.compression || 'none'}
            onChange={(e) => updateConfig('compression', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="none">None</option>
            <option value="gzip">GZIP</option>
            <option value="zip">ZIP</option>
            <option value="bz2">BZ2</option>
          </select>
        </div>

        <div>
          <Label htmlFor="overwrite">
            <input
              id="overwrite"
              type="checkbox"
              checked={config.overwrite || false}
              onChange={(e) => updateConfig('overwrite', e.target.checked)}
              className="mr-2"
            />
            Overwrite if exists
          </Label>
        </div>
      </div>
    );
  }

  // Warehouse Destination
  if (subtype === 'warehouse') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="connector">Warehouse Connector</Label>
          <select
            id="connector"
            value={config.connector_id || ''}
            onChange={(e) => updateConfig('connector_id', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a connector...</option>
            {connectors.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="schema">Schema</Label>
          <Input
            id="schema"
            type="text"
            value={config.schema || ''}
            onChange={(e) => updateConfig('schema', e.target.value)}
            placeholder="public"
          />
        </div>

        <div>
          <Label htmlFor="table_name">Table Name</Label>
          <Input
            id="table_name"
            type="text"
            value={config.table_name || ''}
            onChange={(e) => updateConfig('table_name', e.target.value)}
            placeholder="fact_table"
          />
        </div>

        <div>
          <Label htmlFor="partition_by">Partition By (optional)</Label>
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
          <Label htmlFor="endpoint">API Endpoint</Label>
          <Input
            id="endpoint"
            type="url"
            value={config.endpoint || ''}
            onChange={(e) => updateConfig('endpoint', e.target.value)}
            placeholder="https://api.example.com/data"
          />
        </div>

        <div>
          <Label htmlFor="method">HTTP Method</Label>
          <select
            id="method"
            value={config.method || 'POST'}
            onChange={(e) => updateConfig('method', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div>
          <Label htmlFor="batch_size">Batch Size</Label>
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
