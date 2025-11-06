'use client';

import React from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import Card from '@/components/ui/Card';
import { FileCode, CheckCircle } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Lesson5_4Page() {
  const handleComplete = () => { progressTracker.completeLesson('module-5-lesson-4', 100); };

  return (
    <LessonLayout title="Pipeline Templates" description="Create reusable pipeline templates for rapid development"
      module="Module 5" lessonNumber={4} estimatedTime="20 min" difficulty="intermediate"
      objectives={['Design reusable templates', 'Implement parameterization', 'Build template library', 'Apply best practices']}>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Why Pipeline Templates?</h2>
          <p className="text-gray-700 mb-4">
            Templates accelerate pipeline development, enforce standards, and reduce errors by codifying best practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Creating a Template</h2>
          <CodeBlock code={`# Define a parameterized pipeline template
template = {
    "name": "Database to Warehouse ETL",
    "description": "Extract from source DB, transform, load to warehouse",
    "parameters": [
        {
            "name": "source_connection",
            "type": "string",
            "required": True,
            "description": "Source database connection ID"
        },
        {
            "name": "target_connection",
            "type": "string",
            "required": True,
            "description": "Warehouse connection ID"
        },
        {
            "name": "transformation_script",
            "type": "string",
            "required": False,
            "default": "pass-through"
        }
    ],
    "steps": [
        {
            "type": "source",
            "connector": "{{source_connection}}",
            "query": "SELECT * FROM {{source_table}}"
        },
        {
            "type": "transformation",
            "script": "{{transformation_script}}"
        },
        {
            "type": "destination",
            "connector": "{{target_connection}}",
            "table": "{{target_table}}"
        }
    ]
}

# Save template
api.create_pipeline_template(template)`} language="python" showLineNumbers showCopyButton />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Using Templates</h2>
          <CodeBlock code={`# Create pipeline from template
pipeline = api.create_pipeline_from_template(
    template_id="db-to-warehouse-etl",
    name="Sales Data Pipeline",
    parameters={
        "source_connection": "postgres-prod",
        "source_table": "sales",
        "target_connection": "snowflake-warehouse",
        "target_table": "fact_sales",
        "transformation_script": "clean_and_aggregate"
    }
)

print(f"Pipeline created: {pipeline['id']}")`} language="python" showLineNumbers showCopyButton />
        </section>

        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Key Takeaways
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Use templates to standardize pipeline patterns</li>
            <li>• Parameterize for flexibility and reuse</li>
            <li>• Build a template library for common use cases</li>
            <li>• Version templates for safe evolution</li>
          </ul>
        </Card>

        <NavigationButtons previousUrl="/modules/5-advanced/lesson-3" previousLabel="Back: Error Handling"
          nextUrl="/modules/5-advanced/lesson-5" nextLabel="Next: Batch Operations" onComplete={handleComplete} />
      </div>
    </LessonLayout>
  );
}
