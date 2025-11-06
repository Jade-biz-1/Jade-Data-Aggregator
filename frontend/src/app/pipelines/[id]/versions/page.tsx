'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { History, RefreshCw, GitBranch, Tag, Clock, User, RotateCcw, Eye, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import { apiClient } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface PipelineVersion {
  id: string;
  version_number: number;
  pipeline_id: string;
  created_at: string;
  created_by: string;
  created_by_username?: string;
  change_summary: string;
  is_current: boolean;
  tags?: string[];
  config: any;
  metadata?: any;
}

interface VersionDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
}

const PipelineVersionsPage = () => {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;

  const [versions, setVersions] = useState<PipelineVersion[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<PipelineVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<PipelineVersion | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [pipelineId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const [pipelineResponse, versionsResponse] = await Promise.all([
        apiClient.get(`/pipelines/${pipelineId}`),
        apiClient.get(`/pipelines/${pipelineId}/versions`)
      ]);

      setPipeline(pipelineResponse.data);
      setVersions(versionsResponse.data.versions || []);
      success('Pipeline versions loaded');
    } catch (error: any) {
      console.error('Error fetching versions:', error);
      showError('Failed to load pipeline versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (v1: PipelineVersion, v2: PipelineVersion) => {
    try {
      const response = await apiClient.get(`/pipelines/${pipelineId}/versions/compare`, {
        params: {
          version1: v1.version_number,
          version2: v2.version_number
        }
      });

      setDiff(response.data.diff);
      setSelectedVersion(v1);
      setCompareVersion(v2);
      setShowDiff(true);
      success('Version comparison generated');
    } catch (error: any) {
      console.error('Error comparing versions:', error);
      showError('Failed to compare versions');
    }
  };

  const handleRollback = async (version: PipelineVersion) => {
    if (!confirm(`Are you sure you want to rollback to version ${version.version_number}? This will create a new version with the previous configuration.`)) {
      return;
    }

    try {
      await apiClient.post(`/pipelines/${pipelineId}/versions/${version.id}/rollback`);
      success(`Rolled back to version ${version.version_number}`);
      fetchVersions();
    } catch (error: any) {
      console.error('Error rolling back:', error);
      showError('Failed to rollback to version');
    }
  };

  const handleTagVersion = async (version: PipelineVersion) => {
    const tag = prompt('Enter a tag for this version (e.g., "stable", "production"):');
    if (!tag) return;

    try {
      await apiClient.post(`/pipelines/${pipelineId}/versions/${version.id}/tag`, {
        tag: tag.trim()
      });
      success(`Tagged version ${version.version_number} as "${tag}"`);
      fetchVersions();
    } catch (error: any) {
      console.error('Error tagging version:', error);
      showError('Failed to tag version');
    }
  };

  const handleViewConfig = (version: PipelineVersion) => {
    setSelectedVersion(version);
    setShowDiff(false);
  };

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const renderDiff = () => {
    if (!diff || !selectedVersion || !compareVersion) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Comparing v{selectedVersion.version_number} vs v{compareVersion.version_number}
          </h3>
          <button
            onClick={() => setShowDiff(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Added Items */}
        {diff.added.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Added ({diff.added.length})
            </h4>
            <ul className="space-y-1">
              {diff.added.map((item, idx) => (
                <li key={idx} className="text-sm text-green-800 font-mono">+ {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Removed Items */}
        {diff.removed.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
              <X className="w-4 h-4" />
              Removed ({diff.removed.length})
            </h4>
            <ul className="space-y-1">
              {diff.removed.map((item, idx) => (
                <li key={idx} className="text-sm text-red-800 font-mono">- {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modified Items */}
        {diff.modified.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              Modified ({diff.modified.length})
            </h4>
            <div className="space-y-3">
              {diff.modified.map((item, idx) => (
                <div key={idx} className="bg-white rounded p-3">
                  <div className="text-sm font-medium text-gray-900 mb-2">{item.field}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Old Value</div>
                      <pre className="text-xs text-red-700 bg-red-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(item.old_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">New Value</div>
                      <pre className="text-xs text-green-700 bg-green-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(item.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No differences found between these versions
          </div>
        )}
      </div>
    );
  };

  const renderConfigView = () => {
    if (!selectedVersion) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Version {selectedVersion.version_number} Configuration
          </h3>
          <button
            onClick={() => setSelectedVersion(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-sm text-gray-900 overflow-x-auto">
            {JSON.stringify(selectedVersion.config, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // Permission check
  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.pipelines?.view) {
    return (
      <DashboardLayout>
        <AccessDenied />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={[]} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => router.push('/pipelines')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Pipelines
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {pipeline?.name || 'Pipeline'} - Version History
            </h1>
            <p className="text-gray-600 mt-1">
              View, compare, and rollback pipeline versions
            </p>
          </div>

          <button
            onClick={fetchVersions}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Version List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Version History ({versions.length})
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12">
                  <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No versions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Version history will appear here as changes are made
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {versions.map((version) => {
                    const isExpanded = expandedVersions.has(version.id);

                    return (
                      <div key={version.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-semibold text-gray-900">
                                Version {version.version_number}
                              </span>
                              {version.is_current && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  Current
                                </span>
                              )}
                              {version.tags?.map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <p className="text-sm text-gray-700 mb-2">{version.change_summary}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(version.created_at).toLocaleString()}
                              </span>
                              {version.created_by_username && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {version.created_by_username}
                                </span>
                              )}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Version ID:</span>
                                    <p className="text-gray-600 font-mono text-xs mt-1">{version.id}</p>
                                  </div>
                                  {version.metadata && (
                                    <div>
                                      <span className="font-medium text-gray-700">Metadata:</span>
                                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                                        {JSON.stringify(version.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => toggleExpanded(version.id)}
                            className="ml-4 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleViewConfig(version)}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Config
                          </button>

                          {versions.length > 1 && (
                            <button
                              onClick={() => {
                                const otherVersion = versions.find(v => v.id !== version.id);
                                if (otherVersion) handleCompare(version, otherVersion);
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                            >
                              <GitBranch className="w-3 h-3" />
                              Compare
                            </button>
                          )}

                          {!version.is_current && features?.pipelines?.edit && (
                            <button
                              onClick={() => handleRollback(version)}
                              className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rollback
                            </button>
                          )}

                          {features?.pipelines?.edit && (
                            <button
                              onClick={() => handleTagVersion(version)}
                              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" />
                              Tag
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {showDiff ? 'Comparison' : selectedVersion ? 'Configuration' : 'Details'}
                </h2>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto">
                {showDiff ? (
                  renderDiff()
                ) : selectedVersion ? (
                  renderConfigView()
                ) : (
                  <div className="text-center py-12">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Select a version to view details or compare versions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PipelineVersionsPage;
