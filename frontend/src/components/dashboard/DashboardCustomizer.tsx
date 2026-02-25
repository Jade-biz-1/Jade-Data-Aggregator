'use client';

import { useState, useEffect } from 'react';
import {
  Layout,
  Grid,
  Plus,
  Save,
  Trash2,
  Copy,
  Share2,
  Settings,
  X,
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Database,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, any>;
}

interface DashboardLayout {
  id?: number;
  name: string;
  description?: string;
  layout: Widget[];
  is_default: boolean;
  is_shared?: boolean;
  is_template?: boolean;
  widget_count?: number;
  created_at?: string;
}

const mapLayout = (raw: any): DashboardLayout => ({
  id: raw.id,
  name: raw.name ?? 'Untitled',
  description: raw.description,
  layout: (raw.layout_config as any)?.widgets ?? [],
  is_default: raw.is_default ?? false,
  is_shared: raw.is_shared ?? false,
  is_template: raw.is_template ?? false,
  widget_count: (raw.layout_config as any)?.widgets?.length ?? 0,
  created_at: raw.created_at,
});

interface WidgetTemplate {
  type: string;
  icon: any;
  title: string;
  description: string;
  defaultSize: 'small' | 'medium' | 'large';
  color: string;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'bar_chart',
    icon: BarChart,
    title: 'Bar Chart',
    description: 'Display data as bars',
    defaultSize: 'medium',
    color: 'text-blue-600',
  },
  {
    type: 'line_chart',
    icon: LineChart,
    title: 'Line Chart',
    description: 'Show trends over time',
    defaultSize: 'medium',
    color: 'text-green-600',
  },
  {
    type: 'pie_chart',
    icon: PieChart,
    title: 'Pie Chart',
    description: 'Visualize proportions',
    defaultSize: 'small',
    color: 'text-purple-600',
  },
  {
    type: 'metrics',
    icon: Activity,
    title: 'Metrics',
    description: 'Key performance indicators',
    defaultSize: 'small',
    color: 'text-orange-600',
  },
  {
    type: 'data_table',
    icon: Database,
    title: 'Data Table',
    description: 'Display tabular data',
    defaultSize: 'large',
    color: 'text-indigo-600',
  },
  {
    type: 'pipeline_status',
    icon: Zap,
    title: 'Pipeline Status',
    description: 'Monitor pipeline health',
    defaultSize: 'medium',
    color: 'text-yellow-600',
  },
];

interface DashboardCustomizerProps {
  onSave?: (layout: DashboardLayout) => void;
  initialLayout?: DashboardLayout;
}

export default function DashboardCustomizer({ onSave, initialLayout }: DashboardCustomizerProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialLayout?.layout || []);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [templates, setTemplates] = useState<DashboardLayout[]>([]);
  const [currentLayoutName, setCurrentLayoutName] = useState(initialLayout?.name || 'My Dashboard');
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toasts, error, success, warning } = useToast();

  useEffect(() => {
    loadLayouts();
    loadTemplates();
  }, []);

  const loadLayouts = async () => {
    try {
      const response = await api.get('/dashboards');
      const raw: any[] = Array.isArray(response.data) ? response.data : [];
      setLayouts(raw.map(mapLayout));
    } catch (err: any) {
      console.error('Failed to load layouts:', err);
      error(err.message || 'Failed to load layouts', 'Error');
      setLayouts([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/dashboards/templates');
      const raw: any[] = Array.isArray(response.data) ? response.data : [];
      setTemplates(raw.map(mapLayout));
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setTemplates([]);
    }
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: Widget = {
      id: Math.random().toString(36).substring(7),
      type: template.type,
      title: template.title,
      size: template.defaultSize,
      position: { x: 0, y: widgets.length },
      config: {},
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetLibrary(false);
    success(`${template.title} widget added`, 'Success');
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => (w.id === widgetId ? { ...w, ...updates } : w)));
  };

  const saveLayout = async () => {
    const layoutName = currentLayoutName || 'My Dashboard';
    setSaving(true);

    try {
      const body = {
        name: layoutName,
        layout_config: { widgets },
        is_default: false,
        is_shared: false,
      };

      let saved: DashboardLayout;
      if (initialLayout?.id) {
        const response = await api.put(`/dashboards/${initialLayout.id}`, body);
        saved = mapLayout(response.data);
        success('Layout updated successfully', 'Success');
      } else {
        const response = await api.post('/dashboards', body);
        saved = mapLayout(response.data);
        success('Layout saved successfully', 'Success');
      }

      await loadLayouts();
      onSave?.(saved);
    } catch (err: any) {
      console.error('Failed to save layout:', err);
      error(err.message || 'Failed to save layout', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const loadLayout = async (layoutId: number) => {
    try {
      const response = await api.get(`/dashboards/${layoutId}`);
      const layout = mapLayout(response.data);
      setWidgets(layout.layout);
      setCurrentLayoutName(layout.name);
      success('Layout loaded successfully', 'Success');
    } catch (err: any) {
      console.error('Failed to load layout:', err);
      error(err.message || 'Failed to load layout', 'Error');
    }
  };

  const deleteLayout = async (layoutId: number) => {
    if (!confirm('Are you sure you want to delete this layout?')) return;

    try {
      await api.delete(`/dashboards/${layoutId}`);
      success('Layout deleted successfully', 'Success');
      await loadLayouts();
    } catch (err: any) {
      console.error('Failed to delete layout:', err);
      error(err.message || 'Failed to delete layout', 'Error');
    }
  };

  const setDefaultLayout = async (layoutId: number) => {
    try {
      await api.post(`/dashboards/${layoutId}/set-default`);
      success('Default layout updated', 'Success');
      await loadLayouts();
    } catch (err: any) {
      console.error('Failed to set default layout:', err);
      error(err.message || 'Failed to set default layout', 'Error');
    }
  };

  const cloneTemplate = async (templateId: number, templateName: string) => {
    try {
      const response = await api.post(`/dashboards/${templateId}/clone`, {
        new_name: `${templateName} (copy)`,
      });
      const cloned = mapLayout(response.data);
      setWidgets(cloned.layout);
      setCurrentLayoutName(cloned.name);
      success(`Template "${templateName}" applied`, 'Success');
      await loadLayouts();
    } catch (err: any) {
      console.error('Failed to clone template:', err);
      error(err.message || 'Failed to apply template', 'Error');
    }
  };

  const duplicateWidget = (widget: Widget) => {
    const newWidget = {
      ...widget,
      id: Math.random().toString(36).substring(7),
      position: { x: widget.position.x, y: widget.position.y + 1 },
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    setWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      default:
        return 'col-span-2';
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={currentLayoutName}
              onChange={(e) => setCurrentLayoutName(e.target.value)}
              placeholder="Dashboard name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </button>

            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Layout className="w-4 h-4" />
              Templates
            </button>

            <button
              onClick={saveLayout}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Layout'}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 min-h-[600px]">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Grid className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Your dashboard is empty
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add widgets to customize your dashboard
            </p>
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {widgets.map(widget => {
              const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
              const Icon = template?.icon || BarChart;
              const color = template?.color || 'text-gray-600';

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(widget.id)}
                  className={`${getWidgetSizeClass(widget.size)} bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-move hover:shadow-lg transition-shadow relative group`}
                >
                  {/* Widget Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${color}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {widget.title}
                      </h3>
                    </div>

                    {/* Widget Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => duplicateWidget(widget)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          const size =
                            widget.size === 'small'
                              ? 'medium'
                              : widget.size === 'medium'
                              ? 'large'
                              : 'small';
                          updateWidget(widget.id, { size });
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Change Size"
                      >
                        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Widget Content Placeholder */}
                  <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {widget.type.replace('_', ' ').toUpperCase()} - {widget.size.toUpperCase()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Widget Library
              </h2>
              <button
                onClick={() => setShowWidgetLibrary(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {WIDGET_TEMPLATES.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.type}
                      onClick={() => addWidget(template)}
                      className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Icon className={`w-8 h-8 ${template.color}`} />
                      <div className="text-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Layouts &amp; Templates
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Saved layouts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  My Saved Layouts
                </h3>
                <div className="space-y-2">
                  {layouts.map(layout => (
                    <div
                      key={layout.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {layout.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {layout.widget_count ?? layout.layout.length} widget{(layout.widget_count ?? layout.layout.length) !== 1 ? 's' : ''}
                          {layout.is_default && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              Default
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            loadLayout(layout.id!);
                            setShowTemplates(false);
                          }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Load
                        </button>
                        {!layout.is_default && (
                          <button
                            onClick={() => setDefaultLayout(layout.id!)}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            title="Set as default"
                          >
                            Default
                          </button>
                        )}
                        {!layout.is_default && (
                          <button
                            onClick={() => deleteLayout(layout.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {layouts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      No saved layouts yet. Save a layout to see it here.
                    </div>
                  )}
                </div>
              </div>

              {/* System templates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Templates
                </h3>
                <div className="space-y-2">
                  {templates.map(tmpl => (
                    <div
                      key={tmpl.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {tmpl.name}
                        </h4>
                        {tmpl.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {tmpl.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {tmpl.widget_count ?? tmpl.layout.length} widget{(tmpl.widget_count ?? tmpl.layout.length) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          await cloneTemplate(tmpl.id!, tmpl.name);
                          setShowTemplates(false);
                        }}
                        className="ml-3 flex-shrink-0 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      No templates available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
