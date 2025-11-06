'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LessonLayout from '@/components/tutorial/LessonLayout';
import NavigationButtons from '@/components/tutorial/NavigationButtons';
import CodeBlock from '@/components/tutorial/CodeBlock';
import { progressTracker } from '@/lib/progress';
import { Database, HardDrive, Cloud, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Lesson5Page() {
  const [writeMode, setWriteMode] = useState('append');

  const handleComplete = () => {
    progressTracker.completeLesson('module-4-lesson-5', 100);
  };

  const writeModes = [
    { id: 'append', label: 'Append', description: 'Add new records without removing existing data' },
    { id: 'replace', label: 'Replace', description: 'Clear table and insert fresh data' },
    { id: 'upsert', label: 'Upsert', description: 'Update existing records or insert if not found' },
  ];

  return (
    <LessonLayout
      moduleTitle="Module 4: Data Pipelines"
      lessonTitle="Lesson 4.5: Destination Connector Setup"
      lessonId="module-4-lesson-5"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Configuring the Destination</h2>
          <p className="text-gray-700 mb-4">
            The destination connector determines where your transformed data lands. Proper
            configuration ensures data is written correctly and efficiently.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Destination Types</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5">
              <Database className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Database</h3>
              <p className="text-sm text-gray-600">
                PostgreSQL, MySQL, SQL Server - structured data storage with ACID guarantees.
              </p>
            </Card>

            <Card className="p-5">
              <Cloud className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Data Warehouse</h3>
              <p className="text-sm text-gray-600">
                Snowflake, BigQuery, Redshift - optimized for analytics and large-scale queries.
              </p>
            </Card>

            <Card className="p-5">
              <HardDrive className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">File Storage</h3>
              <p className="text-sm text-gray-600">
                CSV, JSON, Parquet - export to files for sharing or archival purposes.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Write Modes</h2>
          <div className="space-y-3 mb-4">
            {writeModes.map(mode => (
              <Card
                key={mode.id}
                className={`p-4 cursor-pointer transition-all ${
                  writeMode === mode.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setWriteMode(mode.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{mode.label}</h3>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                  {writeMode === mode.id && (
                    <Badge variant="success">Selected</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {writeMode === 'append' && (
            <CodeBlock language="json" code={`{
  "destination": {
    "type": "database",
    "connector_id": "postgres_warehouse",
    "config": {
      "table": "sales_data",
      "write_mode": "append",
      "create_table_if_missing": true,
      "batch_size": 1000
    }
  }
}`} />
          )}

          {writeMode === 'replace' && (
            <div>
              <CodeBlock language="json" code={`{
  "destination": {
    "type": "database",
    "connector_id": "postgres_warehouse",
    "config": {
      "table": "daily_snapshot",
      "write_mode": "replace",
      "backup_before_replace": true
    }
  }
}`} />
              <Card className="p-4 bg-yellow-50 border-yellow-200 mt-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Replace mode deletes all existing data. Always enable backups for production tables.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {writeMode === 'upsert' && (
            <CodeBlock language="json" code={`{
  "destination": {
    "type": "database",
    "connector_id": "postgres_warehouse",
    "config": {
      "table": "customer_profiles",
      "write_mode": "upsert",
      "primary_key": ["customer_id"],
      "update_columns": ["email", "phone", "updated_at"]
    }
  }
}`} />
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Database Destination Example</h2>
          <CodeBlock language="json" code={`{
  "destination": {
    "type": "database",
    "connector_id": "postgres_analytics",
    "config": {
      "table": "orders",
      "write_mode": "append",
      "schema": "public",
      "create_table_if_missing": true,
      "table_schema": {
        "order_id": "INTEGER PRIMARY KEY",
        "customer_id": "INTEGER NOT NULL",
        "order_date": "TIMESTAMP",
        "total_amount": "DECIMAL(10,2)",
        "status": "VARCHAR(50)"
      },
      "indexes": [
        {"columns": ["customer_id"], "name": "idx_customer"},
        {"columns": ["order_date"], "name": "idx_date"}
      ],
      "batch_size": 1000,
      "on_error": "skip_row"
    }
  }
}`} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="space-y-2">
            {[
              'Use upsert mode for maintaining slowly changing dimensions',
              'Set appropriate batch sizes (500-5000) based on row complexity',
              'Create indexes on frequently queried columns',
              'Enable error handling to prevent pipeline failures',
              'Test with small datasets before full production runs'
            ].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        <NavigationButtons
          previousHref="/modules/4-pipelines/lesson-4"
          nextHref="/modules/4-pipelines/lesson-6"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
