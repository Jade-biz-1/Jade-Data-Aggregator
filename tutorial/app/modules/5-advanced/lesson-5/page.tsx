'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import { Layers, CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Lesson5_5Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-5-lesson-5', 100); };

  return (
    <LessonLayout title="Batch Operations" description="Optimize data processing with batch and parallel execution"
      module="Module 5" lessonNumber={5} estimatedTime="30 min" difficulty="advanced"
      objectives={['Implement batch processing', 'Use parallel execution', 'Optimize performance', 'Manage resources efficiently']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Batch Processing Benefits</h2>
          <p className="text-gray-700 mb-4">
            Batch operations significantly improve throughput and reduce costs by processing multiple records together.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Batch Configuration</h2>
          <CodeBlock code={`# Configure batch processing
batch_config = {
    "batch_size": 1000,  # Records per batch
    "max_parallelism": 4,  # Concurrent batches
    "retry_policy": {
        "max_retries": 3,
        "backoff": "exponential"
    },
    "timeout_per_batch": 300  # seconds
}

# Process in batches
def process_in_batches(records, batch_size=1000):
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            result = api.process_batch(batch)
            print(f"Batch {i//batch_size + 1}: {len(result)} records processed")
        except Exception as e:
            print(f"Batch {i//batch_size + 1} failed: {e}")
            handle_failed_batch(batch, e)`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Parallel Execution</h2>
          <CodeBlock code={`# Parallel batch processing
from concurrent.futures import ThreadPoolExecutor, as_completed

def process_batches_parallel(records, batch_size=1000, workers=4):
    batches = [records[i:i+batch_size]
               for i in range(0, len(records), batch_size)]

    results = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_batch = {
            executor.submit(api.process_batch, batch): i
            for i, batch in enumerate(batches)
        }

        for future in as_completed(future_to_batch):
            batch_idx = future_to_batch[future]
            try:
                result = future.result()
                results.append(result)
                print(f"Batch {batch_idx} completed: {len(result)} records")
            except Exception as e:
                print(f"Batch {batch_idx} failed: {e}")

    return results`} language="python" showLineNumbers showCopyButton />
        </section>

        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Batch processing increases throughput and reduces costs</li>
            <li>• Use parallel execution for independent batches</li>
            <li>• Configure optimal batch sizes for your workload</li>
            <li>• Implement proper error handling for batch failures</li>
          </ul>
        </Card>

        <NavigationButtons previousUrl="/modules/5-advanced/lesson-4" previousLabel="Back: Templates"
          nextUrl="/modules/5-advanced/exercise" nextLabel="Start Capstone Exercise" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
