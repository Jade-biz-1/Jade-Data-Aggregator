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
import Input from '@/components/ui/Input';
import { progressTracker } from '@/lib/progress';
import {
  Database,
  Server,
  Lock,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Shield
} from 'lucide-react';

type DatabaseType = 'postgresql' | 'mysql' | 'mssql' | 'oracle';

export default function Lesson2_2Page() {
  const [selectedDB, setSelectedDB] = useState<DatabaseType>('postgresql');
  const [showPassword, setShowPassword] = useState(false);
  const [connectorName, setConnectorName] = useState('My Database Connector');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('mydb');
  const [username, setUsername] = useState('dbuser');
  const [password, setPassword] = useState('');

  const handleComplete = () => {
    progressTracker.startLesson('module-2-lesson-2', 'module-2');
    progressTracker.completeLesson('module-2-lesson-2', 100);
  };

  const databases = [
    {
      id: 'postgresql' as DatabaseType,
      name: 'PostgreSQL',
      icon: '🐘',
      defaultPort: '5432',
      connectionStringFormat: 'postgresql://username:password@host:port/database',
      example: 'postgresql://myuser:mypass@localhost:5432/mydb',
    },
    {
      id: 'mysql' as DatabaseType,
      name: 'MySQL',
      icon: '🐬',
      defaultPort: '3306',
      connectionStringFormat: 'mysql://username:password@host:port/database',
      example: 'mysql://myuser:mypass@localhost:3306/mydb',
    },
    {
      id: 'mssql' as DatabaseType,
      name: 'SQL Server',
      icon: '🗄️',
      defaultPort: '1433',
      connectionStringFormat: 'mssql://username:password@host:port/database',
      example: 'mssql://myuser:mypass@localhost:1433/mydb',
    },
    {
      id: 'oracle' as DatabaseType,
      name: 'Oracle',
      icon: '⭕',
      defaultPort: '1521',
      connectionStringFormat: 'oracle://username:password@host:port/service_name',
      example: 'oracle://myuser:mypass@localhost:1521/ORCL',
    },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'In the connector name field', isCorrect: false },
    { id: '2', text: 'As environment variables or secrets management', isCorrect: true },
    { id: '3', text: 'In plain text in the code', isCorrect: false },
    { id: '4', text: 'In the database itself', isCorrect: false },
  ];

  const selectedDatabase = databases.find(db => db.id === selectedDB);

  const generateConnectionString = () => {
    if (!selectedDatabase) return '';
    return `${selectedDB}://${username || 'username'}:${password || 'password'}@${host}:${port}/${database}`;
  };

  return (
    <LessonLayout
      title="Create Database Connector"
      description="Learn how to create and configure database connectors with proper connection strings"
      module="Module 2: Data Connectors"
      lessonNumber={2}
      estimatedTime="20 min"
      difficulty="intermediate"
      objectives={[
        'Understand database connector configuration',
        'Learn connection string formats for major databases',
        'Configure authentication and credentials securely',
        'Create a working database connector',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Connectors</h2>
          <p className="text-gray-700 mb-4">
            Database connectors allow you to connect to relational databases like PostgreSQL, MySQL,
            SQL Server, and Oracle. They provide powerful querying capabilities, schema introspection,
            and support for large data volumes.
          </p>
          <Alert variant="warning">
            <strong>Security Best Practice:</strong> Never hardcode database credentials in your code.
            Always use environment variables, secrets management, or the platform&apos;s secure credential storage.
          </Alert>
        </section>

        {/* Supported Databases */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Database Types</h2>
          <p className="text-gray-700 mb-6">
            The platform supports all major relational database systems:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databases.map((db) => (
              <Card
                key={db.id}
                className={`p-5 transition-all cursor-pointer ${
                  selectedDB === db.id
                    ? 'ring-2 ring-primary-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedDB(db.id);
                  setPort(db.defaultPort);
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{db.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{db.name}</h4>
                    <p className="text-sm text-gray-600">Default port: {db.defaultPort}</p>
                  </div>
                  <Badge variant={selectedDB === db.id ? 'default' : 'outline'}>
                    {selectedDB === db.id ? 'Selected' : 'Select'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Connection String Format */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection String Format</h2>
          <p className="text-gray-700 mb-4">
            Database connectors use connection strings to specify how to connect to your database.
            Here&apos;s the general format:
          </p>

          <Card className="p-6 bg-gray-50 border-gray-200 mb-6">
            <div className="font-mono text-sm mb-4 p-4 bg-white rounded border border-gray-300">
              <span className="text-blue-600">protocol</span>://
              <span className="text-green-600">username</span>:
              <span className="text-red-600">password</span>@
              <span className="text-purple-600">host</span>:
              <span className="text-orange-600">port</span>/
              <span className="text-indigo-600">database</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 w-24">protocol:</span>
                <span className="text-gray-700">Database type (postgresql, mysql, mssql, oracle)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600 w-24">username:</span>
                <span className="text-gray-700">Database user account</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-red-600 w-24">password:</span>
                <span className="text-gray-700">User password (URL-encoded if special characters)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-600 w-24">host:</span>
                <span className="text-gray-700">Server hostname or IP address</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-orange-600 w-24">port:</span>
                <span className="text-gray-700">Database server port number</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-indigo-600 w-24">database:</span>
                <span className="text-gray-700">Database or service name</span>
              </div>
            </div>
          </Card>

          {selectedDatabase && (
            <CodeBlock
              code={`# ${selectedDatabase.name} Connection String Format
${selectedDatabase.connectionStringFormat}

# Example
${selectedDatabase.example}

# With special characters in password (URL-encoded)
${selectedDB}://myuser:p%40ssw%24rd@localhost:${selectedDatabase.defaultPort}/mydb`}
              language="bash"
              title={`${selectedDatabase.name} Examples`}
              showCopyButton
            />
          )}
        </section>

        {/* Interactive Connector Builder */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Connector Builder</h2>
          <p className="text-gray-700 mb-4">
            Use this form to build your database connector configuration. The connection string
            will be generated automatically:
          </p>

          <InteractiveDemo
            title="Database Connector Configuration"
            description="Fill in your database details"
            code={`const createDatabaseConnector = async () => {
  const connector = await apiClient.createConnector({
    name: "${connectorName}",
    connector_type: "database",
    config: {
      connection_string: "${generateConnectionString()}",
      database: "${database}",
      query_timeout: 30,
      pool_size: 10
    }
  });
  return connector;
};`}
            language="typescript"
            instructions="Configure your database connection below"
          >
            <Card className="p-6">
              <div className="space-y-4">
                {/* Connector Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connector Name
                  </label>
                  <Input
                    value={connectorName}
                    onChange={(e) => setConnectorName(e.target.value)}
                    placeholder="e.g., Production Database"
                  />
                </div>

                {/* Database Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {databases.map((db) => (
                      <Button
                        key={db.id}
                        variant={selectedDB === db.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedDB(db.id);
                          setPort(db.defaultPort);
                        }}
                      >
                        {db.icon} {db.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Host */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host
                    </label>
                    <Input
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <Input
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder={selectedDatabase?.defaultPort}
                    />
                  </div>
                </div>

                {/* Database Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name
                  </label>
                  <Input
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="mydb"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dbuser"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Generated Connection String */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generated Connection String
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 font-mono text-sm p-3 bg-gray-50 border border-gray-300 rounded overflow-x-auto">
                      {generateConnectionString()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generateConnectionString())}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Info Alert */}
                <Alert variant="info">
                  <strong>Security Tip:</strong> In production, use environment variables like{' '}
                  <code className="bg-blue-100 px-1 rounded">DATABASE_URL</code> instead of
                  hardcoding credentials.
                </Alert>
              </div>
            </Card>
          </InteractiveDemo>
        </section>

        {/* Configuration Options */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Advanced Configuration</h2>
          <p className="text-gray-700 mb-4">
            Beyond the connection string, you can configure additional options:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-primary-600" />
                <h4 className="font-semibold text-gray-900">Connection Pooling</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Configure connection pool settings for better performance:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>pool_size:</strong> Max number of connections (default: 10)</li>
                <li>• <strong>max_overflow:</strong> Extra connections allowed (default: 5)</li>
                <li>• <strong>pool_timeout:</strong> Wait time for connection (seconds)</li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Timeouts</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Set timeout values to prevent long-running queries:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>query_timeout:</strong> Max query execution time</li>
                <li>• <strong>connect_timeout:</strong> Connection establishment timeout</li>
                <li>• <strong>idle_timeout:</strong> Idle connection timeout</li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">SSL/TLS</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Enable secure connections with SSL/TLS:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>ssl_mode:</strong> require, verify-ca, verify-full</li>
                <li>• <strong>ssl_cert:</strong> Path to client certificate</li>
                <li>• <strong>ssl_key:</strong> Path to private key</li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Schema Options</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Control schema and table access:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>schema:</strong> Default schema to use</li>
                <li>• <strong>tables:</strong> Specific tables to access</li>
                <li>• <strong>exclude_tables:</strong> Tables to ignore</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Code Example */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Configuration Example</h2>
          <p className="text-gray-700 mb-4">
            Here&apos;s a complete example with all configuration options:
          </p>

          <CodeBlock
            code={`// Complete database connector configuration
const createProductionConnector = async () => {
  const connector = await apiClient.createConnector({
    name: "Production PostgreSQL",
    connector_type: "database",
    description: "Primary production database",

    config: {
      // Connection
      connection_string: process.env.DATABASE_URL,
      database: "production",

      // Connection Pooling
      pool_size: 20,
      max_overflow: 10,
      pool_timeout: 30,

      // Timeouts
      query_timeout: 60,
      connect_timeout: 10,
      idle_timeout: 300,

      // SSL/TLS
      ssl_mode: "verify-full",
      ssl_cert: "/path/to/client-cert.pem",
      ssl_key: "/path/to/client-key.pem",
      ssl_ca: "/path/to/ca-cert.pem",

      // Schema
      schema: "public",
      tables: ["users", "orders", "products"],
      exclude_tables: ["audit_logs", "temp_*"],

      // Additional Options
      application_name: "data_aggregator",
      read_only: false,
      auto_commit: true
    }
  });

  console.log("Connector created:", connector.id);
  return connector;
};`}
            language="typescript"
            title="Production Database Connector"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Best Practices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Best Practices</h2>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Use Environment Variables:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Store connection strings in environment variables, not in code:
                    <code className="block mt-1 bg-yellow-100 p-2 rounded">
                      connection_string: process.env.DATABASE_URL
                    </code>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Principle of Least Privilege:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Create database users with only the permissions they need. Read-only for analytics,
                    limited write access for data ingestion.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Database className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Use SSL/TLS:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Always enable SSL/TLS for production databases, especially when connecting
                    over the internet. Use <code>ssl_mode: &quot;verify-full&quot;</code> for maximum security.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Server className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gray-900">Connection Pooling:</strong>
                  <p className="text-sm text-gray-700 mt-1">
                    Configure appropriate pool sizes to avoid overwhelming your database while
                    maintaining good performance. Monitor and adjust based on usage.
                  </p>
                </div>
              </li>
            </ul>
          </Card>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="What is the BEST way to store database credentials in a production environment?"
            options={quizOptions}
            explanation="Environment variables and secrets management systems are the best practice for storing credentials. This keeps sensitive information out of your codebase, allows different credentials per environment (dev/staging/production), and integrates with secret rotation and access control systems. Never hardcode credentials in your code or store them in version control."
            hint="Think about security best practices and keeping credentials separate from code."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Connection strings follow the format: protocol://username:password@host:port/database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Always use environment variables or secrets management for credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Configure connection pooling, timeouts, and SSL/TLS for production databases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Follow the principle of least privilege when creating database users</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/2/lesson-3"
          nextLabel="Next: Test Connection"
          previousUrl="/modules/2/lesson-1"
          previousLabel="Back: Connector Types Overview"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
