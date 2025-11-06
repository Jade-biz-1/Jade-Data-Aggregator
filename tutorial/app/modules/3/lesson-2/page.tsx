'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { progressTracker } from '@/lib/progress';
import { CheckCircle } from 'lucide-react';

export default function Lesson3_2Page() {
  const handleComplete = () => {
    progressTracker.completeLesson('module-3-lesson-2', 100);
  };

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'firstName', isCorrect: false },
    { id: '2', text: 'user.profile.name.first', isCorrect: true },
    { id: '3', text: 'user[profile][name][first]', isCorrect: false },
    { id: '4', text: 'profile.name.firstName', isCorrect: false },
  ];

  return (
    <LessonLayout
      title="Field Mapping"
      description="Learn how to map fields between source and destination schemas"
      module="Module 3: Data Transformations"
      lessonNumber={2}
      estimatedTime="20 min"
      difficulty="intermediate"
      objectives={[
        'Map simple fields from source to destination',
        'Access nested fields in complex objects',
        'Combine multiple fields into one',
        'Handle type conversions during mapping'
      ]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Field Mapping Basics</h2>
          <p className="text-gray-700 mb-4">
            Field mapping defines how data from source fields gets into destination fields.
          </p>

          <CodeBlock
            code={`# Simple field mapping
field_mapping = {
    "email": "user_email",        # Rename
    "first_name": "firstName",     # Snake to camel case
    "last_name": "lastName",
    "created_at": "createdAt"
}`}
            language="python"
            showCopyButton
          />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nested Field Access</h2>
          <CodeBlock
            code={`# Access nested fields
field_mapping = {
    "user.profile.name.first": "firstName",
    "user.profile.name.last": "lastName",
    "user.contact.email": "email",
    "metadata.created": "createdAt"
}`}
            language="python"
            showCopyButton
          />
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Combining Fields</h2>
          <CodeBlock
            code={`# Custom function to combine fields
def transform_row(row):
    # Combine first and last name
    row['fullName'] = f"{row['firstName']} {row['lastName']}"
    
    # Combine address parts
    row['fullAddress'] = f"{row['street']}, {row['city']}, {row['state']} {row['zip']}"
    
    return row`}
            language="python"
            showLineNumbers
            showCopyButton
          />
        </section>

        <section>
          <QuizQuestion
            question="How do you access the 'first' field nested in user.profile.name?"
            options={quizOptions}
            explanation="Use dot notation to access nested fields: user.profile.name.first"
          />
        </section>

        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Use dot notation for nested fields (user.profile.email)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Combine fields using custom functions</span>
              </li>
            </ul>
          </Card>
        </section>

        <NavigationButtons
          nextUrl="/modules/3/lesson-3"
          nextLabel="Next: Validation Rules"
          previousUrl="/modules/3/lesson-1"
          previousLabel="Back: Transformation Concepts"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
