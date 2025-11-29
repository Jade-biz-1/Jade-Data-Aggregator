'use client';

import React, { useState } from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { InteractiveDemo } from '@/components/tutorial/InteractiveDemo';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { progressTracker } from '@/lib/progress';
import {
  LayoutDashboard,
  Activity,
  Database,
  TrendingUp,
  Settings,
  Maximize2,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Lesson1_2Page() {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState('default');
  const [showWidgetData, setShowWidgetData] = useState(true);

  const handleComplete = () => {
    progressTracker.startLesson('module-1-lesson-2', 'module-1');
    progressTracker.completeLesson('module-1-lesson-2', 100);
  };

  const widgets = [
    { id: 'stats', name: 'Statistics Overview', icon: <Activity className="w-6 h-6" />, color: 'bg-blue-500' },
    { id: 'pipelines', name: 'Active Pipelines', icon: <Database className="w-6 h-6" />, color: 'bg-green-500' },
    { id: 'metrics', name: 'Performance Metrics', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500' },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'To display decorative graphics', isCorrect: false },
    { id: '2', text: 'To provide real-time insights and quick access to key metrics', isCorrect: true },
    { id: '3', text: 'To replace the main navigation menu', isCorrect: false },
    { id: '4', text: 'Widgets are not customizable', isCorrect: false },
  ];

  return (
    <LessonLayout
      title="Dashboard Overview"
      description="Explore the dashboard interface, understand widgets, and learn how to customize your view"
      module="Module 1: Platform Basics"
      lessonNumber={2}
      estimatedTime="12 min"
      difficulty="beginner"
      objectives={[
        'Understand dashboard components and their purposes',
        'Learn about different widget types and their data',
        'Customize dashboard layout and widget preferences',
        'Access quick actions and shortcuts',
      ]}
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Components</h2>
          <p className="text-gray-700 mb-4">
            The Data Aggregator Platform dashboard is your command center, providing real-time insights
            into your data pipelines, transformations, and system performance. The dashboard is fully
            customizable to match your workflow needs.
          </p>
          <Alert variant="info">
            <strong>Tip:</strong> You can drag and drop widgets to rearrange them, resize for better
            visibility, and hide widgets you don&apos;t need. Your preferences are automatically saved.
          </Alert>
        </section>

        {/* Widget Types */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding Widgets</h2>
          <p className="text-gray-700 mb-4">
            Widgets are modular components that display specific information. Here are the main types:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Statistics Widget</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Displays aggregate metrics like total connectors, pipelines, and data volume processed.
              </p>
              <Badge variant="info">Real-time</Badge>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Pipeline Status Widget</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Shows active, paused, and failed pipelines with quick action buttons to manage them.
              </p>
              <Badge variant="success">Interactive</Badge>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Performance Metrics Widget</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Visualizes performance trends with charts showing throughput, latency, and error rates.
              </p>
              <Badge variant="warning">Charts</Badge>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Recent Activity Widget</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Lists recent actions, pipeline runs, and system events in chronological order.
              </p>
              <Badge variant="default">Timeline</Badge>
            </Card>
          </div>
        </section>

        {/* Widget Data Structure */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Widget Data Structure</h2>
          <p className="text-gray-700 mb-4">
            Each widget fetches data from the backend API. Here&apos;s how widget data is structured and rendered:
          </p>

          <CodeBlock
            code={`// Example: Fetching and displaying widget data
const DashboardWidget = ({ widgetType, widgetId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const response = await apiClient.getDashboardWidget(widgetId);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load widget:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWidgetData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWidgetData, 30000);
    return () => clearInterval(interval);
  }, [widgetId]);

  if (loading) return <WidgetSkeleton />;

  return (
    <Card>
      <WidgetHeader title={data.title} />
      <WidgetContent data={data.content} type={widgetType} />
      <WidgetActions actions={data.actions} />
    </Card>
  );
};`}
            language="typescript"
            title="Widget Component Example"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Interactive Dashboard Demo */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Dashboard Demo</h2>
          <p className="text-gray-700 mb-4">
            Try interacting with the dashboard widgets below. Click on a widget to see its details,
            toggle visibility, and explore customization options.
          </p>

          <InteractiveDemo
            title="Dashboard Customization"
            description="Explore widget interactions and layouts"
            code={`const DashboardLayout = () => {
  const [widgets, setWidgets] = useState([
    { id: 'stats', visible: true, position: 0 },
    { id: 'pipelines', visible: true, position: 1 },
    { id: 'metrics', visible: true, position: 2 }
  ]);

  const toggleWidget = (id) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  };

  return (
    <div className="dashboard-grid">
      {widgets.filter(w => w.visible).map(widget => (
        <DashboardWidget key={widget.id} {...widget} />
      ))}
    </div>
  );
};`}
            language="typescript"
            instructions="Click on widgets to select them, use the layout selector to change arrangement"
          >
            <div className="space-y-4">
              {/* Layout Selector */}
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Dashboard Layout</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={dashboardLayout === 'default' ? 'primary' : 'outline'}
                      onClick={() => setDashboardLayout('default')}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-1" />
                      Default
                    </Button>
                    <Button
                      size="sm"
                      variant={dashboardLayout === 'compact' ? 'primary' : 'outline'}
                      onClick={() => setDashboardLayout('compact')}
                    >
                      Compact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowWidgetData(!showWidgetData)}
                    >
                      {showWidgetData ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Widget Grid */}
                <div className={`grid gap-3 ${dashboardLayout === 'compact' ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'
                  }`}>
                  {widgets.map((widget) => (
                    <Card
                      key={widget.id}
                      className={`p-4 cursor-pointer transition-all ${selectedWidget === widget.id
                        ? 'ring-2 ring-primary-500 shadow-lg'
                        : 'hover:shadow-md'
                        }`}
                      onClick={() => setSelectedWidget(widget.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 ${widget.color} rounded-lg flex items-center justify-center text-white`}>
                          {widget.icon}
                        </div>
                        <h5 className="font-semibold text-sm text-gray-900">{widget.name}</h5>
                      </div>

                      {showWidgetData && dashboardLayout === 'default' && (
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Active:</span>
                            <span className="font-semibold text-green-600">12</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-semibold">45</span>
                          </div>
                        </div>
                      )}

                      {selectedWidget === widget.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <Button size="sm" variant="ghost" className="flex-1">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1">
                            <Settings className="w-3 h-3 mr-1" />
                            Config
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {selectedWidget && (
                  <Alert variant="success" className="mt-4">
                    <strong>Widget Selected:</strong> {widgets.find(w => w.id === selectedWidget)?.name}
                    <br />
                    <span className="text-sm">Right-click on a widget in the actual platform to access more options like resize, export, or remove.</span>
                  </Alert>
                )}
              </Card>
            </div>
          </InteractiveDemo>
        </section>

        {/* Dashboard Customization */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customization Options</h2>
          <p className="text-gray-700 mb-4">
            The platform provides several ways to customize your dashboard experience:
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <LayoutDashboard className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <strong className="text-gray-900">Widget Arrangement:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Drag and drop widgets to rearrange them. Your layout is automatically saved per user.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Maximize2 className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <strong className="text-gray-900">Widget Sizing:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Resize widgets by dragging their corners. Some widgets adapt to show more or less detail.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <strong className="text-gray-900">Refresh Intervals:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure auto-refresh rates for each widget (5s, 30s, 1min, 5min, or manual).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Download className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <strong className="text-gray-900">Export Data:</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Export widget data to CSV, JSON, or PDF for reporting and external analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CodeBlock
            code={`// Example: Saving user dashboard preferences
const saveDashboardLayout = async (layout) => {
  const preferences = {
    user_id: currentUser.id,
    layout_config: {
      widgets: layout.widgets.map(w => ({
        id: w.id,
        position: { x: w.x, y: w.y },
        size: { width: w.width, height: w.height },
        visible: w.visible,
        refresh_interval: w.refreshInterval
      }))
    },
    theme: layout.theme
  };

  await apiClient.updateDashboardPreferences(preferences);
};`}
            language="javascript"
            title="Dashboard Preferences API"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-gray-700 mb-4">
            The dashboard provides quick access to common operations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Create New Resources</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• New Connector (CSV, JSON, API, Database)</li>
                <li>• New Transformation (Filter, Map, Aggregate)</li>
                <li>• New Pipeline (Connect sources to destinations)</li>
                <li>• New Dashboard Widget</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Monitoring & Management</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View pipeline execution history</li>
                <li>• Check system health and logs</li>
                <li>• Manage scheduled jobs</li>
                <li>• Export audit reports</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="What is the primary purpose of dashboard widgets?"
            options={quizOptions}
            explanation="Dashboard widgets are designed to provide real-time insights and quick access to key metrics, helping users monitor their data pipelines, system performance, and recent activities at a glance. They are fully customizable to match individual workflow needs."
            hint="Think about why you would want different views of your data on one screen."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Dashboard widgets provide real-time insights into pipelines and performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Widgets can be customized, resized, and rearranged to suit your workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Auto-refresh intervals keep data current without manual updates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Quick actions provide shortcuts to common operations and resources</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/1/lesson-3"
          nextLabel="Next: Roles and Permissions"
          previousUrl="/modules/1/lesson-1"
          previousLabel="Back: Login and Navigation"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
