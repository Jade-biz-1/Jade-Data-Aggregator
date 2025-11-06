'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Alert from '@/components/ui/Alert';
import { progressTracker } from '@/lib/progress';

export default function Lesson3_4Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-3-lesson-4', 100); };

  return (
    <LessonLayout title="Custom Functions" description="Write Python code for complex transformations"
      module="Module 3" lessonNumber={4} estimatedTime="25 min" difficulty="intermediate"
      objectives={['Write custom Python transformation functions', 'Use standard libraries', 'Handle errors gracefully']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">When to Use Custom Functions</h2>
          <p className="text-gray-700 mb-4">Use custom functions for complex logic that simple mappings can&apos;t handle.</p>
          <Alert variant="info">
            <strong>Available:</strong> Python standard library (datetime, json, re, etc.)
          </Alert>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Basic Custom Function</h2>
          <CodeBlock code={`def transform_row(row):
    """Transform a single row of data"""
    
    # Calculate derived field
    row['total'] = row['quantity'] * row['price']
    
    # Clean text
    row['name'] = row['name'].strip().title()
    
    # Parse dates
    from datetime import datetime
    row['date'] = datetime.strptime(row['date_string'], '%Y-%m-%d')
    
    return row`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
          <CodeBlock code={`def transform_row(row):
    try:
        row['price'] = float(row['price_string'])
    except (ValueError, KeyError):
        row['price'] = 0.0  # Default value
        row['_error'] = 'Invalid price'
    
    return row`} language="python" showLineNumbers showCopyButton />
        </section>

        <NavigationButtons nextUrl="/modules/3/lesson-5" nextLabel="Next: Testing"
          previousUrl="/modules/3/lesson-3" previousLabel="Back: Validation" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
