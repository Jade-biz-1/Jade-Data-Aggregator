'use client';

import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { X, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SourceNodeConfig } from './SourceNodeConfig';
import { TransformationNodeConfig } from './TransformationNodeConfig';
import { DestinationNodeConfig } from './DestinationNodeConfig';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined'
    ? document.cookie.split('; ').find(r => r.startsWith('access_token='))?.split('=')[1]
    : undefined;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  allNodes: Node[];
  allEdges: Edge[];
  onClose: () => void;
  onSave: (nodeId: string, config: any, label: string) => void;
}

export function NodeConfigPanel({ selectedNode, allNodes, allEdges, onClose, onSave }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<any>({});
  const [nodeLabel, setNodeLabel] = useState<string>('');
  const [isValid, setIsValid] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data?.config || {});
      setNodeLabel(selectedNode.data?.label || '');
      setTestResult(null);
    }
  }, [selectedNode?.id]);

  // Fetch upstream columns when a transformation node is opened
  useEffect(() => {
    if (!selectedNode || selectedNode.type !== 'transformation') {
      setAvailableColumns([]);
      setSampleValues({});
      return;
    }

    // Walk edges backwards to find the first upstream source node
    let upstreamConnectorId: string | undefined;
    let upstreamSourceConfig: Record<string, any> = {};

    const visited = new Set<string>();
    const queue: string[] = [selectedNode.id];
    outer: while (queue.length) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of allEdges) {
        if (edge.target === current) {
          const upstream = allNodes.find(n => n.id === edge.source);
          if (!upstream) continue;
          if (upstream.type === 'source') {
            upstreamConnectorId = upstream.data?.config?.connector_id as string | undefined;
            upstreamSourceConfig = (upstream.data?.config as Record<string, any>) || {};
            break outer;
          }
          queue.push(upstream.id);
        }
      }
    }

    if (!upstreamConnectorId) return;

    // Build query params — PostgreSQL needs a table name to introspect columns
    const params = new URLSearchParams();
    if (upstreamSourceConfig.query_type === 'table' && upstreamSourceConfig.table_name) {
      params.set('table', upstreamSourceConfig.table_name);
      if (upstreamSourceConfig.schema) params.set('schema', upstreamSourceConfig.schema);
    }
    const qs = params.toString();

    fetch(`${API_URL}/connectors/${upstreamConnectorId}/columns${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.columns) {
          setAvailableColumns(data.columns);
          setSampleValues(data.sample_values || {});
        }
      })
      .catch(() => {/* best-effort */});
  }, [selectedNode?.id, allEdges, allNodes]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type || 'default';
  const nodeSubtype = (selectedNode.data as any)?.sourceType ||
                      (selectedNode.data as any)?.transformationType ||
                      (selectedNode.data as any)?.destinationType ||
                      'unknown';

  const handleConfigChange = (newConfig: any) => {
    setConfig(newConfig);
    // Basic validation - check if required fields are filled
    setIsValid(Object.keys(newConfig).length > 0);
  };

  const handleSave = () => {
    onSave(selectedNode.id, config, nodeLabel.trim() || selectedNode.data?.label || '');
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await pipelineBuilderService.testNode({
        node_id: selectedNode.id,
        node_type: nodeSubtype,
        config: config,
      });

      setTestResult({
        success: result.status === 'success',
        message: result.status === 'success'
          ? `Test passed! Sample records: ${result.test_results?.sample_output_records || 0}`
          : 'Test failed',
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const DEFAULT_LABELS: Record<string, string> = {
    source: 'Database Source', api: 'API Source', file: 'File Source',
    filter: 'Filter', map: 'Map', aggregate: 'Aggregate', join: 'Join', sort: 'Sort',
    database: 'Database', warehouse: 'Data Warehouse',
  };

  const isDefaultLabel = (lbl: string) =>
    !lbl || Object.values(DEFAULT_LABELS).some(d => d === lbl) ||
    ['Source', 'Transform', 'Destination'].includes(lbl);

  const renderConfigForm = () => {
    if (nodeType === 'source') {
      return (
        <SourceNodeConfig
          config={config}
          onChange={handleConfigChange}
          subtype={nodeSubtype}
          onConnectorSelect={(name) => {
            if (isDefaultLabel(nodeLabel)) setNodeLabel(name);
          }}
        />
      );
    } else if (nodeType === 'transformation') {
      return (
        <TransformationNodeConfig
          config={config}
          onChange={handleConfigChange}
          subtype={nodeSubtype}
          availableColumns={availableColumns}
          sampleValues={sampleValues}
        />
      );
    } else if (nodeType === 'destination') {
      return <DestinationNodeConfig config={config} onChange={handleConfigChange} subtype={nodeSubtype} />;
    }
    return <div className="text-gray-500">Unknown node type</div>;
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Configure {nodeType}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Node Name</label>
          <input
            type="text"
            value={nodeLabel}
            onChange={e => setNodeLabel(e.target.value)}
            placeholder="Give this node a descriptive name…"
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Config Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {renderConfigForm()}

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  testResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResult.success ? 'Test Passed' : 'Test Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!isValid || isTesting}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
