'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Play,
  Trash2,
  Edit,
  Code,
  Settings,
  Database,
  Filter,
  Columns,
  Shuffle,
  Shield,
  BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Transformation, TransformationMetric, TransformationMetricsSummary } from '@/types/transformation';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import Modal from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

type EditFormState = {
  name: string;
  description: string;
  transformation_type: string;
  source_fields: string;
  target_fields: string;
  transformation_rules: string;
  is_active: boolean;
};

const createEmptyEditForm = (): EditFormState => ({
  name: '',
  description: '',
  transformation_type: '',
  source_fields: '',
  target_fields: '',
  transformation_rules: '{}',
  is_active: true,
});

export default function TransformationsPage() {
  const router = useRouter();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [filteredTransformations, setFilteredTransformations] = useState<Transformation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [metricsSummary, setMetricsSummary] = useState<TransformationMetricsSummary | null>(null);
  const [transformationMetrics, setTransformationMetrics] = useState<Record<number, TransformationMetric>>({});
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransformation, setEditingTransformation] = useState<Transformation | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(() => createEmptyEditForm());
  const [isFetchingEdit, setIsFetchingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  const fetchTransformations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getTransformations();
      setTransformations(data);
      setFilteredTransformations(data);
    } catch (err: any) {
      console.error('Error fetching transformations:', err);
      error(err.message || 'Failed to load transformations', 'Error');
      setTransformations([]);
      setFilteredTransformations([]);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  const refreshMetrics = useCallback(async () => {
    try {
      setIsMetricsLoading(true);
      const metricsResponse = await apiClient.getTransformationMetrics();
      setMetricsSummary(metricsResponse.summary);
      const metricsMap = metricsResponse.metrics.reduce((acc, metric) => {
        acc[metric.transformationId] = metric;
        return acc;
      }, {} as Record<number, TransformationMetric>);
      setTransformationMetrics(metricsMap);
    } catch (err: any) {
      console.error('Error fetching transformation metrics:', err);
      warning(err.message || 'Failed to load transformation metrics', 'Warning');
      setMetricsSummary(null);
      setTransformationMetrics({});
    } finally {
      setIsMetricsLoading(false);
    }
  }, [warning]);

  useEffect(() => {
    fetchTransformations();
  }, [fetchTransformations]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = transformations.filter(transformation => 
        transformation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformation.transformation_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransformations(filtered);
    } else {
      setFilteredTransformations(transformations);
    }
  }, [searchTerm, transformations]);

  const handleRunTransformation = async (id: number) => {
    try {
      await apiClient.testTransformation(id, {});
      success('Transformation test started', 'Success');
    } catch (err: any) {
      error(err.message || 'Failed to run transformation', 'Error');
    }
  };

  const handleEditTransformation = async (id: number) => {
    try {
      setIsEditModalOpen(true);
      setIsFetchingEdit(true);
      setEditFormError(null);
      const details = await apiClient.getTransformation(id);
      setEditingTransformation(details);
      setEditForm({
        name: details.name,
        description: details.description || '',
        transformation_type: details.transformation_type,
        source_fields: details.source_fields.join(', '),
        target_fields: details.target_fields.join(', '),
        transformation_rules: JSON.stringify(details.transformation_rules ?? {}, null, 2),
        is_active: details.is_active,
      });
    } catch (err: any) {
      console.error('Error loading transformation for editing:', err);
      error(err.message || 'Failed to load transformation details', 'Error');
      setIsEditModalOpen(false);
    } finally {
      setIsFetchingEdit(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransformation(null);
    setEditForm(createEmptyEditForm());
    setEditFormError(null);
  };

  const updateEditForm = (field: keyof EditFormState, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value } as EditFormState));
  };

  const handleSaveTransformation = async () => {
    if (!editingTransformation) {
      return;
    }

    setIsSavingEdit(true);
    setEditFormError(null);

    const sourceFields = editForm.source_fields
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const targetFields = editForm.target_fields
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    let parsedRules: Record<string, any> = {};
    if (editForm.transformation_rules.trim()) {
      try {
        parsedRules = JSON.parse(editForm.transformation_rules);
      } catch (parseError) {
        setEditFormError('Transformation rules must be valid JSON.');
        setIsSavingEdit(false);
        return;
      }
    }

    try {
      const updated = await apiClient.updateTransformation(editingTransformation.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        transformation_type: editForm.transformation_type.trim(),
        source_fields: sourceFields,
        target_fields: targetFields,
        transformation_rules: parsedRules,
        is_active: editForm.is_active,
      });

      setTransformations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setFilteredTransformations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      success('Transformation updated successfully', 'Success');
      handleCloseEditModal();
      await refreshMetrics();
    } catch (err: any) {
      console.error('Error updating transformation:', err);
      const message = err.message || 'Failed to update transformation';
      setEditFormError(message);
      error(message, 'Error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTransformation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transformation?')) {
      return;
    }

    try {
      await apiClient.deleteTransformation(id);
      setTransformations((prev) => prev.filter((t) => t.id !== id));
      setFilteredTransformations((prev) => prev.filter((t) => t.id !== id));
      success('Transformation deleted successfully', 'Success');
      await refreshMetrics();
    } catch (err: any) {
      console.error('Error deleting transformation:', err);
      error(err.message || 'Failed to delete transformation', 'Error');
    }
  };

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case 'Data Normalization':
        return <Columns className="h-4 w-4" />;
      case 'Currency Conversion':
        return <Shuffle className="h-4 w-4" />;
      case 'Deduplication':
        return <Filter className="h-4 w-4" />;
      case 'Data Validation':
        return <Settings className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  // Mock status field since the backend model doesn't have it
  const getTransformationStatus = (transformation: Transformation) => {
    return transformation.is_active ? 'active' : 'inactive';
  };

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

  if (!features?.transformations?.view) {
    return (
      <DashboardLayout>
        <AccessDenied
          message="You don't have permission to view transformations"
          requiredRole="designer"
        />
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
            <h1 className="text-3xl font-bold text-gray-900">Data Transformations</h1>
            <p className="mt-2 text-gray-600">
              Configure and manage data transformation rules
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/transformations/functions')}
              variant="outline"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Function Library
            </Button>
            {features?.transformations?.create && (
              <Button onClick={() => router.push('/transformations/functions')}>
                <Plus className="h-4 w-4 mr-2" />
                New Transformation
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search transformations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transformations</CardTitle>
              <Code className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transformations.length}</div>
              <p className="text-xs text-gray-500">All transformations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transformations.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Active transformations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isMetricsLoading
                  ? '--'
                  : metricsSummary
                    ? metricsSummary.recordsProcessed.toLocaleString()
                    : '--'}
              </div>
              <p className="text-xs text-gray-500">
                {isMetricsLoading || !metricsSummary || !metricsSummary.lastUpdated
                  ? 'Metrics updating...'
                  : `Last updated ${formatDistanceToNow(new Date(metricsSummary.lastUpdated), { addSuffix: true })}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transformations List */}
        <Card>
          <CardHeader>
            <CardTitle>Transformation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredTransformations.length === 0 ? (
              <div className="text-center py-12">
                <Code className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transformations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new transformation rule.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/transformations/functions')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Transformation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransformations.map((transformation) => {
                  const metrics = transformationMetrics[transformation.id];
                  const lastRunText = metrics?.lastRun
                    ? `Last run ${formatDistanceToNow(new Date(metrics.lastRun), { addSuffix: true })}`
                    : isMetricsLoading
                      ? 'Collecting metrics...'
                      : 'No recent runs recorded';

                  return (
                    <div
                      key={transformation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getTransformationIcon(transformation.transformation_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {transformation.name}
                            </h3>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getTransformationStatus(transformation) === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getTransformationStatus(transformation).charAt(0).toUpperCase() + getTransformationStatus(transformation).slice(1)}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {transformation.transformation_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate">{transformation.description}</p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <div className="bg-gray-100 rounded px-2 py-1">
                              <span className="text-gray-600">Input:</span>
                              <span className="ml-1">{transformation.source_fields.join(', ')}</span>
                            </div>
                            <div className="bg-gray-100 rounded px-2 py-1">
                              <span className="text-gray-600">Output:</span>
                              <span className="ml-1">{transformation.target_fields.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                        <div className="text-right mr-4 hidden md:block">
                          <p className="text-sm font-medium text-gray-900">
                            {metrics
                              ? `${metrics.recordsProcessed.toLocaleString()} records`
                              : isMetricsLoading
                                ? 'Loading metrics...'
                                : 'Metrics unavailable'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {lastRunText}
                          </p>
                        </div>

                        <div className="flex space-x-1">
                          {features?.transformations?.execute && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunTransformation(transformation.id)}
                              disabled={!transformation.is_active}
                              title={!transformation.is_active ? 'Transformation is not active' : 'Run now'}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {features?.transformations?.edit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTransformation(transformation.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {features?.transformations?.delete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTransformation(transformation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={editingTransformation ? `Edit ${editingTransformation.name}` : 'Edit Transformation'}
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={handleCloseEditModal} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveTransformation} disabled={isSavingEdit || isFetchingEdit}>
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      >
        {isFetchingEdit ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {editFormError && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editFormError}
              </div>
            )}

            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(event) => updateEditForm('name', event.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) => updateEditForm('description', event.target.value)}
                rows={3}
                className="mt-1 w-full"
              />
            </div>

            <div>
              <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                Transformation Type
              </label>
              <Input
                id="edit-type"
                value={editForm.transformation_type}
                onChange={(event) => updateEditForm('transformation_type', event.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="edit-source" className="block text-sm font-medium text-gray-700">
                Source Fields
              </label>
              <Input
                id="edit-source"
                value={editForm.source_fields}
                onChange={(event) => updateEditForm('source_fields', event.target.value)}
                className="mt-1"
                placeholder="field_a, field_b"
              />
              <p className="mt-1 text-xs text-gray-500">Comma separated list of input fields.</p>
            </div>

            <div>
              <label htmlFor="edit-target" className="block text-sm font-medium text-gray-700">
                Target Fields
              </label>
              <Input
                id="edit-target"
                value={editForm.target_fields}
                onChange={(event) => updateEditForm('target_fields', event.target.value)}
                className="mt-1"
                placeholder="normalized_field"
              />
              <p className="mt-1 text-xs text-gray-500">Comma separated list of output fields.</p>
            </div>

            <div>
              <label htmlFor="edit-rules" className="block text-sm font-medium text-gray-700">
                Transformation Rules (JSON)
              </label>
              <Textarea
                id="edit-rules"
                value={editForm.transformation_rules}
                onChange={(event) => updateEditForm('transformation_rules', event.target.value)}
                rows={8}
                className="mt-1 w-full font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Provide valid JSON describing the transformation configuration.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.is_active}
                onChange={(event) => updateEditForm('is_active', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="edit-active" className="text-sm text-gray-700">
                Active transformation
              </label>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}