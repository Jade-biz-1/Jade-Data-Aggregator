'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { progressTracker } from '@/lib/progress';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Lesson3_3Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-3-lesson-3', 100); };

  return (
    <LessonLayout title="Validation Rules" description="Add data quality checks to ensure clean data"
      module="Module 3" lessonNumber={3} estimatedTime="18 min" difficulty="intermediate"
      objectives={['Add required field validation', 'Validate data types and formats', 'Use custom validation logic']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Why Validate Data?</h2>
          <p className="text-gray-700 mb-4">Validation catches bad data before it reaches your destination.</p>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-semibold mb-1">Without Validation</h4>
              <p className="text-sm text-gray-600">Bad data corrupts destination, causes errors</p>
            </Card>
            <Card className="p-4">
              <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-semibold mb-1">With Validation</h4>
              <p className="text-sm text-gray-600">Only clean data loads, errors caught early</p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Common Validation Rules</h2>
          <CodeBlock code={`validation_rules = [
    {"field": "email", "type": "email", "required": True},
    {"field": "age", "type": "integer", "min": 0, "max": 150},
    {"field": "status", "type": "enum", "values": ["active", "inactive"]},
    {"field": "created_at", "type": "date", "format": "ISO8601"}
]`} language="python" showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Validation Types</h2>
          <div className="space-y-3">
            {[
              {name: 'Required', desc: 'Field must be present and non-null', ex: 'required: True'},
              {name: 'Type', desc: 'Field must be specific type', ex: 'type: "integer"'},
              {name: 'Format', desc: 'Field must match pattern', ex: 'format: "email"'},
              {name: 'Range', desc: 'Numeric value must be in range', ex: 'min: 0, max: 100'},
              {name: 'Enum', desc: 'Value must be in allowed list', ex: 'values: ["A", "B"]'}
            ].map(v => (
              <Card key={v.name} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge>{v.name}</Badge>
                    <p className="text-sm text-gray-600 mt-2">{v.desc}</p>
                  </div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{v.ex}</code>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <NavigationButtons nextUrl="/modules/3-transformations/lesson-4" nextLabel="Next: Custom Functions"
          previousUrl="/modules/3-transformations/lesson-2" previousLabel="Back: Field Mapping" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
