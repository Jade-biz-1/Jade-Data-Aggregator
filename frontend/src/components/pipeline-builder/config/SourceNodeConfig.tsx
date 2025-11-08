'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
// Removed Label import; use inline <label> instead
import { Select, Textarea } from '../../ui';
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
          <label htmlFor="query_type" className="block text-sm font-medium text-gray-700 mb-1">Query Type</label>
          <Select
            id="query_type"
            value={config.query_type || 'table'}
            onChange={(e) => updateConfig('query_type', e.target.value)}
          >
            <option value="table">Table</option>
            <option value="query">Custom Query</option>
          </Select>
        </div>

        {config.query_type === 'table' ? (
          <div>
            <label htmlFor="table_name" className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
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
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
            <Textarea
              id="query"
              value={config.query || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('query', e.target.value)}
              placeholder="SELECT * FROM table WHERE ..."
              rows={4}
            />
          </div>
        )}

        <div>
          <label htmlFor="batch_size" className="block text-sm font-medium text-gray-700 mb-1">Batch Size (optional)</label>
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
            value={config.method || 'GET'}
            onChange={(e) => updateConfig('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </Select>
        </div>

        <div>
          <label htmlFor="auth_type" className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
          <Select
            id="auth_type"
            value={config.auth_type || 'none'}
            onChange={(e) => updateConfig('auth_type', e.target.value)}
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="api_key">API Key</option>
            <option value="basic">Basic Auth</option>
          </Select>
        </div>

        {config.auth_type === 'bearer' && (
          <div>
            <label htmlFor="bearer_token" className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
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
              <label htmlFor="api_key_header" className="block text-sm font-medium text-gray-700 mb-1">API Key Header</label>
              <Input
                id="api_key_header"
                type="text"
                value={config.api_key_header || ''}
                onChange={(e) => updateConfig('api_key_header', e.target.value)}
                placeholder="X-API-Key"
              />
            </div>
            <div>
              <label htmlFor="api_key_value" className="block text-sm font-medium text-gray-700 mb-1">API Key Value</label>
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
          <label htmlFor="headers" className="block text-sm font-medium text-gray-700 mb-1">Additional Headers (JSON)</label>
          <Textarea
            id="headers"
            value={config.headers || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('headers', e.target.value)}
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
          <label htmlFor="file_path" className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
          <Input
            id="file_path"
            type="text"
            value={config.file_path || ''}
            onChange={(e) => updateConfig('file_path', e.target.value)}
            placeholder="/path/to/file.csv"
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

        {config.format === 'csv' && (
          <>
            <div>
              <label htmlFor="delimiter" className="block text-sm font-medium text-gray-700 mb-1">Delimiter</label>
              <Input
                id="delimiter"
                type="text"
                value={config.delimiter || ','}
                onChange={(e) => updateConfig('delimiter', e.target.value)}
                placeholder=","
                maxLength={1}
              />
            </div>

            <div className="flex items-center">
              <input
                id="has_header"
                type="checkbox"
                checked={config.has_header !== false}
                onChange={(e) => updateConfig('has_header', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="has_header" className="text-sm font-medium text-gray-700">First row is header</label>
            </div>
          </>
        )}

        <div>
          <label htmlFor="encoding" className="block text-sm font-medium text-gray-700 mb-1">Encoding</label>
          <Select
            id="encoding"
            value={config.encoding || 'utf-8'}
            onChange={(e) => updateConfig('encoding', e.target.value)}
          >
            <option value="utf-8">UTF-8</option>
            <option value="latin1">Latin-1</option>
            <option value="ascii">ASCII</option>
          </Select>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Unknown source type: {subtype}</div>;
}
