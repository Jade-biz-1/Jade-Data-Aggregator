'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import { CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { TransformationEditor } from '@/components/sandbox';

export default function Lesson3_5Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-3-lesson-5', 100); };

  return (
    <LessonLayout title="Testing Transformations" description="Test transformations before production"
      module="Module 3" lessonNumber={5} estimatedTime="15 min" difficulty="intermediate"
      objectives={['Test with sample data', 'Debug failed transformations', 'Production deployment checklist']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Why Test Transformations?</h2>
          <p className="text-gray-700 mb-4">Testing catches errors before they affect production data.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Testing Methods</h2>
          <CodeBlock code={`# Test transformation with sample data
sample_data = [
    {"name": "John Doe", "email": "john@example.com"},
    {"name": "Jane Smith", "email": "invalid-email"}
]

result = test_transformation(transformation_id, sample_data)

# Review results
for row in result['transformed']:
    print(row)

# Check errors
for error in result['errors']:
    print(f"Row {error['row_num']}: {error['message']}")`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Interactive Testing</h2>
          <p className="text-gray-700 mb-4">
            Try testing a transformation with our interactive editor below. Write your transformation code,
            provide sample input, and see the results instantly.
          </p>

          <TransformationEditor
            initialCode={`# Test transformation with validation
def transform(data):
    """
    Validate and transform email data
    """
    import re

    if isinstance(data, dict):
        # Validate email format
        email = data.get('email', '')
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        is_valid_email = bool(re.match(email_regex, email))

        return {
            'name': data.get('name', '').upper(),
            'email': email,
            'email_valid': is_valid_email,
            'status': 'processed'
        }

    return data`}
            sampleInput={{
              name: "John Doe",
              email: "john@example.com"
            }}
            height="400px"
          />
        </section>

        <section>
          <Card className="p-6 bg-green-50">
            <h3 className="font-semibold mb-3">Production Checklist</h3>
            <ul className="space-y-2">
              {['Test with real sample data', 'Validate all field mappings', 'Check error handling', 'Review performance'].map((item, i) => (
                <li key={i} className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span>{item}</span></li>
              ))}
            </ul>
          </Card>
        </section>

        <NavigationButtons nextUrl="/modules/3-transformations/exercise" nextLabel="Start Exercise"
          previousUrl="/modules/3-transformations/lesson-4" previousLabel="Back: Custom Functions" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
