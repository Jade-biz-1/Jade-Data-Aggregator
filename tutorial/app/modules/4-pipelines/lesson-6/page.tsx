'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import CodeBlock from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Clock, Calendar, Zap, CheckCircle } from 'lucide-react';

export default function Lesson6Page() {
  const [scheduleType, setScheduleType] = useState('cron');

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-6', 100);
  };

  const scheduleOptions = [
    { id: 'cron', label: 'Cron Schedule', icon: Clock, description: 'Unix-style cron expressions' },
    { id: 'interval', label: 'Interval', icon: Calendar, description: 'Run every X hours/days' },
    { id: 'manual', label: 'Manual', icon: Zap, description: 'Trigger on-demand only' },
  ];

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.6: Pipeline Scheduling"
      lessonId="module-4-lesson-6"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Automating Pipeline Execution</h2>
          <p className="text-gray-700 mb-4">
            Scheduling determines when your pipeline runs. You can set up recurring schedules,
            run at specific times, or trigger pipelines manually or via API.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Schedule Types</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {scheduleOptions.map(option => (
              <Card
                key={option.id}
                className={`p-5 cursor-pointer transition-all ${
                  scheduleType === option.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setScheduleType(option.id)}
              >
                <option.icon className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold mb-1">{option.label}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                {scheduleType === option.id && (
                  <Badge variant="success" className="mt-3">Active</Badge>
                )}
              </Card>
            ))}
          </div>

          {scheduleType === 'cron' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Cron Expression Schedule</h3>
              <CodeBlock language="json" code={`{
  "schedule": {
    "type": "cron",
    "expression": "0 2 * * *",
    "timezone": "America/New_York",
    "description": "Daily at 2:00 AM ET"
  }
}`} />
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-semibold">Common Cron Patterns:</p>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <code className="text-xs">0 * * * *</code>
                    <span className="text-gray-600">Every hour</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <code className="text-xs">0 0 * * *</code>
                    <span className="text-gray-600">Daily at midnight</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <code className="text-xs">0 9 * * 1-5</code>
                    <span className="text-gray-600">Weekdays at 9 AM</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <code className="text-xs">0 0 1 * *</code>
                    <span className="text-gray-600">First day of month</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {scheduleType === 'interval' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Interval-Based Schedule</h3>
              <CodeBlock language="json" code={`{
  "schedule": {
    "type": "interval",
    "interval_type": "hours",
    "interval_value": 6,
    "start_time": "2024-01-01T00:00:00Z",
    "description": "Every 6 hours starting from Jan 1"
  }
}`} />
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Interval Options:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li><code>minutes</code> - For frequent updates (use with caution)</li>
                  <li><code>hours</code> - Common for regular data refreshes</li>
                  <li><code>days</code> - Daily batch processing</li>
                  <li><code>weeks</code> - Weekly aggregations and reports</li>
                </ul>
              </div>
            </Card>
          )}

          {scheduleType === 'manual' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Manual Trigger</h3>
              <CodeBlock language="json" code={`{
  "schedule": {
    "type": "manual",
    "allow_api_trigger": true,
    "webhook_url": "https://api.platform.com/pipelines/run",
    "description": "Run manually or via API"
  }
}`} />
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-3">
                  Manual pipelines are great for:
                </p>
                <div className="space-y-2">
                  {[
                    'One-time data migrations',
                    'Event-driven workflows (e.g., when a file is uploaded)',
                    'Testing and development',
                    'Integration with external automation tools'
                  ].map((use, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm">{use}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Advanced Scheduling Options</h2>
          <CodeBlock language="json" code={`{
  "schedule": {
    "type": "cron",
    "expression": "0 1 * * *",
    "timezone": "UTC",
    "advanced": {
      "max_concurrent_runs": 1,
      "skip_if_previous_running": true,
      "retry_on_failure": true,
      "max_retries": 3,
      "retry_delay_minutes": 15,
      "timeout_minutes": 60,
      "notifications": {
        "on_success": false,
        "on_failure": true,
        "email": ["data-team@company.com"]
      }
    }
  }
}`} />
        </section>

        <section>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2">=¡ Scheduling Best Practices</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>" Schedule during off-peak hours to minimize impact on source systems</p>
              <p>" Prevent overlapping runs with <code>skip_if_previous_running</code></p>
              <p>" Always set timeouts to prevent hung pipelines</p>
              <p>" Use timezone-aware schedules to avoid daylight saving issues</p>
              <p>" Enable failure notifications for critical pipelines</p>
            </div>
          </Card>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines/lesson-5"
          nextHref="/modules/4-pipelines/lesson-7"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
