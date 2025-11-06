'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Database, FileText, Globe, CheckCircle, AlertCircle } from 'lucide-react';

export default function Lesson3Page() {
  const [selectedType, setSelectedType] = useState('csv');

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-3', 100);
  };

  const sourceTypes = [
    { id: 'csv', label: 'CSV File', icon: FileText, color: 'text-blue-600' },
    { id: 'api', label: 'REST API', icon: Globe, color: 'text-purple-600' },
    { id: 'database', label: 'Database', icon: Database, color: 'text-green-600' },
  ];

  return (
    <LessonLayout
      title="Source Connector Configuration"
      description="Learn how to configure different types of source connectors for your data pipelines"
      module="Module 4: Data Pipelines"
      lessonNumber={3}
      estimatedTime="18 min"
      difficulty="intermediate"
      objectives={[
        'Configure CSV file connectors with proper settings',
        'Set up REST API connectors with authentication and pagination',
        'Configure database connectors with incremental loading',
        'Apply best practices for source connector configuration',
      ]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Configuring the Data Source</h2>
          <p className="text-gray-700 mb-4">
            The source connector is where your data journey begins. Proper configuration ensures
            reliable data extraction and smooth pipeline execution.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Source Type Selector</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {sourceTypes.map(type => (
              <Card
                key={type.id}
                className={`p-5 cursor-pointer transition-all ${
                  selectedType === type.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <type.icon className={`w-8 h-8 mb-3 ${type.color}`} />
                <h3 className="font-semibold">{type.label}</h3>
                {selectedType === type.id && (
                  <Badge variant="success" className="mt-2">Selected</Badge>
                )}
              </Card>
            ))}
          </div>

          {selectedType === 'csv' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">CSV File Configuration</h3>
              <CodeBlock language="json" code={`{
  "source": {
    "type": "csv",
    "connector_id": "sales_csv",
    "config": {
      "file_path": "/data/sales/daily_sales.csv",
      "delimiter": ",",
      "has_header": true,
      "encoding": "utf-8",
      "skip_rows": 0,
      "column_mapping": {
        "Date": "sale_date",
        "Product ID": "product_id",
        "Amount": "amount"
      }
    }
  }
}`} />
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm">Always verify delimiter and encoding settings</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm">Use column mapping to rename fields during import</p>
                </div>
              </div>
            </Card>
          )}

          {selectedType === 'api' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">REST API Configuration</h3>
              <CodeBlock language="json" code={`{
  "source": {
    "type": "rest_api",
    "connector_id": "customer_api",
    "config": {
      "url": "https://api.example.com/customers",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer \${API_TOKEN}",
        "Content-Type": "application/json"
      },
      "pagination": {
        "type": "offset",
        "limit": 100,
        "offset_param": "offset"
      },
      "rate_limit": {
        "requests_per_minute": 60
      }
    }
  }
}`} />
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm">Store API credentials securely using environment variables</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm">Configure pagination to handle large datasets</p>
                </div>
              </div>
            </Card>
          )}

          {selectedType === 'database' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Database Configuration</h3>
              <CodeBlock language="json" code={`{
  "source": {
    "type": "database",
    "connector_id": "postgres_prod",
    "config": {
      "query": "SELECT * FROM orders WHERE created_at > :last_run_time",
      "incremental": true,
      "incremental_field": "created_at",
      "batch_size": 1000,
      "parameters": {
        "last_run_time": "\${LAST_SUCCESSFUL_RUN}"
      }
    }
  }
}`} />
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm">Use incremental extraction to fetch only new/updated records</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm">Batch processing prevents memory issues with large tables</p>
                </div>
              </div>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Configuration Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-2"> Do</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Test connection before saving configuration</li>
                <li>Use incremental loads when possible</li>
                <li>Set appropriate batch sizes</li>
                <li>Document custom settings</li>
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-2">L Avoid</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Hardcoding credentials in configuration</li>
                <li>Loading entire large tables at once</li>
                <li>Ignoring rate limits for APIs</li>
                <li>Using SELECT * without filters</li>
              </ul>
            </Card>
          </div>
        </section>

        <NavigationButtons
          previousUrl="/modules/4/lesson-2"
          nextUrl="/modules/4/lesson-4"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
