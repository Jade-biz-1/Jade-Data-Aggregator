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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  Bug,
  Shield,
  Clock,
  Network
} from 'lucide-react';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';
type ErrorType = 'auth' | 'network' | 'timeout' | 'ssl' | 'database' | null;

export default function Lesson2_3Page() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [testDuration, setTestDuration] = useState(0);

  const handleComplete = () => {
    progressTracker.startLesson('module-2-lesson-3', 'module-2');
    progressTracker.completeLesson('module-2-lesson-3', 100);
  };

  const simulateConnectionTest = (shouldFail: boolean = false, failureType: ErrorType = 'network') => {
    setConnectionStatus('testing');
    setErrorType(null);
    setTestDuration(0);

    const startTime = Date.now();
    const duration = shouldFail ? 2000 : 1500;

    const interval = setInterval(() => {
      setTestDuration(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (shouldFail) {
        setConnectionStatus('error');
        setErrorType(failureType);
      } else {
        setConnectionStatus('success');
      }
      setTestDuration(duration / 1000);
    }, duration);
  };

  const errors = [
    {
      type: 'auth' as ErrorType,
      name: 'Authentication Failed',
      icon: <Shield className="w-5 h-5" />,
      message: 'FATAL: password authentication failed for user "dbuser"',
      causes: [
        'Incorrect username or password',
        'User does not exist in database',
        'Password has expired',
        'Authentication method not supported'
      ],
      solutions: [
        'Verify username and password are correct',
        'Check if user exists: SELECT * FROM pg_user WHERE usename = \'dbuser\'',
        'Reset password if needed',
        'Check pg_hba.conf for allowed authentication methods'
      ]
    },
    {
      type: 'network' as ErrorType,
      name: 'Connection Refused',
      icon: <WifiOff className="w-5 h-5" />,
      message: 'could not connect to server: Connection refused',
      causes: [
        'Database server is not running',
        'Wrong host or port',
        'Firewall blocking the connection',
        'Server not accepting TCP/IP connections'
      ],
      solutions: [
        'Verify database server is running',
        'Check host and port are correct',
        'Configure firewall to allow connections',
        'Enable listen_addresses in postgresql.conf'
      ]
    },
    {
      type: 'timeout' as ErrorType,
      name: 'Connection Timeout',
      icon: <Clock className="w-5 h-5" />,
      message: 'timeout expired',
      causes: [
        'Network latency too high',
        'Server is overloaded',
        'Connection timeout too short',
        'Network routing issues'
      ],
      solutions: [
        'Increase connect_timeout setting',
        'Check network latency with ping',
        'Verify server is responsive',
        'Check network routing and DNS'
      ]
    },
    {
      type: 'ssl' as ErrorType,
      name: 'SSL/TLS Error',
      icon: <Shield className="w-5 h-5" />,
      message: 'SSL connection failed: certificate verify failed',
      causes: [
        'SSL certificate expired or invalid',
        'Certificate hostname mismatch',
        'Missing CA certificate',
        'SSL not enabled on server'
      ],
      solutions: [
        'Verify SSL certificate is valid',
        'Check certificate hostname matches',
        'Provide correct CA certificate path',
        'Use ssl_mode=require instead of verify-full for testing'
      ]
    },
    {
      type: 'database' as ErrorType,
      name: 'Database Not Found',
      icon: <AlertTriangle className="w-5 h-5" />,
      message: 'FATAL: database "mydb" does not exist',
      causes: [
        'Database name is incorrect',
        'Database has been dropped',
        'Wrong database server',
        'User lacks access to database'
      ],
      solutions: [
        'Verify database name is correct',
        'List available databases: \\l in psql',
        'Create database if needed',
        'Grant user access to database'
      ]
    },
  ];

  const quizOptions: QuizOption[] = [
    { id: '1', text: 'Only when creating a new connector', isCorrect: false },
    { id: '2', text: 'Only when deployment to production', isCorrect: false },
    { id: '3', text: 'After configuration and before using in pipelines', isCorrect: true },
    { id: '4', text: 'Connection testing is optional', isCorrect: false },
  ];

  return (
    <LessonLayout
      title="Test Connection"
      description="Learn how to test connector connections and troubleshoot common connection errors"
      module="Module 2: Data Connectors"
      lessonNumber={3}
      estimatedTime="12 min"
      difficulty="intermediate"
      objectives={[
        'Understand the connection testing process',
        'Learn to interpret connection test results',
        'Troubleshoot common connection errors',
        'Debug connection issues systematically',
      ]}
    >
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Test Connections?</h2>
          <p className="text-gray-700 mb-4">
            Testing your connector configuration before using it in pipelines is crucial. Connection
            tests validate credentials, network connectivity, and server availability, helping you
            catch configuration errors early.
          </p>
          <Alert variant="info">
            <strong>Best Practice:</strong> Always test your connector immediately after creation
            and before adding it to a pipeline. This saves debugging time later.
          </Alert>
        </section>

        {/* Connection Test Process */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Connection Test Process</h2>
          <p className="text-gray-700 mb-6">
            When you test a connector, the platform performs these checks:
          </p>

          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Network Connectivity</h4>
                  <p className="text-sm text-gray-600">
                    Verifies the platform can reach the database server (host and port)
                  </p>
                </div>
                <Network className="w-5 h-5 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Authentication</h4>
                  <p className="text-sm text-gray-600">
                    Validates username and password credentials
                  </p>
                </div>
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Database Access</h4>
                  <p className="text-sm text-gray-600">
                    Confirms the specified database exists and is accessible
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Query Execution</h4>
                  <p className="text-sm text-gray-600">
                    Runs a simple test query to verify read permissions
                  </p>
                </div>
                <Bug className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>
        </section>

        {/* Interactive Connection Tester */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Connection Tester</h2>
          <p className="text-gray-700 mb-4">
            Try testing connections with different outcomes to see how the platform responds:
          </p>

          <InteractiveDemo
            title="Connection Test Simulator"
            description="Simulate different connection test scenarios"
            code={`// Test connector connection
const testConnection = async (connectorId) => {
  try {
    const result = await apiClient.testConnector(connectorId);

    if (result.success) {
      console.log("✓ Connection successful!");
      console.log("Response time:", result.response_time_ms, "ms");
      return result;
    }
  } catch (error) {
    console.error("✗ Connection failed:", error.message);
    throw error;
  }
};`}
            language="typescript"
            instructions="Click the buttons below to simulate different test scenarios"
          >
            <Card className="p-6">
              <div className="space-y-4">
                {/* Test Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    variant="primary"
                    onClick={() => simulateConnectionTest(false)}
                    disabled={connectionStatus === 'testing'}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Success
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => simulateConnectionTest(true, 'auth')}
                    disabled={connectionStatus === 'testing'}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Auth Error
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => simulateConnectionTest(true, 'network')}
                    disabled={connectionStatus === 'testing'}
                  >
                    <WifiOff className="w-4 h-4 mr-2" />
                    Network Error
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => simulateConnectionTest(true, 'timeout')}
                    disabled={connectionStatus === 'testing'}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Timeout
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => simulateConnectionTest(true, 'ssl')}
                    disabled={connectionStatus === 'testing'}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    SSL Error
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => simulateConnectionTest(true, 'database')}
                    disabled={connectionStatus === 'testing'}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    DB Error
                  </Button>
                </div>

                {/* Test Status */}
                {connectionStatus === 'testing' && (
                  <Alert variant="info">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <div>
                        <strong>Testing connection...</strong>
                        <p className="text-sm mt-1">
                          Elapsed time: {testDuration.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {connectionStatus === 'success' && (
                  <Alert variant="success">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5" />
                      <div>
                        <strong>Connection successful!</strong>
                        <p className="text-sm mt-1">
                          Connected to database in {testDuration.toFixed(2)}s
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {connectionStatus === 'error' && errorType && (
                  <Alert variant="danger">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Connection failed</strong>
                        <p className="text-sm mt-1">
                          {errors.find(e => e.type === errorType)?.message}
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
            </Card>
          </InteractiveDemo>
        </section>

        {/* Troubleshooting Guide */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting Common Errors</h2>
          <p className="text-gray-700 mb-6">
            Here&apos;s a comprehensive guide to diagnosing and fixing common connection errors:
          </p>

          <div className="space-y-4">
            {errors.map((error) => (
              <Card key={error.type} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                    {error.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{error.name}</h4>
                    <code className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {error.message}
                    </code>
                  </div>
                  <Badge variant="danger">Error</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Common Causes:</h5>
                    <ul className="space-y-1">
                      {error.causes.map((cause, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Solutions:</h5>
                    <ul className="space-y-1">
                      {error.solutions.map((solution, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing in Code</h2>
          <p className="text-gray-700 mb-4">
            Here&apos;s how to test connections programmatically and handle errors:
          </p>

          <CodeBlock
            code={`// Test connector with error handling
const testConnectorWithRetry = async (connectorId, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(\`Attempt \${attempt}/\${maxRetries}...\`);

      const result = await apiClient.testConnector(connectorId);

      if (result.success) {
        console.log("✓ Connection successful!");
        console.log("Details:", {
          response_time: result.response_time_ms + "ms",
          server_version: result.server_version,
          database: result.database_name
        });
        return result;
      }

    } catch (error) {
      console.error(\`✗ Attempt \${attempt} failed:\`, error.message);

      // Analyze error type
      if (error.code === 'AUTH_FAILED') {
        console.error("Authentication error - check credentials");
        break; // Don't retry auth errors
      } else if (error.code === 'TIMEOUT') {
        console.log("Timeout - retrying with increased timeout...");
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (error.code === 'CONNECTION_REFUSED') {
        console.error("Connection refused - check host and port");
        break; // Don't retry connection refused
      }

      if (attempt === maxRetries) {
        throw new Error(\`Failed after \${maxRetries} attempts\`);
      }
    }
  }
};

// Usage
try {
  await testConnectorWithRetry('connector-123');
} catch (error) {
  console.error("All connection attempts failed:", error);
}`}
            language="typescript"
            title="Connection Test with Retry Logic"
            showLineNumbers
            showCopyButton
          />
        </section>

        {/* Debugging Tips */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Debugging Tips</h2>
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4">Systematic Debugging Approach</h3>
            <ol className="space-y-3 text-blue-800">
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 min-w-6">1.</span>
                <div>
                  <strong>Check the basics first:</strong>
                  <p className="text-sm mt-1">
                    Verify host, port, database name, username, and password are all correct.
                    Typos are the most common cause of connection failures.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 min-w-6">2.</span>
                <div>
                  <strong>Test network connectivity:</strong>
                  <p className="text-sm mt-1">
                    Use <code>ping</code> and <code>telnet</code> to verify the server is reachable:
                    <code className="block mt-1 bg-blue-100 px-2 py-1 rounded">
                      telnet your-db-host.com 5432
                    </code>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 min-w-6">3.</span>
                <div>
                  <strong>Check server logs:</strong>
                  <p className="text-sm mt-1">
                    Database server logs often contain detailed error messages that explain
                    why connections are being rejected.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 min-w-6">4.</span>
                <div>
                  <strong>Test with a database client:</strong>
                  <p className="text-sm mt-1">
                    Try connecting with psql, mysql, or another database client using the same
                    credentials. If that fails, the issue is with the database, not the platform.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 min-w-6">5.</span>
                <div>
                  <strong>Enable verbose logging:</strong>
                  <p className="text-sm mt-1">
                    Turn on debug logging in the connector configuration to see detailed
                    connection attempt information.
                  </p>
                </div>
              </li>
            </ol>
          </Card>
        </section>

        {/* Knowledge Check */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Check</h2>
          <QuizQuestion
            question="When should you test a database connector connection?"
            options={quizOptions}
            explanation="You should always test connector connections after configuration and before using them in pipelines. This helps catch configuration errors, authentication issues, network problems, and other connection failures early - before they cause pipeline execution to fail. Testing immediately after creation is a best practice that saves debugging time later."
            hint="Think about when it's most valuable to catch configuration errors."
          />
        </section>

        {/* Key Takeaways */}
        <section>
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Key Takeaways</h3>
            <ul className="space-y-2 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Always test connections after creating or modifying connectors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Connection tests validate network, authentication, database access, and permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Common errors include authentication failures, network issues, and SSL problems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Use systematic debugging: check basics first, then network, then server logs</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Navigation Buttons */}
        <NavigationButtons
          nextUrl="/modules/2/lesson-4"
          nextLabel="Next: Schema Introspection"
          previousUrl="/modules/2/lesson-2"
          previousLabel="Back: Create Database Connector"
          onComplete={handleComplete}
        />
      </div>
    </LessonLayout>
  );
}
