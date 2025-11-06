'use client';

import React, { useState } from 'react';
import { LessonLayout } from '@/components/tutorial/LessonLayout';
import { NavigationButtons } from '@/components/tutorial/NavigationButtons';
import { CodeBlock } from '@/components/tutorial/CodeBlock';
import { InteractiveDemo } from '@/components/tutorial/InteractiveDemo';
import { QuizQuestion, QuizOption } from '@/components/tutorial/QuizQuestion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { progressTracker } from '@/lib/progress';
import {
  Search,
  Table,
  Key,
  Type,
  CheckCircle,
  FileText,
  Database,
  Layers,
  Eye
} from 'lucide-react';

type DataType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';

interface Column {
  name: string;
  type: DataType;
  nullable: boolean;
  primary_key: boolean;
  foreign_key?: string;
}

interface TableSchema {
  name: string;
  columns: Column[];
  row_count: number;
}

export default function Lesson2_4Page() {
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [showSchema, setShowSchema] = useState(false);

  const handleComplete = () => {
    progressTracker.startLesson('module-2-lesson-4', 'module-2');
    progressTracker.completeLesson('module-2-lesson-4', 100);
  };

  const schemas: Record<string, TableSchema> = {
    users: {
      name: 'users',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary_key: true },
        { name: 'email', type: 'string', nullable: false, primary_key: false },
        { name: 'username', type: 'string', nullable: false, primary_key: false },
        { name: 'created_at', type: 'datetime', nullable: false, primary_key: false },
        { name: 'is_active', type: 'boolean', nullable: false, primary_key: false },
        { name: 'last_login', type: 'datetime', nullable: true, primary_key: false },
      ],
      row_count: 1247,
    },
    orders: {
      name: 'orders',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary_key: true },
        { name: 'user_id', type: 'integer', nullable: false, primary_key: false, foreign_key: 'users.id' },
        { name: 'order_number', type: 'string', nullable: false, primary_key: false },
        { name: 'total_amount', type: 'float', nullable: false, primary_key: false },
        { name: 'status', type: 'string', nullable: false, primary_key: false },
        { name: 'created_at', type: 'datetime', nullable: false, primary_key: false },
      ],
      row_count: 3421,
    },
    products: {
      name: 'products',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary_key: true },
        { name: 'sku', type: 'string', nullable: false, primary_key: false },
        { name: 'name', type: 'string', nullable: false, primary_key: false },
        { name: 'price', type: 'float', nullable: false, primary_key: false },
        { name: 'in_stock', type: 'boolean', nullable: false, primary_key: false },
        { name: 'category', type: 'string', nullable: true, primary_key: false },
      ],
      row_count: 892,
    },
  };

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'To make the database run faster', isCorrect: false },
    { id: '2', text: 'To automatically detect table structures, columns, and data types', isCorrect: true },
    { id: '3', text: 'To create new tables in the database', isCorrect: false },
    { id: '4', text: 'To delete unused columns', isCorrect: false },
  ];

  const selectedSchema = schemas[selectedTable];

  return (
    <LessonLayout
      title="Schema Introspection"
      description="Learn how to automatically discover and analyze data schemas from your sources"
      module="Module 2: Data Connectors"
      lessonNumber={4}
      estimatedTime="18 min"
      difficulty="intermediate"
      objectives={[
        'Understand what schema introspection is and why it\'s useful',
        'Learn how to introspect database schemas automatically',
        'Discover tables, columns, data types, and relationships',
        'Use schema information in transformations and pipelines',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Schema Introspection?</h2>
          <p className="text-gray-700 mb-4">
            Schema introspection is the process of automatically discovering the structure of your
            data sources. Instead of manually documenting table names, columns, and data types, the
            platform can analyze your database and extract this information automatically.
          </p>
          <Alert variant="info">
            <strong>Why This Matters:</strong> Schema introspection saves time, prevents errors from
            manual documentation, and ensures your pipelines always work with the current database
            structure.
          </Alert>
        </section>

        {/* What Gets Discovered */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Schema Introspection Discovers</h2>
          <p className="text-gray-700 mb-6">
            When you introspect a connector, the platform automatically detects:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Table className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Tables & Views</h4>
              </div>
              <p className="text-sm text-gray-600">
                All tables and views in the database, including their names, schemas, and row counts
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Columns</h4>
              </div>
              <p className="text-sm text-gray-600">
                Column names, positions, and whether they allow NULL values
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Type className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Data Types</h4>
              </div>
              <p className="text-sm text-gray-600">
                Native data types (INTEGER, VARCHAR, etc.) mapped to platform types
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Keys & Constraints</h4>
              </div>
              <p className="text-sm text-gray-600">
                Primary keys, foreign keys, unique constraints, and indexes
              </p>
            </Card>
          </div>
        </section>

        {/* Interactive Schema Explorer */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Schema Explorer</h2>
          <p className="text-gray-700 mb-4">
            Explore a sample database schema to see what information introspection provides:
          </p>

          <InteractiveDemo
            title="Database Schema Inspector"
            description="View discovered schema information"
            code={`// Introspect connector schema
const introspectSchema = async (connectorId) => {
  const schema = await apiClient.introspectConnectorSchema(connectorId);

  console.log("Discovered tables:", schema.tables.length);

  schema.tables.forEach(table => {
    console.log(\`\\nTable: \${table.name}\`);
    console.log(\`Rows: \${table.row_count}\`);
    console.log("Columns:", table.columns.map(c => \`\${c.name} (\${c.type})\`));
  });

  return schema;
};`}
            language="typescript"
            instructions="Select a table to view its schema details"
          >
            <Card className="p-6">
              <div className="space-y-4">
                {/* Table Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Table
                  </label>
                  <div className="flex gap-2">
                    {Object.keys(schemas).map((tableName) => (
                      <Button
                        key={tableName}
                        variant={selectedTable === tableName ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedTable(tableName);
                          setShowSchema(true);
                        }}
                      >
                        <Table className="w-4 h-4 mr-2" />
                        {tableName}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Schema Display */}
                {showSchema && selectedSchema && (
                  <div className="space-y-4">
                    {/* Table Info */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Table: {selectedSchema.name}</h4>
                        <Badge variant="info">{selectedSchema.row_count.toLocaleString()} rows</Badge>
                      </div>
                    </div>

                    {/* Columns Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 border-b">Column</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 border-b">Type</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-900 border-b">Nullable</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-900 border-b">Key</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-900 border-b">Foreign Key</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSchema.columns.map((column, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 font-mono text-gray-900">{column.name}</td>
                              <td className="px-4 py-2">
                                <Badge variant="default">{column.type}</Badge>
                              </td>
                              <td className="px-4 py-2 text-center">
                                {column.nullable ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {column.primary_key && (
                                  <Badge variant="warning">PK</Badge>
                                )}
                              </td>
                              <td className="px-4 py-2 font-mono text-sm text-gray-600">
                                {column.foreign_key || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Alert variant="success">
                      <strong>Schema Discovered!</strong> The platform automatically detected {selectedSchema.columns.length} columns
                      with their data types, constraints, and relationships.
                    </Alert>
                  </div>
                )}
              </div>
            </Card>
          </InteractiveDemo>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How Schema Introspection Works</h2>
          <p className="text-gray-700 mb-4">
            Different connector types use different methods to discover schema information:
          </p>

          <div className="space-y-3">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Database Connectors</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Query information_schema or system catalog tables to get metadata:
                  </p>
                  <code className="text-xs bg-gray-50 p-2 block rounded font-mono">
                    SELECT * FROM information_schema.columns WHERE table_name = &apos;users&apos;;
                  </code>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">File Connectors (CSV/JSON)</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Sample the first N rows to infer data types and detect column names:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read header row for column names</li>
                    <li>• Sample 100-1000 rows for type inference</li>
                    <li>• Detect date formats, numeric types, booleans</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Search className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">API Connectors</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Analyze API response structure and field types:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Parse OpenAPI/Swagger specifications if available</li>
                    <li>• Sample API responses to infer schema</li>
                    <li>• Detect nested objects and arrays</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Code Examples */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Using Schema Information</h2>
          <p className="text-gray-700 mb-4">
            Once you&apos;ve introspected a schema, you can use that information in your code:
          </p>

          <CodeBlock
            code={`// Get connector schema
const schema = await apiClient.introspectConnectorSchema('connector-123');

// List all tables
console.log("Available tables:");
schema.tables.forEach(table => {
  console.log(\`  - \${table.name} (\${table.row_count} rows)\`);
});

// Find a specific table
const usersTable = schema.tables.find(t => t.name === 'users');

// Get column information
const emailColumn = usersTable.columns.find(c => c.name === 'email');
console.log("Email column:", {
  type: emailColumn.type,
  nullable: emailColumn.nullable
});

// Find all primary keys
const primaryKeys = usersTable.columns
  .filter(c => c.primary_key)
  .map(c => c.name);
console.log("Primary keys:", primaryKeys);

// Find all foreign key relationships
const foreignKeys = schema.tables.flatMap(table =>
  table.columns
    .filter(c => c.foreign_key)
    .map(c => ({
      from: \`\${table.name}.\${c.name}\`,
      to: c.foreign_key
    }))
);
console.log("Relationships:", foreignKeys);

// Generate a transformation based on schema
const createTransformationFromSchema = (sourceTable) => {
  const mapping = {};

  sourceTable.columns.forEach(col => {
    // Map database types to transformation logic
    if (col.type === 'datetime') {
      mapping[col.name] = \`parse_datetime(row['\${col.name}'])\`;
    } else if (col.type === 'integer') {
      mapping[col.name] = \`int(row['\${col.name}'])\`;
    } else {
      mapping[col.name] = \`str(row['\${col.name}'])\`;
    }
  });

  return {
    name: \`Transform \${sourceTable.name}\`,
    field_mapping: mapping
  };
};`}
            language="typescript"
            title="Working with Schema Information"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Practices</h2>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Introspect After Connection:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Always introspect the schema immediately after creating and testing a connector.
                    This gives you the current structure to work with.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Re-introspect When Schema Changes:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    If the source database schema changes (new tables, columns, or types), re-run
                    introspection to update your connector&apos;s schema cache.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Use Schema in Transformations:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Leverage discovered data types to create accurate transformations. For example,
                    knowing a field is datetime helps you apply proper date parsing.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Document Schema Changes:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Keep track of schema versions and changes, especially in production. This helps
                    debug issues when source structures change unexpectedly.
                  </p>
                </div>
              </li>
            </ul>
          </Card>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits of Schema Introspection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">⏱️ Time Savings</h4>
              <p className="text-sm text-green-800">
                No need to manually document table structures. Introspection discovers everything
                automatically in seconds.
              </p>
            </Card>

            <Card className="p-5 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">✓ Accuracy</h4>
              <p className="text-sm text-green-800">
                Eliminates manual documentation errors. The schema always reflects the actual
                database structure.
              </p>
            </Card>

            <Card className="p-5 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🔄 Always Up-to-Date</h4>
              <p className="text-sm text-green-800">
                Re-introspection ensures your connector understands the latest schema changes
                automatically.
              </p>
            </Card>

            <Card className="p-5 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🚀 Faster Development</h4>
              <p className="text-sm text-green-800">
                Build transformations and pipelines faster by leveraging auto-discovered schema
                information.
              </p>
            </Card>
          </div>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="What is the primary purpose of schema introspection?"
            options={quizOptions}
            explanation="Schema introspection automatically detects and documents the structure of your data sources, including tables, columns, data types, keys, and relationships. This saves time compared to manual documentation, ensures accuracy, and helps you build transformations that correctly handle different data types. It's a discovery process, not a modification - it reads schema information but doesn't change the database."
            hint="Think about what 'introspection' means - looking inside to understand structure."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Schema introspection automatically discovers tables, columns, types, and relationships</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Different connector types use different introspection methods (queries vs. sampling)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Use schema information to build accurate transformations and pipelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Re-introspect when source schemas change to keep your connector up-to-date</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/2/exercise"
          nextLabel="Next: Exercise - Create REST API Connector"
          previousUrl="/modules/2/lesson-3"
          previousLabel="Back: Test Connection"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
