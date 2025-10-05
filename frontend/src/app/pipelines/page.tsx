'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
  XCircle
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

// Mock data - in real app this would come from API
const mockPipelines = [
  {
    id: 1,
    name: 'Sales Data ETL',
    description: 'Daily extraction of sales data from CRM',
    status: 'active',
    lastRun: new Date('2025-09-29T10:30:00Z'),
    nextRun: new Date('2025-09-29T18:00:00Z'),
    recordsProcessed: 15420,
    source: 'CRM System',
    destination: 'Data Warehouse',
    schedule: 'Daily at 6:00 AM UTC',
  },
  {
    id: 2,
    name: 'Customer Analytics',
    description: 'Real-time customer behavior analysis',
    status: 'running',
    lastRun: new Date('2025-09-29T08:15:00Z'),
    nextRun: new Date('2025-09-29T09:15:00Z'),
    recordsProcessed: 8650,
    source: 'Web Analytics',
    destination: 'Analytics DB',
    schedule: 'Every hour',
  },
  {
    id: 3,
    name: 'Inventory Sync',
    description: 'Sync inventory levels across all platforms',
    status: 'failed',
    lastRun: new Date('2025-09-29T06:00:00Z'),
    nextRun: new Date('2025-09-29T07:00:00Z'),
    recordsProcessed: 0,
    source: 'ERP System',
    destination: 'Inventory DB',
    schedule: 'Hourly',
  },
  {
    id: 4,
    name: 'Marketing Reports',
    description: 'Generate daily marketing performance reports',
    status: 'paused',
    lastRun: new Date('2025-09-28T18:00:00Z'),
    nextRun: null,
    recordsProcessed: 23000,
    source: 'Marketing APIs',
    destination: 'Reporting DB',
    schedule: 'Daily at 6:00 PM UTC',
  },
];

interface Pipeline {
  id: number;
  name: string;
  description: string;
  status: string;
  lastRun: Date;
  nextRun: Date | null;
  recordsProcessed: number;
  source: string;
  destination: string;
  schedule: string;
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState(mockPipelines);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDeletePipelines = (selected: Pipeline[]) => {
    const idsToDelete = new Set(selected.map(p => p.id));
    setPipelines(prev => prev.filter(p => !idsToDelete.has(p.id)));
  };

  const handleRowClick = (pipeline: Pipeline) => {
    console.log('Pipeline clicked:', pipeline);
    // Navigate to pipeline details
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

  const columns: Column<Pipeline>[] = [
    {
      key: 'name',
      header: 'Pipeline Name',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value),
      width: '120px'
    },
    {
      key: 'source',
      header: 'Source'
    },
    {
      key: 'destination',
      header: 'Destination'
    },
    {
      key: 'recordsProcessed',
      header: 'Records',
      render: (value) => value.toLocaleString(),
      width: '100px'
    },
    {
      key: 'lastRun',
      header: 'Last Run',
      render: (value) => formatDateTime(value),
      width: '180px'
    },
    {
      key: 'schedule',
      header: 'Schedule'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipelines</h1>
            <p className="mt-2 text-gray-600">
              Manage your data processing pipelines
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Pipeline
          </Button>
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
                {pipelines.filter(p => p.status === 'active' || p.status === 'running').length}
              </div>
              <p className="text-xs text-gray-500">Active pipelines</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Play className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pipelines.filter(p => p.status === 'running').length}
              </div>
              <p className="text-xs text-gray-500">Currently running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pipelines.filter(p => p.status === 'failed').length}
              </div>
              <p className="text-xs text-gray-500">Need attention</p>
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
              enableBulkActions={true}
              enableColumnVisibility={true}
              enableExport={true}
              onDelete={handleDeletePipelines}
              onRowClick={handleRowClick}
              tableName="pipelines"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}