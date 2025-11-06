'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import CodeBlock from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Lesson7Page() {
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-7', 100);
  };

  const simulateRun = () => {
    setExecutionStatus('running');
    setTimeout(() => {
      setExecutionStatus('success');
    }, 2000);
  };

  const executionStates = [
    { status: 'idle', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
    { status: 'running', icon: Play, color: 'text-blue-600', bg: 'bg-blue-100' },
    { status: 'success', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { status: 'failed', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const currentState = executionStates.find(s => s.status === executionStatus);

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.7: Pipeline Execution"
      lessonId="module-4-lesson-7"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Running Your Pipeline</h2>
          <p className="text-gray-700 mb-4">
            Once configured, you can execute your pipeline manually, on a schedule, or via API.
            The platform tracks each execution and provides detailed logs.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Execution Simulator</h2>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentState && (
                  <>
                    <div className={`p-3 rounded-full ${currentState.bg}`}>
                      <currentState.icon className={`w-6 h-6 ${currentState.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{executionStatus}</h3>
                      <p className="text-sm text-gray-600">
                        {executionStatus === 'idle' && 'Pipeline ready to run'}
                        {executionStatus === 'running' && 'Processing data...'}
                        {executionStatus === 'success' && 'Completed successfully'}
                        {executionStatus === 'failed' && 'Execution failed'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={simulateRun}
                  disabled={executionStatus === 'running'}
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Pipeline
                </Button>
                {executionStatus !== 'idle' && (
                  <Button
                    onClick={() => setExecutionStatus('idle')}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {executionStatus === 'running' && (
              <div className="space-y-2 bg-blue-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <p className="text-sm">Connecting to source...</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <p className="text-sm">Extracting data (1,234 rows)...</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <p className="text-sm">Applying transformations...</p>
                </div>
              </div>
            )}

            {executionStatus === 'success' && (
              <div className="bg-green-50 p-4 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Pipeline completed successfully</p>
                </div>
                <div className="text-sm text-green-800 space-y-1">
                  <p>" Processed: 1,234 rows</p>
                  <p>" Inserted: 1,234 rows</p>
                  <p>" Duration: 45.2 seconds</p>
                  <p>" Errors: 0</p>
                </div>
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Execution Lifecycle</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1. Queued', description: 'Pipeline added to execution queue' },
              { step: '2. Running', description: 'Extracting, transforming, loading data' },
              { step: '3. Completing', description: 'Finalizing writes and cleanup' },
              { step: '4. Finished', description: 'Success or failure state recorded' },
            ].map((phase, i) => (
              <Card key={i} className="p-4">
                <Badge variant="primary" className="mb-2">{phase.step}</Badge>
                <p className="text-sm text-gray-600">{phase.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Manual Execution via API</h2>
          <CodeBlock language="bash" code={`# Trigger pipeline execution
curl -X POST https://api.platform.com/v1/pipelines/run \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pipeline_id": "sales_pipeline_123",
    "parameters": {
      "date": "2024-01-15",
      "force": false
    }
  }'`} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Execution Parameters</h2>
          <CodeBlock language="json" code={`{
  "execution": {
    "parameters": {
      "start_date": "\${YESTERDAY}",
      "end_date": "\${TODAY}",
      "region": "US"
    },
    "overrides": {
      "batch_size": 500,
      "max_retries": 5
    },
    "dry_run": false,
    "notify_on_completion": true
  }
}`} />
          <Card className="p-4 bg-yellow-50 border-yellow-200 mt-3">
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> Use <code>dry_run: true</code> to test pipeline logic without
              writing to the destination. This is helpful for validating configurations.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Error Handling Strategies</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-2">Retry on Failure</h3>
              <p className="text-sm text-gray-600 mb-3">
                Automatically retry failed executions with exponential backoff.
              </p>
              <CodeBlock language="json" code={`{
  "on_failure": {
    "action": "retry",
    "max_retries": 3,
    "backoff": "exponential"
  }
}`} />
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-2">Skip Bad Rows</h3>
              <p className="text-sm text-gray-600 mb-3">
                Continue processing even if some rows fail validation.
              </p>
              <CodeBlock language="json" code={`{
  "on_row_error": {
    "action": "skip",
    "log_errors": true,
    "max_error_rate": 0.05
  }
}`} />
            </Card>
          </div>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines/lesson-6"
          nextHref="/modules/4-pipelines/lesson-8"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
