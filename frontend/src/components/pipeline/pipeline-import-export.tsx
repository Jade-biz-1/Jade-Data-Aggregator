'use client';

import React, { useState } from 'react';
import { Download, Upload, FileJson, Check, AlertCircle } from 'lucide-react';

interface PipelineImportExportProps {
  pipelineId?: number;
  pipelineName?: string;
  pipelineData?: any;
  onImport?: (data: any) => void;
}

export const PipelineImportExport: React.FC<PipelineImportExportProps> = ({
  pipelineId,
  pipelineName = 'pipeline',
  pipelineData,
  onImport
}) => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const handleExport = () => {
    if (!pipelineData) {
      alert('No pipeline data to export');
      return;
    }

    const dataStr = JSON.stringify(pipelineData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${pipelineName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('idle');
    setImportMessage('');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic structure
      if (!data.nodes || !data.edges) {
        throw new Error('Invalid pipeline format: missing nodes or edges');
      }

      setImportStatus('success');
      setImportMessage('Pipeline imported successfully');

      if (onImport) {
        onImport(data);
      }
    } catch (error: any) {
      setImportStatus('error');
      setImportMessage(error.message || 'Failed to import pipeline');
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Section */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Export Pipeline</h4>
              <p className="text-sm text-gray-600">Download pipeline as JSON</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={!pipelineData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Import Pipeline</h4>
              <p className="text-sm text-gray-600">Upload pipeline JSON file</p>
            </div>
          </div>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        {/* Import Status */}
        {importStatus !== 'idle' && (
          <div
            className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
              importStatus === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {importStatus === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {importStatus === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-sm mt-1">{importMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Format Info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <FileJson className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 text-sm">File Format</h4>
            <p className="text-xs text-gray-600 mt-1">
              Pipeline files must be in JSON format with nodes and edges structure.
              Exported files can be imported into any Data Aggregator instance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
