'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BarChart3, TrendingUp, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Lesson5_1Page() {
  const handleComplete = () => {
    progressTracker.completeLesson('module-5-lesson-1', 100);
  };

  return (
    <LessonLayout
      title="Analytics Dashboard"
      description="Build powerful analytics dashboards to track pipeline performance"
      module="Module 5"
      lessonNumber={1}
      estimatedTime="25 min"
      difficulty="advanced"
      objectives={[
        'Understand key metrics for pipeline monitoring',
        'Build custom analytics dashboards',
        'Visualize data flow and performance',
        'Track KPIs and create alerts'
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Why Analytics Matter</h2>
          <p className="text-gray-700 mb-4">
            Analytics dashboards provide visibility into your data pipelines, helping you monitor
            performance, identify bottlenecks, and ensure data quality. They transform raw metrics
            into actionable insights.
          </p>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Benefits</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time visibility into pipeline health
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Early detection of performance degradation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Data quality monitoring and validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Cost optimization through resource tracking
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Key Metrics */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Essential Pipeline Metrics</h2>
          <p className="text-gray-700 mb-4">
            Track these critical metrics to ensure pipeline health and performance:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Throughput Metrics</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Records processed per second</li>
                    <li>• Data volume (MB/GB processed)</li>
                    <li>• Pipeline execution time</li>
                    <li>• Queue depth and backlog</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Quality Metrics</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Data validation success rate</li>
                    <li>• Schema compliance percentage</li>
                    <li>• Duplicate detection rate</li>
                    <li>• Null value frequency</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Reliability Metrics</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Pipeline success rate</li>
                    <li>• Error rate and types</li>
                    <li>• Retry frequency</li>
                    <li>• System uptime percentage</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Resource Metrics</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• CPU and memory utilization</li>
                    <li>• Database connection pool</li>
                    <li>• API rate limit usage</li>
                    <li>• Cost per pipeline run</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Fetching Analytics Data */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Fetching Analytics Data</h2>
          <p className="text-gray-700 mb-4">
            Use the platform API to retrieve analytics data for your dashboards:
          </p>
          <CodeBlock
            code={`# Fetch pipeline analytics
from datetime import datetime, timedelta

# Get analytics for the last 24 hours
end_time = datetime.now()
start_time = end_time - timedelta(hours=24)

analytics = api.get_pipeline_analytics(
    pipeline_id="pipeline-123",
    start_time=start_time.isoformat(),
    end_time=end_time.isoformat(),
    metrics=[
        "records_processed",
        "execution_time",
        "success_rate",
        "error_count"
    ]
)

print(f"Records processed: {analytics['records_processed']}")
print(f"Average execution time: {analytics['avg_execution_time']}s")
print(f"Success rate: {analytics['success_rate']}%")
print(f"Errors: {analytics['error_count']}")

# Get aggregated metrics by hour
hourly_metrics = api.get_pipeline_metrics_aggregated(
    pipeline_id="pipeline-123",
    start_time=start_time.isoformat(),
    end_time=end_time.isoformat(),
    granularity="hour"
)

for metric in hourly_metrics:
    print(f"{metric['timestamp']}: {metric['records_processed']} records")`}
            language="python"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Building Dashboards */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Dashboard Design Best Practices</h2>
          <div className="space-y-4 mb-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-2">1. Focus on Actionable Metrics</h3>
              <p className="text-sm text-gray-700">
                Display metrics that drive decisions. Avoid vanity metrics that don&apos;t lead to action.
                Each metric should answer: &quot;What should I do with this information?&quot;
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-2">2. Use Visual Hierarchy</h3>
              <p className="text-sm text-gray-700">
                Place the most critical metrics at the top. Use size, color, and position to guide
                attention. Critical alerts should be immediately visible.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-2">3. Provide Context with Trends</h3>
              <p className="text-sm text-gray-700">
                Show historical trends alongside current values. Compare to previous periods.
                Include targets or thresholds to give meaning to numbers.
              </p>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-2">4. Enable Drill-Down Analysis</h3>
              <p className="text-sm text-gray-700">
                Allow users to click on summary metrics to see detailed breakdowns. Provide filters
                for time range, pipeline, data source, etc.
              </p>
            </Card>
          </div>
        </section>

        {/* Example Dashboard */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Example: Pipeline Health Dashboard</h2>
          <CodeBlock
            code={`# Dashboard configuration example
dashboard_config = {
    "title": "Pipeline Health Dashboard",
    "refresh_interval": 30,  # seconds
    "widgets": [
        {
            "type": "metric_card",
            "title": "Success Rate (24h)",
            "metric": "success_rate",
            "threshold": {
                "warning": 95,
                "critical": 90
            },
            "size": "large"
        },
        {
            "type": "time_series",
            "title": "Records Processed",
            "metrics": ["records_processed"],
            "time_range": "24h",
            "aggregation": "sum",
            "size": "medium"
        },
        {
            "type": "time_series",
            "title": "Execution Time Trend",
            "metrics": ["avg_execution_time", "p95_execution_time"],
            "time_range": "7d",
            "aggregation": "avg",
            "size": "medium"
        },
        {
            "type": "table",
            "title": "Recent Errors",
            "query": "errors",
            "columns": ["timestamp", "pipeline", "error_type", "message"],
            "limit": 10,
            "size": "full"
        }
    ]
}

# Create dashboard
dashboard = api.create_dashboard(dashboard_config)
print(f"Dashboard created: {dashboard['url']}")`}
            language="python"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Alert Configuration */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Setting Up Alerts</h2>
          <p className="text-gray-700 mb-4">
            Configure automatic alerts to be notified of issues:
          </p>
          <CodeBlock
            code={`# Configure threshold-based alerts
alert_config = {
    "name": "Pipeline Success Rate Alert",
    "pipeline_id": "pipeline-123",
    "condition": {
        "metric": "success_rate",
        "operator": "less_than",
        "threshold": 95,
        "duration": "5m"  # Trigger if condition persists for 5 minutes
    },
    "notifications": [
        {
            "type": "email",
            "recipients": ["ops-team@company.com"]
        },
        {
            "type": "slack",
            "channel": "#data-alerts"
        }
    ],
    "severity": "warning"
}

alert = api.create_alert(alert_config)
print(f"Alert configured: {alert['id']}")

# Configure anomaly detection alert
anomaly_alert = {
    "name": "Throughput Anomaly Detection",
    "pipeline_id": "pipeline-123",
    "condition": {
        "metric": "records_processed",
        "type": "anomaly_detection",
        "sensitivity": "medium",  # low, medium, high
        "baseline_period": "7d"
    },
    "notifications": [
        {
            "type": "pagerduty",
            "service_key": "xxx"
        }
    ],
    "severity": "critical"
}

api.create_alert(anomaly_alert)`}
            language="python"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Key Takeaways */}
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Track throughput, quality, reliability, and resource metrics</li>
            <li>• Focus dashboards on actionable insights, not vanity metrics</li>
            <li>• Use visual hierarchy to highlight critical information</li>
            <li>• Provide historical context and trend analysis</li>
            <li>• Configure alerts for proactive issue detection</li>
            <li>• Enable drill-down capabilities for root cause analysis</li>
          </ul>
        </Card>

        <NavigationButtons
          previousUrl="/modules/5-advanced"
          previousLabel="Back to Module 5"
          nextUrl="/modules/5-advanced/lesson-2"
          nextLabel="Next: Real-time Monitoring"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
