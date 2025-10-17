'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';

interface SourceNodeConfigProps {
  config: any;
  onChange: (config: any) => void;
  subtype: string;
}

export function SourceNodeConfig({ config, onChange, subtype }: SourceNodeConfigProps) {
  const [connectors, setConnectors] = useState<any[]>([]);

  useEffect(() => {
    // Load available connectors for database/API sources
    if (subtype === 'database' || subtype === 'api') {
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

  // Database Source Configuration
  if (subtype === 'database') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="connector">Database Connector</Label>
          <select
            id="connector"
            value={config.connector_id || ''}
            onChange={(e) => updateConfig('connector_id', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          <Label htmlFor="query_type">Query Type</Label>
          <select
            id="query_type"
            value={config.query_type || 'table'}
            onChange={(e) => updateConfig('query_type', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="table">Table</option>
            <option value="query">Custom Query</option>
          </select>
        </div>

        {config.query_type === 'table' ? (
          <div>
            <Label htmlFor="table_name">Table Name</Label>
            <Input
              id="table_name"
              type="text"
              value={config.table_name || ''}
              onChange={(e) => updateConfig('table_name', e.target.value)}
              placeholder="e.g., users, orders"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="query">SQL Query</Label>
            <Textarea
              id="query"
              value={config.query || ''}
              onChange={(e) => updateConfig('query', e.target.value)}
              placeholder="SELECT * FROM table WHERE ..."
              rows={4}
            />
          </div>
        )}

        <div>
          <Label htmlFor="batch_size">Batch Size (optional)</Label>
          <Input
            id="batch_size"
            type="number"
            value={config.batch_size || ''}
            onChange={(e) => updateConfig('batch_size', parseInt(e.target.value) || undefined)}
            placeholder="1000"
          />
          <p className="text-xs text-gray-500 mt-1">Number of records to fetch at once</p>
        </div>
      </div>
    );
  }

  // API Source Configuration
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
            value={config.method || 'GET'}
            onChange={(e) => updateConfig('method', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>

        <div>
          <Label htmlFor="auth_type">Authentication</Label>
          <select
            id="auth_type"
            value={config.auth_type || 'none'}
            onChange={(e) => updateConfig('auth_type', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="api_key">API Key</option>
            <option value="basic">Basic Auth</option>
          </select>
        </div>

        {config.auth_type === 'bearer' && (
          <div>
            <Label htmlFor="bearer_token">Bearer Token</Label>
            <Input
              id="bearer_token"
              type="password"
              value={config.bearer_token || ''}
              onChange={(e) => updateConfig('bearer_token', e.target.value)}
              placeholder="Enter token"
            />
          </div>
        )}

        {config.auth_type === 'api_key' && (
          <>
            <div>
              <Label htmlFor="api_key_header">API Key Header</Label>
              <Input
                id="api_key_header"
                type="text"
                value={config.api_key_header || ''}
                onChange={(e) => updateConfig('api_key_header', e.target.value)}
                placeholder="X-API-Key"
              />
            </div>
            <div>
              <Label htmlFor="api_key_value">API Key Value</Label>
              <Input
                id="api_key_value"
                type="password"
                value={config.api_key_value || ''}
                onChange={(e) => updateConfig('api_key_value', e.target.value)}
                placeholder="Enter API key"
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="headers">Additional Headers (JSON)</Label>
          <Textarea
            id="headers"
            value={config.headers || ''}
            onChange={(e) => updateConfig('headers', e.target.value)}
            placeholder='{"Content-Type": "application/json"}'
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">JSON object of header key-value pairs</p>
        </div>
      </div>
    );
  }

  // File Source Configuration
  if (subtype === 'file') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="file_path">File Path</Label>
          <Input
            id="file_path"
            type="text"
            value={config.file_path || ''}
            onChange={(e) => updateConfig('file_path', e.target.value)}
            placeholder="/path/to/file.csv"
          />
        </div>

        <div>
          <Label htmlFor="format">File Format</Label>
          <select
            id="format"
            value={config.format || 'csv'}
            onChange={(e) => updateConfig('format', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
            <option value="parquet">Parquet</option>
          </select>
        </div>

        {config.format === 'csv' && (
          <>
            <div>
              <Label htmlFor="delimiter">Delimiter</Label>
              <Input
                id="delimiter"
                type="text"
                value={config.delimiter || ','}
                onChange={(e) => updateConfig('delimiter', e.target.value)}
                placeholder=","
                maxLength={1}
              />
            </div>

            <div>
              <Label htmlFor="has_header">
                <input
                  id="has_header"
                  type="checkbox"
                  checked={config.has_header !== false}
                  onChange={(e) => updateConfig('has_header', e.target.checked)}
                  className="mr-2"
                />
                First row is header
              </Label>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="encoding">Encoding</Label>
          <select
            id="encoding"
            value={config.encoding || 'utf-8'}
            onChange={(e) => updateConfig('encoding', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="utf-8">UTF-8</option>
            <option value="latin1">Latin-1</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Unknown source type: {subtype}</div>;
}
