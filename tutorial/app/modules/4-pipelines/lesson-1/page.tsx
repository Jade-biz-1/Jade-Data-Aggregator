'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import CodeBlock from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Workflow, Database, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react';

export default function Lesson1Page() {
  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-1', 100);
  };

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.1: Pipeline Architecture"
      lessonId="module-4-lesson-1"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">What is a Data Pipeline?</h2>
          <p className="text-gray-700 mb-4">
            A data pipeline is an automated workflow that moves data from one or more sources,
            transforms it as needed, and loads it into a destination. Think of it as an assembly
            line for your data.
          </p>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Workflow className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-lg">Pipeline Flow</h3>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold">Source</p>
                <p className="text-sm text-gray-600">CSV, API, Database</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-400" />
              <div className="text-center flex-1">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-semibold">Transform</p>
                <p className="text-sm text-gray-600">Clean, Map, Validate</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-400" />
              <div className="text-center flex-1">
                <Database className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Destination</p>
                <p className="text-sm text-gray-600">Database, Data Warehouse</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Core Components</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="mt-1">1</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Source Connector</h3>
                  <p className="text-sm text-gray-600">
                    Extracts data from the origin system. Can be a file, API, database, or stream.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="mt-1">2</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Transformations</h3>
                  <p className="text-sm text-gray-600">
                    Processes data through mapping, validation, filtering, and enrichment steps.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="mt-1">3</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Destination Connector</h3>
                  <p className="text-sm text-gray-600">
                    Loads transformed data into the target system for storage or analysis.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Badge variant="primary" className="mt-1">4</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Scheduling & Monitoring</h3>
                  <p className="text-sm text-gray-600">
                    Controls when pipelines run and tracks their execution status and health.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Pipeline Configuration Example</h2>
          <CodeBlock language="json" code={`{
  "name": "Sales Data Pipeline",
  "description": "Import daily sales from CSV to PostgreSQL",
  "source": {
    "type": "csv",
    "connector_id": "csv_sales_source",
    "config": {
      "file_path": "/data/sales/daily_sales.csv",
      "delimiter": ",",
      "has_header": true
    }
  },
  "transformations": [
    {
      "type": "field_mapping",
      "config": {
        "sale_date": "date",
        "product_id": "product",
        "amount": "total_amount"
      }
    },
    {
      "type": "validation",
      "config": {
        "rules": [
          {"field": "total_amount", "type": "number", "min": 0}
        ]
      }
    }
  ],
  "destination": {
    "type": "database",
    "connector_id": "postgres_warehouse",
    "config": {
      "table": "sales_transactions",
      "write_mode": "append"
    }
  },
  "schedule": {
    "type": "cron",
    "expression": "0 2 * * *",
    "timezone": "UTC"
  }
}`} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Key Takeaways</h2>
          <div className="space-y-2">
            {[
              'Pipelines automate the ETL (Extract, Transform, Load) process',
              'Each pipeline has a source, transformations, and a destination',
              'Pipelines can run on schedules or be triggered manually',
              'Monitoring helps ensure data quality and pipeline reliability'
            ].map((point, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines"
          nextHref="/modules/4-pipelines/lesson-2"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
