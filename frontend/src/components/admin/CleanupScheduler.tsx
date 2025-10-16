/**
 * Cleanup Scheduler Component
 * Phase 8: System Maintenance Dashboard
 *
 * Configure automatic cleanup schedules and retention policies
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Save, Calendar, AlertCircle } from 'lucide-react';

export interface CleanupScheduleConfig {
  enabled: boolean;
  activity_log_retention_days: number;
  execution_log_retention_days: number;
  temp_file_retention_hours: number;
  orphaned_data_check_days: number;
  vacuum_frequency_days: number;
  session_cleanup_hours: number;
}

interface CleanupSchedulerProps {
  initialConfig?: CleanupScheduleConfig;
  onSave?: (config: CleanupScheduleConfig) => Promise<void>;
  loading?: boolean;
}

const DEFAULT_CONFIG: CleanupScheduleConfig = {
  enabled: false,
  activity_log_retention_days: 90,
  execution_log_retention_days: 30,
  temp_file_retention_hours: 24,
  orphaned_data_check_days: 7,
  vacuum_frequency_days: 7,
  session_cleanup_hours: 24,
};

export function CleanupScheduler({
  initialConfig,
  onSave,
  loading = false,
}: CleanupSchedulerProps) {
  const [config, setConfig] = useState<CleanupScheduleConfig>(
    initialConfig || DEFAULT_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleChange = (field: keyof CleanupScheduleConfig, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(config);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save cleanup schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(initialConfig || DEFAULT_CONFIG);
    setHasChanges(false);
    setSaveSuccess(false);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            <CardTitle>Cleanup Schedule Configuration</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Automatic Cleanup</span>
            <button
              onClick={() => handleChange('enabled', !config.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning when disabled */}
        {!config.enabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Automatic cleanup is disabled
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You will need to manually run cleanup operations. Enable automatic cleanup to schedule regular maintenance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Retention Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Retention Periods</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Logs (days)
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={config.activity_log_retention_days}
                onChange={(e) =>
                  handleChange('activity_log_retention_days', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep logs for {config.activity_log_retention_days} days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Logs (days)
              </label>
              <Input
                type="number"
                min="1"
                max="180"
                value={config.execution_log_retention_days}
                onChange={(e) =>
                  handleChange('execution_log_retention_days', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep logs for {config.execution_log_retention_days} days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Files (hours)
              </label>
              <Input
                type="number"
                min="1"
                max="168"
                value={config.temp_file_retention_hours}
                onChange={(e) =>
                  handleChange('temp_file_retention_hours', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Delete files older than {config.temp_file_retention_hours} hours
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Cleanup (hours)
              </label>
              <Input
                type="number"
                min="1"
                max="72"
                value={config.session_cleanup_hours}
                onChange={(e) =>
                  handleChange('session_cleanup_hours', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Clean expired sessions every {config.session_cleanup_hours} hours
              </p>
            </div>
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Maintenance Schedule</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orphaned Data Check (days)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={config.orphaned_data_check_days}
                onChange={(e) =>
                  handleChange('orphaned_data_check_days', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check every {config.orphaned_data_check_days} days
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Database Vacuum (days)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={config.vacuum_frequency_days}
                onChange={(e) =>
                  handleChange('vacuum_frequency_days', parseInt(e.target.value) || 0)
                }
                disabled={!config.enabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Run every {config.vacuum_frequency_days} days
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <div className="flex items-center text-sm text-green-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Settings saved successfully</span>
              </div>
            )}
            {hasChanges && !saveSuccess && (
              <p className="text-sm text-orange-600">Unsaved changes</p>
            )}
          </div>

          <div className="flex space-x-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Schedule</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
