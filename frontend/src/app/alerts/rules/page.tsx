'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ArrowLeft,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface AlertRule {
  id?: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: string;
    threshold: number;
    duration_minutes?: number;
  };
  severity: 'critical' | 'warning' | 'info';
  is_active: boolean;
  created_at?: string;
  trigger_count?: number;
}

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const { features, loading: permissionsLoading } = usePermissions();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<AlertRule>({
    name: '',
    description: '',
    condition: {
      metric: 'pipeline_failure_rate',
      operator: 'greater_than',
      threshold: 50,
      duration_minutes: 5
    },
    severity: 'warning',
    is_active: true
  });

  useEffect(() => {
    if (!permissionsLoading && features?.monitoring?.manage_alerts) {
      fetchRules();
    }
  }, [permissionsLoading, features]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/alerts/rules');
      setRules(response.data || []);
    } catch (err: any) {
      console.error('Error fetching alert rules:', err);
      showError('Failed to load alert rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule?.id) {
        await apiClient.put(`/alerts/rules/${editingRule.id}`, formData);
        success('Alert rule updated successfully');
      } else {
        await apiClient.post('/alerts/rules', formData);
        success('Alert rule created successfully');
      }
      setShowForm(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Failed to save alert rule');
    }
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      await apiClient.delete(`/alerts/rules/${id}`);
      success('Alert rule deleted successfully');
      fetchRules();
    } catch (err: any) {
      showError('Failed to delete alert rule');
    }
  };

  const handleToggleActive = async (rule: AlertRule) => {
    try {
      await apiClient.put(`/alerts/rules/${rule.id}`, {
        ...rule,
        is_active: !rule.is_active
      });
      success(`Alert rule ${!rule.is_active ? 'activated' : 'deactivated'}`);
      fetchRules();
    } catch (err: any) {
      showError('Failed to update alert rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      condition: {
        metric: 'pipeline_failure_rate',
        operator: 'greater_than',
        threshold: 50,
        duration_minutes: 5
      },
      severity: 'warning',
      is_active: true
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (!features?.monitoring?.manage_alerts) {
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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/alerts">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Alert Rules</h1>
            <p className="mt-2 text-gray-600">
              Configure alert rules and conditions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchRules}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => {
              resetForm();
              setEditingRule(null);
              setShowForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Form Card */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metric *
                    </label>
                    <select
                      value={formData.condition.metric}
                      onChange={(e) => setFormData({
                        ...formData,
                        condition: { ...formData.condition, metric: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="pipeline_failure_rate">Pipeline Failure Rate</option>
                      <option value="execution_time">Execution Time</option>
                      <option value="error_count">Error Count</option>
                      <option value="records_processed">Records Processed</option>
                      <option value="cpu_usage">CPU Usage</option>
                      <option value="memory_usage">Memory Usage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operator *
                    </label>
                    <select
                      value={formData.condition.operator}
                      onChange={(e) => setFormData({
                        ...formData,
                        condition: { ...formData.condition, operator: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Threshold *
                    </label>
                    <input
                      type="number"
                      value={formData.condition.threshold}
                      onChange={(e) => setFormData({
                        ...formData,
                        condition: { ...formData.condition, threshold: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.condition.duration_minutes || 5}
                    onChange={(e) => setFormData({
                      ...formData,
                      condition: { ...formData.condition, duration_minutes: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Condition must be met for this duration before triggering alert
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No alert rules configured</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rule.severity)}`}>
                            {rule.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-700">
                          <span className="font-medium">
                            {rule.condition.metric.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-500">
                            {rule.condition.operator.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium">
                            {rule.condition.threshold}
                          </span>
                          {rule.condition.duration_minutes && (
                            <span className="text-gray-500">
                              for {rule.condition.duration_minutes} min
                            </span>
                          )}
                        </div>
                        {rule.trigger_count !== undefined && (
                          <p className="text-xs text-gray-600 mt-2">
                            Triggered {rule.trigger_count} times
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(rule)}
                          title={rule.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {rule.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(rule.id!)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
