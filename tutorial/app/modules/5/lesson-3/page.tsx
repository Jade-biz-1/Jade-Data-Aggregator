'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Lesson5_3Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-5-lesson-3', 100); };

  return (
    <LessonLayout title="Error Handling Strategies" description="Master advanced error handling for robust pipelines"
      module="Module 5" lessonNumber={3} estimatedTime="25 min" difficulty="advanced"
      objectives={['Implement retry logic', 'Use dead letter queues', 'Design circuit breakers', 'Create error recovery strategies']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Error Handling Patterns</h2>
          <p className="text-gray-700 mb-4">
            Production pipelines must handle failures gracefully to ensure data integrity and system reliability.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Retry Logic with Exponential Backoff</h2>
          <CodeBlock code={`# Implement intelligent retry logic
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def process_with_retry(data):
    try:
        return api.process_data(data)
    except TemporaryError as e:
        print(f"Temporary error, will retry: {e}")
        raise  # Retry
    except PermanentError as e:
        print(f"Permanent error, sending to DLQ: {e}")
        send_to_dead_letter_queue(data, e)
        return None  # Don't retry`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Dead Letter Queue Pattern</h2>
          <CodeBlock code={`# Configure dead letter queue for failed records
dlq_config = {
    "name": "pipeline-123-dlq",
    "retention_days": 7,
    "max_retries": 3,
    "retry_delay": "1h"
}

# Send failed record to DLQ
def handle_failed_record(record, error):
    dlq_entry = {
        "record": record,
        "error": str(error),
        "error_type": type(error).__name__,
        "timestamp": datetime.now().isoformat(),
        "attempt_count": record.get('_retry_count', 0) + 1
    }
    api.send_to_dlq("pipeline-123-dlq", dlq_entry)

# Process DLQ later
for entry in api.get_dlq_entries("pipeline-123-dlq"):
    if entry['attempt_count'] < 3:
        retry_processing(entry['record'])`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Circuit Breaker Pattern</h2>
          <CodeBlock code={`# Implement circuit breaker to prevent cascading failures
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.last_failure_time = None

    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'HALF_OPEN'
            else:
                raise CircuitBreakerOpen("Service unavailable")

        try:
            result = func(*args, **kwargs)
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
            raise

breaker = CircuitBreaker()
result = breaker.call(external_api.fetch_data)`} language="python" showLineNumbers showCopyButton />
        </section>

        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Use exponential backoff for transient errors</li>
            <li>• Implement dead letter queues for failed records</li>
            <li>• Use circuit breakers to prevent cascading failures</li>
            <li>• Distinguish between retryable and permanent errors</li>
          </ul>
        </Card>

        <NavigationButtons previousUrl="/modules/5/lesson-2" previousLabel="Back: Monitoring"
          nextUrl="/modules/5/lesson-4" nextLabel="Next: Pipeline Templates" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
