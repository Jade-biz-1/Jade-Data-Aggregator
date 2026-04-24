'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout-enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedTable, Column } from '@/components/table';
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Edit,
  CheckCircle,
  XCircle,
  Shield,
  History,
  Wifi,
  WifiOff,
  Settings,
  Activity,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/lib/api';
import { Pipeline } from '@/types';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useRealTimePipelineStatus } from '@/hooks/useRealTimePipelineStatus';

interface PipelineDisplay extends Pipeline {
  status?: string;
  lastRun?: Date;
  nextRun?: Date | null;
  recordsProcessed?: number;
  source?: string;
  destination?: string;
  pipeline_type?: string;
}

interface EditForm {
  name: string;
  description: string;
  schedule: string;
  is_active: boolean;
}

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<PipelineDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPipeline, setEditingPipeline] = useState<PipelineDisplay | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', description: '', schedule: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [showNewPipelineModal, setShowNewPipelineModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();
  const { pipelineStatuses, isConnected: wsConnected } = useRealTimePipelineStatus();

  // Merge real-time WS pipeline statuses into local state
  useEffect(() => {
    if (Object.keys(pipelineStatuses).length === 0) return;
    setPipelines(prev => prev.map(p => {
      const wsStatus = pipelineStatuses[p.id];
      if (wsStatus && wsStatus.status !== p.status) {
        return { ...p, status: wsStatus.status };
      }
      return p;
    }));
  }, [pipelineStatuses]);

  // Fetch pipelines from API
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getPipelines();
        setPipelines(data.map(p => ({
          ...p,
          status: p.is_active ? 'active' : 'paused',
          source: String(p.source_config?.type || 'Unknown'),
          destination: String(p.destination_config?.type || 'Unknown'),
        })));
      } catch (err: any) {
        error(err.message || 'Failed to load pipelines', 'Error');
        console.error('Error fetching pipelines:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  const handleDeletePipelines = async (selected: PipelineDisplay[]) => {
    try {
      // Delete each pipeline
      await Promise.all(selected.map(p => apiClient.deletePipeline(p.id)));

      // Remove from state
      const idsToDelete = new Set(selected.map(p => p.id));
      setPipelines(prev => prev.filter(p => !idsToDelete.has(p.id)));

      success(`Successfully deleted ${selected.length} pipeline(s)`, 'Success');
    } catch (err: any) {
      error(err.message || 'Failed to delete pipelines', 'Error');
      console.error('Error deleting pipelines:', err);
    }
  };

  const handleRowClick = (pipeline: PipelineDisplay) => {
    // Navigate to pipeline builder in edit mode
    if (pipeline.pipeline_type === 'visual') {
      router.push(`/pipeline-builder?id=${pipeline.id}`);
    } else {
      // For traditional pipelines, could show details modal or navigate to a different editor
      console.log('Traditional pipeline clicked:', pipeline);
    }
  };

  const handleExecutePipeline = async (pipelineId: number) => {
    try {
      await apiClient.executePipeline(pipelineId);
      success('Pipeline execution started — redirecting to execution history…', 'Success');
      // Short delay so the toast is visible, then navigate to the run status page
      setTimeout(() => router.push(`/pipelines/${pipelineId}/executions`), 800);
    } catch (err: any) {
      error(err.message || 'Failed to execute pipeline', 'Error');
      console.error('Error executing pipeline:', err);
    }
  };

  const openEdit = (pipeline: PipelineDisplay, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPipeline(pipeline);
    setEditForm({
      name: pipeline.name,
      description: pipeline.description || '',
      schedule: pipeline.schedule || '',
      is_active: pipeline.is_active,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPipeline) return;
    setSaving(true);
    try {
      const updated = await apiClient.updatePipeline(editingPipeline.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        schedule: editForm.schedule || undefined,
        is_active: editForm.is_active,
      });
      setPipelines(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      setEditingPipeline(null);
      success('Pipeline updated', 'Saved');
    } catch (err: any) {
      error(err.message || 'Failed to update pipeline', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: ReactNode }> = {
      running: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Running',
        icon: <Play className="h-3 w-3 mr-1" />
      },
      active: {
        color: 'bg-green-100 text-green-800',
        text: 'Active',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        text: 'Failed',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      paused: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Paused',
        icon: <Pause className="h-3 w-3 mr-1" />
      }
    };

    const badge = badges[status] || badges.paused;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const columns: Column<PipelineDisplay>[] = [
    {
      key: 'name',
      header: 'Pipeline Name',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => <span className="text-gray-600">{value || 'N/A'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value || 'paused'),
      width: '120px'
    },
    {
      key: 'source',
      header: 'Source',
      render: (value) => <span className="text-gray-700">{value || 'N/A'}</span>
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (value) => <span className="text-gray-700">{value || 'N/A'}</span>
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => formatDateTime(new Date(value)),
      width: '180px'
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (value) => <span className="text-gray-600">{value || 'Manual'}</span>
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleExecutePipeline(value as number); }}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Execute pipeline"
          >
            <Play className="h-4 w-4" />
          </button>
          {features?.pipelines?.edit && (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/pipeline-builder?id=${value}`); }}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="Open in pipeline builder"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {features?.pipelines?.edit && (
            <button
              onClick={(e) => openEdit(row as PipelineDisplay, e)}
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Edit pipeline settings (name, schedule, active)"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/pipelines/${value}/executions`); }}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="Execution history"
          >
            <Activity className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/pipelines/${value}/versions`); }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Version history"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '180px'
    }
  ];

  // Check permission to view this page
  if (permissionsLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.pipelines?.view) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <Shield className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 text-center max-w-md">
            You don't have permission to view pipelines.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipelines</h1>
            <p className="mt-2 text-gray-600">
              Manage your data processing pipelines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 text-sm ${wsConnected ? 'text-green-600' : 'text-gray-400'}`}>
              {wsConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {wsConnected ? 'Live' : 'Offline'}
            </span>
            {features?.pipelines?.create && (
              <Button onClick={() => { setNewPipelineName(''); setShowNewPipelineModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Pipeline
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
              <GitBranch className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pipelines.length}</div>
              <p className="text-xs text-gray-500">All pipelines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {pipelines.filter(p => p.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Active pipelines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Pause className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {pipelines.filter(p => !p.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Paused pipelines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <XCircle className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {pipelines.filter(p => p.schedule).length}
              </div>
              <p className="text-xs text-gray-500">With schedules</p>
            </CardContent>
          </Card>
        </div>

        {/* Pipelines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline List</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={pipelines}
              columns={columns}
              isLoading={isLoading}
              pageSize={10}
              enableBulkActions={features?.pipelines?.delete ?? false}
              enableColumnVisibility={true}
              enableExport={features?.pipelines?.view ?? false}
              onDelete={features?.pipelines?.delete ? handleDeletePipelines : undefined}
              onRowClick={handleRowClick}
              tableName="pipelines"
            />
          </CardContent>
        </Card>
      </div>
      {/* Edit Pipeline Modal */}
      {editingPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">Pipeline Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (cron expression)</label>
                <input
                  type="text"
                  value={editForm.schedule}
                  onChange={e => setEditForm(f => ({ ...f, schedule: e.target.value }))}
                  placeholder="e.g. 0 * * * * (hourly) — leave blank for manual"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="edit-active"
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="edit-active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingPipeline(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Pipeline naming modal */}
      {showNewPipelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">New Pipeline</h3>
            <p className="text-sm text-gray-500 mb-4">Give your pipeline a name before building it.</p>
            <input
              type="text"
              value={newPipelineName}
              onChange={e => setNewPipelineName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newPipelineName.trim()) {
                  setShowNewPipelineModal(false);
                  router.push(`/pipeline-builder?name=${encodeURIComponent(newPipelineName.trim())}`);
                }
                if (e.key === 'Escape') setShowNewPipelineModal(false);
              }}
              placeholder="e.g. Daily Orders Sync"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewPipelineModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!newPipelineName.trim()}
                onClick={() => {
                  setShowNewPipelineModal(false);
                  router.push(`/pipeline-builder?name=${encodeURIComponent(newPipelineName.trim())}`);
                }}
                className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}