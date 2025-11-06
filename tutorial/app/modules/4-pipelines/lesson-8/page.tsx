'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import CodeBlock from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Activity, Bell, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Lesson8Page() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-8', 100);
  };

  const metrics = [
    { id: 'success_rate', label: 'Success Rate', value: '98.5%', color: 'text-green-600', icon: CheckCircle },
    { id: 'avg_duration', label: 'Avg Duration', value: '2m 34s', color: 'text-blue-600', icon: Activity },
    { id: 'rows_processed', label: 'Rows/Day', value: '1.2M', color: 'text-purple-600', icon: TrendingUp },
    { id: 'failures', label: 'Failures (7d)', value: '3', color: 'text-red-600', icon: XCircle },
  ];

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.8: Monitoring and Alerts"
      lessonId="module-4-lesson-8"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Pipeline Monitoring</h2>
          <p className="text-gray-700 mb-4">
            Monitoring ensures your pipelines run smoothly in production. Track execution metrics,
            set up alerts, and quickly diagnose issues when they occur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Key Metrics Dashboard</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {metrics.map(metric => (
              <Card
                key={metric.id}
                className={`p-5 cursor-pointer transition-all ${
                  selectedMetric === metric.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedMetric(metric.id)}
              >
                <metric.icon className={`w-6 h-6 mb-2 ${metric.color}`} />
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Alert Configuration</h2>
          <CodeBlock language="json" code={`{
  "monitoring": {
    "alerts": [
      {
        "name": "Pipeline Failure Alert",
        "condition": "status == 'failed'",
        "severity": "critical",
        "channels": ["email", "slack"],
        "recipients": ["data-team@company.com"],
        "slack_webhook": "https://hooks.slack.com/services/xxx"
      },
      {
        "name": "Long Running Pipeline",
        "condition": "duration_minutes > 60",
        "severity": "warning",
        "channels": ["email"],
        "recipients": ["data-ops@company.com"]
      },
      {
        "name": "Low Success Rate",
        "condition": "success_rate_7d < 0.95",
        "severity": "warning",
        "channels": ["slack"],
        "check_frequency": "hourly"
      },
      {
        "name": "High Error Rate",
        "condition": "error_rate > 0.05",
        "severity": "critical",
        "channels": ["email", "pagerduty"],
        "recipients": ["oncall@company.com"]
      }
    ]
  }
}`} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Execution Logs</h2>
          <Card className="p-4 bg-gray-900 text-gray-100 font-mono text-sm">
            <div className="space-y-1">
              <p className="text-green-400">[2024-01-15 10:30:15] INFO: Pipeline execution started</p>
              <p className="text-blue-400">[2024-01-15 10:30:16] INFO: Connected to source: postgres_prod</p>
              <p className="text-blue-400">[2024-01-15 10:30:17] INFO: Extracting data: SELECT * FROM orders...</p>
              <p className="text-blue-400">[2024-01-15 10:30:22] INFO: Extracted 1,234 rows</p>
              <p className="text-purple-400">[2024-01-15 10:30:23] INFO: Applying transformation: field_mapping</p>
              <p className="text-purple-400">[2024-01-15 10:30:24] INFO: Applying transformation: validation</p>
              <p className="text-yellow-400">[2024-01-15 10:30:25] WARN: 3 rows failed validation, skipped</p>
              <p className="text-blue-400">[2024-01-15 10:30:26] INFO: Writing to destination: postgres_warehouse</p>
              <p className="text-blue-400">[2024-01-15 10:30:35] INFO: Inserted 1,231 rows</p>
              <p className="text-green-400">[2024-01-15 10:30:36] INFO: Pipeline execution completed successfully</p>
              <p className="text-gray-400">[2024-01-15 10:30:36] INFO: Duration: 21.3 seconds</p>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Monitoring Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex gap-3">
                <Activity className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Track Trends</h3>
                  <p className="text-sm text-gray-600">
                    Monitor execution duration, row counts, and error rates over time to spot
                    degradation before it becomes critical.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex gap-3">
                <Bell className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Smart Alerts</h3>
                  <p className="text-sm text-gray-600">
                    Set thresholds that matter. Alert on failures immediately, but use warning
                    levels for trends to avoid alert fatigue.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Data Quality Checks</h3>
                  <p className="text-sm text-gray-600">
                    Monitor data quality metrics like null rates, duplicate counts, and value
                    distributions to catch upstream issues.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex gap-3">
                <TrendingUp className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Performance Metrics</h3>
                  <p className="text-sm text-gray-600">
                    Track throughput (rows/second) and resource usage to optimize pipeline
                    performance and costs.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Quality Monitoring</h2>
          <CodeBlock language="json" code={`{
  "quality_checks": [
    {
      "name": "Null Check",
      "type": "null_rate",
      "column": "customer_id",
      "threshold": 0.01,
      "action": "alert"
    },
    {
      "name": "Duplicate Check",
      "type": "duplicate_rate",
      "columns": ["order_id"],
      "threshold": 0.001,
      "action": "fail_pipeline"
    },
    {
      "name": "Range Check",
      "type": "value_range",
      "column": "amount",
      "min": 0,
      "max": 1000000,
      "action": "alert"
    },
    {
      "name": "Freshness Check",
      "type": "data_freshness",
      "column": "created_at",
      "max_age_hours": 25,
      "action": "alert"
    }
  ]
}`} />
        </section>

        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Congratulations!
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              You've completed all lessons for Module 4: Data Pipelines. You now understand how to
              build, configure, schedule, and monitor production data pipelines.
            </p>
            <p className="text-sm text-gray-700">
              Next, complete the hands-on exercise to build your own complete pipeline!
            </p>
          </Card>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines/lesson-7"
          nextHref="/modules/4-pipelines/exercise"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
