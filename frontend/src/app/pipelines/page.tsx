'use client';

import { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/lib/api';
import { Pipeline } from '@/types';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface PipelineDisplay extends Pipeline {
  status?: string;
  lastRun?: Date;
  nextRun?: Date | null;
  recordsProcessed?: number;
  source?: string;
  destination?: string;
}

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<PipelineDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  // Fetch pipelines from API
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getPipelines();
        setPipelines(data.map(p => ({
          ...p,
          status: p.is_active ? 'active' : 'paused',
          source: p.source_config?.type || 'Unknown',
          destination: p.destination_config?.type || 'Unknown',
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
      success('Pipeline execution started', 'Success');
    } catch (err: any) {
      error(err.message || 'Failed to execute pipeline', 'Error');
      console.error('Error executing pipeline:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: JSX.Element }> = {
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
          {features?.pipelines?.create && (
            <Button onClick={() => router.push('/pipeline-builder')}>
              <Plus className="h-4 w-4 mr-2" />
              New Pipeline
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
              <GitBranch className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelines.length}</div>
              <p className="text-xs text-gray-500">All pipelines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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
              <div className="text-2xl font-bold">
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
              <div className="text-2xl font-bold">
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
    </DashboardLayout>
  );
}