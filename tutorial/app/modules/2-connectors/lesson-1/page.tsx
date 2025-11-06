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
  Database,
  FileJson,
  Globe,
  HardDrive,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  TrendingUp,
  Code
} from 'lucide-react';

type ConnectorType = 'csv' | 'json' | 'api' | 'database';

export default function Lesson2_1Page() {
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType>('csv');

  const handleComplete = () => {
    progressTracker.startLesson('module-2-lesson-1', 'module-2');
    progressTracker.completeLesson('module-2-lesson-1', 100);
  };

  const connectorTypes = [
    {
      id: 'csv' as ConnectorType,
      name: 'CSV Connector',
      icon: <HardDrive className="w-8 h-8" />,
      color: 'bg-blue-500',
      description: 'Connect to comma-separated value files for structured tabular data',
      useCases: ['Spreadsheet exports', 'Data dumps', 'Log files', 'Legacy system data'],
      pros: ['Simple format', 'Widely supported', 'Human readable', 'Easy to create'],
      cons: ['Limited data types', 'No nested structures', 'Encoding issues', 'Large file size'],
      configOptions: ['File path', 'Delimiter', 'Header row', 'Encoding'],
    },
    {
      id: 'json' as ConnectorType,
      name: 'JSON Connector',
      icon: <FileJson className="w-8 h-8" />,
      color: 'bg-green-500',
      description: 'Connect to JSON files for hierarchical and nested data structures',
      useCases: ['API responses', 'Configuration files', 'NoSQL exports', 'Modern data formats'],
      pros: ['Nested structures', 'Multiple data types', 'Widely used', 'Schema flexible'],
      cons: ['Larger file size', 'Parsing overhead', 'No schema validation', 'Complex nesting'],
      configOptions: ['File path', 'Root path', 'Array handling', 'Schema detection'],
    },
    {
      id: 'api' as ConnectorType,
      name: 'REST API Connector',
      icon: <Globe className="w-8 h-8" />,
      color: 'bg-purple-500',
      description: 'Connect to REST APIs for real-time data from web services',
      useCases: ['SaaS integrations', 'Real-time data', 'Third-party services', 'Microservices'],
      pros: ['Real-time data', 'Standardized', 'Scalable', 'Wide adoption'],
      cons: ['Rate limits', 'Authentication complexity', 'Version changes', 'Network dependent'],
      configOptions: ['Base URL', 'Endpoints', 'Authentication', 'Headers', 'Pagination'],
    },
    {
      id: 'database' as ConnectorType,
      name: 'Database Connector',
      icon: <Database className="w-8 h-8" />,
      color: 'bg-orange-500',
      description: 'Connect to relational databases for querying structured data',
      useCases: ['Production databases', 'Data warehouses', 'OLTP systems', 'Analytics databases'],
      pros: ['ACID compliance', 'Optimized queries', 'Relationships', 'Mature technology'],
      cons: ['Complex setup', 'Performance impact', 'Schema rigid', 'Connection management'],
      configOptions: ['Connection string', 'Credentials', 'Database/schema', 'Query timeout'],
    },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'CSV Connector', isCorrect: false },
    { id: '2', text: 'JSON Connector', isCorrect: false },
    { id: '3', text: 'REST API Connector', isCorrect: true },
    { id: '4', text: 'Database Connector', isCorrect: false },
  ];

  const selectedType = connectorTypes.find(c => c.id === selectedConnector);

  return (
    <LessonLayout
      title="Connector Types Overview"
      description="Explore the different types of data connectors and learn when to use each one"
      module="Module 2: Data Connectors"
      lessonNumber={1}
      estimatedTime="15 min"
      difficulty="intermediate"
      objectives={[
        'Understand the 4 main connector types available in the platform',
        'Learn the use cases and benefits of each connector type',
        'Compare connector features and limitations',
        'Choose the right connector for your data source',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What are Data Connectors?</h2>
          <p className="text-gray-700 mb-4">
            Data connectors are the bridge between your data sources and the Data Aggregator Platform.
            They handle the complexities of accessing, reading, and understanding different data formats
            and protocols, so you can focus on transforming and using your data.
          </p>
          <Alert variant="info">
            <strong>Key Concept:</strong> Connectors are responsible for data ingestion - they bring
            data into the platform. Once connected, you can apply transformations and build pipelines
            to process your data.
          </Alert>
        </section>

        {/* The 4 Connector Types */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The 4 Connector Types</h2>
          <p className="text-gray-700 mb-6">
            The platform supports 4 main connector types, each designed for different data sources:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectorTypes.map((connector) => (
              <Card
                key={connector.id}
                className={`p-5 transition-all cursor-pointer ${
                  selectedConnector === connector.id
                    ? 'ring-2 ring-primary-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedConnector(connector.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 ${connector.color} rounded-xl flex items-center justify-center text-white`}>
                    {connector.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{connector.name}</h4>
                    <Badge variant={selectedConnector === connector.id ? 'default' : 'outline'}>
                      {selectedConnector === connector.id ? 'Selected' : 'Click to view'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{connector.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Selected Connector Details */}
        {selectedType && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedType.name} Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-5 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Advantages</h4>
                </div>
                <ul className="space-y-2">
                  {selectedType.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 font-bold">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5 bg-red-50 border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Limitations</h4>
                </div>
                <ul className="space-y-2">
                  {selectedType.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 font-bold">-</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="p-5 bg-blue-50 border-blue-200 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">Common Use Cases</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedType.useCases.map((useCase, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-blue-800">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span>{useCase}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 bg-purple-50 border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Configuration Options</h4>
              <div className="flex flex-wrap gap-2">
                {selectedType.configOptions.map((option, idx) => (
                  <Badge key={idx} variant="default">{option}</Badge>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Connector Comparison Table */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connector Comparison Table</h2>
          <p className="text-gray-700 mb-4">
            Use this table to compare connector features and choose the right one for your needs:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 border-b">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">CSV</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">JSON</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">REST API</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 border-b">Database</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Real-time Data</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Nested Data</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Easy Setup</td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Schema Validation</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Query Support</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center text-gray-500">Partial</td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Large Data Volumes</td>
                  <td className="px-4 py-3 text-center text-gray-500">Moderate</td>
                  <td className="px-4 py-3 text-center text-gray-500">Moderate</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">Authentication</td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Code Example */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating Connectors Programmatically</h2>
          <p className="text-gray-700 mb-4">
            Here's how you can create each connector type using the platform's API:
          </p>

          <CodeBlock
            code={`// Example: Creating different connector types

// 1. CSV Connector
const csvConnector = await apiClient.createConnector({
  name: "Sales Data CSV",
  connector_type: "csv",
  config: {
    file_path: "/data/sales.csv",
    delimiter: ",",
    has_header: true,
    encoding: "utf-8"
  }
});

// 2. JSON Connector
const jsonConnector = await apiClient.createConnector({
  name: "User Data JSON",
  connector_type: "json",
  config: {
    file_path: "/data/users.json",
    root_path: "$.data",
    array_handling: "flatten"
  }
});

// 3. REST API Connector
const apiConnector = await apiClient.createConnector({
  name: "GitHub API",
  connector_type: "rest_api",
  config: {
    base_url: "https://api.github.com",
    endpoints: ["/repos/:owner/:repo"],
    auth_type: "bearer_token",
    headers: {
      "Accept": "application/vnd.github.v3+json"
    }
  }
});

// 4. Database Connector
const dbConnector = await apiClient.createConnector({
  name: "Production PostgreSQL",
  connector_type: "database",
  config: {
    connection_string: "postgresql://user:pass@localhost:5432/mydb",
    database: "production",
    query_timeout: 30
  }
});`}
            language="typescript"
            title="Connector Creation Examples"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Decision Guide */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Choosing the Right Connector</h2>
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4">Decision Guide</h3>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Use CSV</strong> when: You have simple tabular data, spreadsheet exports, or
                  legacy system dumps where simplicity is key.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Code className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Use JSON</strong> when: You need nested data structures, modern API responses,
                  or configuration files with complex hierarchies.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Use REST API</strong> when: You need real-time data, SaaS integrations, or
                  access to third-party web services.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Use Database</strong> when: You have production databases, need complex
                  queries, or require ACID compliance and relationships.
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="Which connector type is BEST for accessing real-time data from a third-party SaaS application?"
            options={quizOptions}
            explanation="REST API connectors are ideal for SaaS integrations because they provide real-time access to web services through standardized HTTP endpoints. They support authentication, handle pagination, and can work with any service that exposes a REST API. While databases can provide real-time data, they're typically not used for third-party SaaS integrations."
            hint="Think about how modern cloud applications typically expose their data."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>The platform supports 4 connector types: CSV, JSON, REST API, and Database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Each connector type has specific strengths and is suited for different use cases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>File connectors (CSV, JSON) are simple but limited; API and Database connectors offer more features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Choose your connector based on data source, structure, volume, and real-time requirements</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/2-connectors/lesson-2"
          nextLabel="Next: Create Database Connector"
          previousUrl="/modules/2-connectors"
          previousLabel="Back to Module Overview"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
