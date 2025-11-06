'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { RefreshCw, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function Lesson4Page() {
  const [transforms, setTransforms] = useState([
    { id: 1, type: 'Field Mapping', enabled: true },
    { id: 2, type: 'Validation', enabled: true },
  ]);

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-4', 100);
  };

  const addTransform = () => {
    setTransforms([...transforms, {
      id: Date.now(),
      type: 'Custom Function',
      enabled: true
    }]);
  };

  const removeTransform = (id: number) => {
    setTransforms(transforms.filter(t => t.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newTransforms = [...transforms];
    [newTransforms[index - 1], newTransforms[index]] = [newTransforms[index], newTransforms[index - 1]];
    setTransforms(newTransforms);
  };

  const moveDown = (index: number) => {
    if (index === transforms.length - 1) return;
    const newTransforms = [...transforms];
    [newTransforms[index], newTransforms[index + 1]] = [newTransforms[index + 1], newTransforms[index]];
    setTransforms(newTransforms);
  };

  return (
    <LessonLayout
      title="Adding Transformation Steps"
      description="Learn how to add and configure transformation steps in your data pipelines"
      module="Module 4: Data Pipelines"
      lessonNumber={4}
      estimatedTime="20 min"
      difficulty="intermediate"
      objectives={[
        'Add transformation steps to pipelines',
        'Configure field mapping transformations',
        'Set up data validation rules',
        'Apply filtering and custom functions',
        'Understand transformation execution order',
      ]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Pipeline Transformations</h2>
          <p className="text-gray-700 mb-4">
            Transformations modify your data as it flows through the pipeline. You can chain
            multiple transformations together, and they execute in order from top to bottom.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Interactive Transformation Builder</h2>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Transformation Steps</h3>
              <Button onClick={addTransform} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Transform
              </Button>
            </div>

            <div className="space-y-3">
              {transforms.map((transform, index) => (
                <Card key={transform.id} className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="primary">{index + 1}</Badge>
                      <RefreshCw className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold">{transform.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === transforms.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTransform(transform.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {transforms.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No transformations added. Click &quot;Add Transform&quot; to get started.
              </p>
            )}
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Common Transformation Types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-2">Field Mapping</h3>
              <p className="text-sm text-gray-600 mb-3">
                Rename, combine, or restructure fields from source to destination schema.
              </p>
              <CodeBlock language="json" code={`{
  "type": "field_mapping",
  "config": {
    "first_name": "firstName",
    "last_name": "lastName",
    "email_addr": "email"
  }
}`} />
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-2">Data Validation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ensure data quality by validating types, formats, and ranges.
              </p>
              <CodeBlock language="json" code={`{
  "type": "validation",
  "config": {
    "rules": [
      {"field": "email", "type": "email"},
      {"field": "age", "min": 0, "max": 120}
    ]
  }
}`} />
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-2">Filtering</h3>
              <p className="text-sm text-gray-600 mb-3">
                Remove records that don&apos;t meet specific criteria.
              </p>
              <CodeBlock language="json" code={`{
  "type": "filter",
  "config": {
    "condition": "status == 'active'",
    "action": "include"
  }
}`} />
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-2">Custom Functions</h3>
              <p className="text-sm text-gray-600 mb-3">
                Apply custom Python code for complex transformations.
              </p>
              <CodeBlock language="python" code={`def transform(row):
    row['full_name'] = f"{row['first']} {row['last']}"
    row['email'] = row['email'].lower()
    return row`} />
            </Card>
          </div>
        </section>

        <section>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2">=¡ Transformation Order Matters</h3>
            <p className="text-sm text-gray-700">
              Transformations execute sequentially from top to bottom. Make sure to order them
              logically. For example, validate data types before applying filters that depend on
              those types, and map fields before using them in custom functions.
            </p>
          </Card>
        </section>

        <NavigationButtons
          previousUrl="/modules/4/lesson-3"
          nextUrl="/modules/4/lesson-5"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
