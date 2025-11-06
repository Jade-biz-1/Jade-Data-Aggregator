'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import { Activity, CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Lesson5_2Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-5-lesson-2', 100); };

  return (
    <LessonLayout title="Real-time Monitoring" description="Implement real-time pipeline monitoring systems"
      module="Module 5" lessonNumber={2} estimatedTime="30 min" difficulty="advanced"
      objectives={['Set up live status tracking', 'Implement WebSocket connections', 'Build real-time dashboards', 'Configure live alerting']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Real-time Monitoring Overview</h2>
          <p className="text-gray-700 mb-4">
            Real-time monitoring provides instant visibility into pipeline execution, allowing immediate response to issues.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">WebSocket Integration</h2>
          <CodeBlock code={`# Subscribe to pipeline events
import websocket

ws_url = "wss://api.platform.com/v1/pipelines/stream"

def on_message(ws, message):
    event = json.loads(message)
    if event['type'] == 'pipeline_started':
        print(f"Pipeline {event['pipeline_id']} started")
    elif event['type'] == 'pipeline_progress':
        print(f"Progress: {event['progress']}%")
    elif event['type'] == 'pipeline_completed':
        print(f"Completed with status: {event['status']}")

ws = websocket.WebSocketApp(ws_url,
    on_message=on_message,
    header={"Authorization": f"Bearer {api_token}"})

ws.run_forever()`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Live Status Tracking</h2>
          <CodeBlock code={`# Track pipeline status in real-time
status_stream = api.stream_pipeline_status(
    pipeline_id="pipeline-123",
    include_metrics=True
)

for status_update in status_stream:
    print(f"Status: {status_update['current_stage']}")
    print(f"Records: {status_update['records_processed']}")
    print(f"Duration: {status_update['elapsed_time']}s")

    # Check for issues
    if status_update['error_count'] > 0:
        print(f"⚠ Errors detected: {status_update['error_count']}")
        send_alert(status_update)`} language="python" showLineNumbers showCopyButton />
        </section>

        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Use WebSockets for real-time event streaming</li>
            <li>• Track pipeline progress and stages live</li>
            <li>• Implement automatic alerts for critical events</li>
            <li>• Build dashboards that update without page refresh</li>
          </ul>
        </Card>

        <NavigationButtons previousUrl="/modules/5-advanced/lesson-1" previousLabel="Back: Analytics"
          nextUrl="/modules/5-advanced/lesson-3" nextLabel="Next: Error Handling" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
