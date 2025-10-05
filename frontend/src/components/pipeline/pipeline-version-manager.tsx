'use client';

import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, Check, RotateCcw, X, Eye, GitCompare } from 'lucide-react';

interface PipelineVersion {
  id: number;
  version_number: number;
  version_name: string;
  change_description: string;
  is_active: boolean;
  created_at: string;
  created_by?: number;
}

interface PipelineVersionManagerProps {
  pipelineId: number;
  onRestore?: (versionId: number) => void;
  onActivate?: (versionId: number) => void;
  onClose?: () => void;
}

export const PipelineVersionManager: React.FC<PipelineVersionManagerProps> = ({
  pipelineId,
  onRestore,
  onActivate,
  onClose
}) => {
  const [versions, setVersions] = useState<PipelineVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<PipelineVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<number[]>([]);

  useEffect(() => {
    fetchVersions();
  }, [pipelineId]);

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-versions/pipelines/${pipelineId}/versions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    const description = prompt('Enter version description:');
    if (!description) return;

    const versionName = prompt('Enter version name (optional):') || undefined;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-versions/pipelines/${pipelineId}/versions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            change_description: description,
            version_name: versionName,
            set_as_active: false
          })
        }
      );

      if (response.ok) {
        alert('Version created successfully');
        fetchVersions();
      } else {
        alert('Failed to create version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error creating version');
    }
  };

  const handleActivateVersion = async (versionId: number) => {
    if (!confirm('Set this version as active?')) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-versions/versions/${versionId}/activate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        alert('Version activated successfully');
        fetchVersions();
        if (onActivate) onActivate(versionId);
      } else {
        alert('Failed to activate version');
      }
    } catch (error) {
      console.error('Error activating version:', error);
      alert('Error activating version');
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    if (!confirm('Restore pipeline to this version? This will create a new version.')) return;

    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-versions/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        alert('Pipeline restored successfully');
        fetchVersions();
        if (onRestore) onRestore(versionId);
      } else {
        alert('Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Error restoring version');
    }
  };

  const handleCompareToggle = (versionId: number) => {
    if (compareVersions.includes(versionId)) {
      setCompareVersions(compareVersions.filter(id => id !== versionId));
    } else if (compareVersions.length < 2) {
      setCompareVersions([...compareVersions, versionId]);
    }
  };

  const handleCompare = () => {
    if (compareVersions.length === 2) {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/pipeline-versions/versions/${compareVersions[0]}/compare/${compareVersions[1]}`,
        '_blank'
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
          </div>
          <div className="flex items-center gap-2">
            {compareMode && (
              <button
                onClick={handleCompare}
                disabled={compareVersions.length !== 2}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </button>
            )}
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareVersions([]);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {compareMode ? 'Cancel Compare' : 'Compare Versions'}
            </button>
            <button
              onClick={handleCreateVersion}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Version
            </button>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Versions List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading versions...</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No versions yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first version to track changes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-4 border rounded-lg ${
                  version.is_active
                    ? 'border-green-500 bg-green-50'
                    : compareVersions.includes(version.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {version.version_name} (v{version.version_number})
                      </h4>
                      {version.is_active && (
                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {version.change_description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3" />
                      {formatDate(version.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {compareMode ? (
                      <button
                        onClick={() => handleCompareToggle(version.id)}
                        className={`p-2 rounded ${
                          compareVersions.includes(version.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        disabled={!compareVersions.includes(version.id) && compareVersions.length >= 2}
                      >
                        <GitCompare className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedVersion(version)}
                          className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!version.is_active && (
                          <>
                            <button
                              onClick={() => handleActivateVersion(version.id)}
                              className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Set as active"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRestoreVersion(version.id)}
                              className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                              title="Restore this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version Details Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Version {selectedVersion.version_number} Details
              </h3>
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version Name</dt>
                  <dd className="text-sm text-gray-900 mt-1">{selectedVersion.version_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Version Number</dt>
                  <dd className="text-sm text-gray-900 mt-1">v{selectedVersion.version_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900 mt-1">{selectedVersion.change_description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="text-sm text-gray-900 mt-1">{formatDate(selectedVersion.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {selectedVersion.is_active ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-gray-600">Inactive</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
