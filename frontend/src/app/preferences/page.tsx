'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Globe,
  Bell,
  Shield,
  Save,
  Moon,
  Sun,
  Monitor,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  accessibility: {
    high_contrast: boolean;
    large_text: boolean;
    reduce_motion: boolean;
  };
}

export default function PreferencesPage() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: false,
    accessibility: {
      high_contrast: false,
      large_text: false,
      reduce_motion: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await api.get('/preferences/user');
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/preferences/user', { preferences });
      setSaved(true);

      // Apply theme immediately
      applyTheme(preferences.theme);

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateAccessibility = (key: keyof UserPreferences['accessibility'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, [key]: value },
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Preferences</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Customize your experience and settings
            </p>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
              {[
                { icon: Palette, label: 'Appearance', id: 'appearance' },
                { icon: Globe, label: 'Regional', id: 'regional' },
                { icon: Bell, label: 'Notifications', id: 'notifications' },
                { icon: Shield, label: 'Accessibility', id: 'accessibility' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance */}
            <div id="appearance" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Palette className="w-6 h-6" />
                Appearance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map(theme => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => updatePreference('theme', theme.value as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                            preferences.theme === theme.value
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${
                            preferences.theme === theme.value
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            preferences.theme === theme.value
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {theme.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Regional Settings */}
            <div id="regional" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="w-6 h-6" />
                Regional Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferences.date_format}
                      onChange={(e) => updatePreference('date_format', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="YYYY-MM-DD">2025-10-07</option>
                      <option value="MM/DD/YYYY">10/07/2025</option>
                      <option value="DD/MM/YYYY">07/10/2025</option>
                      <option value="DD MMM YYYY">07 Oct 2025</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.time_format}
                      onChange={(e) => updatePreference('time_format', e.target.value as '12h' | '24h')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="24h">24-hour (14:30)</option>
                      <option value="12h">12-hour (2:30 PM)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div id="notifications" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notifications
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'notifications_enabled' as const, label: 'Enable Notifications', description: 'Receive notifications about pipeline updates and alerts' },
                  { key: 'email_notifications' as const, label: 'Email Notifications', description: 'Send notification emails to your inbox' },
                  { key: 'push_notifications' as const, label: 'Push Notifications', description: 'Show browser push notifications' },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <button
                      onClick={() => updatePreference(item.key, !preferences[item.key])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div id="accessibility" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Accessibility
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'high_contrast' as const, label: 'High Contrast Mode', description: 'Increase color contrast for better visibility' },
                  { key: 'large_text' as const, label: 'Large Text', description: 'Use larger font sizes throughout the interface' },
                  { key: 'reduce_motion' as const, label: 'Reduce Motion', description: 'Minimize animations and transitions' },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <button
                      onClick={() => updateAccessibility(item.key, !preferences.accessibility[item.key])}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.accessibility[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.accessibility[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
