'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Progress from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { progressTracker } from '@/lib/progress';
import {
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  Target,
  Globe,
  Database,
  Settings,
  PlayCircle,
  AlertTriangle,
  Sparkles,
  Code
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  description: string;
  completed: boolean;
  points: number;
}

export default function Module2ExercisePage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // API Research Tasks
    {
      id: 'api-1',
      category: 'API Research',
      task: 'Choose a Public API',
      description: 'Select a public REST API to connect to (e.g., JSONPlaceholder, GitHub, OpenWeather)',
      completed: false,
      points: 10,
    },
    {
      id: 'api-2',
      category: 'API Research',
      task: 'Review API Documentation',
      description: 'Read the API documentation to understand endpoints, authentication, and data structure',
      completed: false,
      points: 10,
    },
    {
      id: 'api-3',
      category: 'API Research',
      task: 'Test API in Browser/Postman',
      description: 'Make a test request to verify the API works and returns expected data',
      completed: false,
      points: 15,
    },

    // Connector Configuration
    {
      id: 'config-1',
      category: 'Connector Configuration',
      task: 'Create REST API Connector',
      description: 'In the platform, create a new REST API connector with your chosen API',
      completed: false,
      points: 15,
    },
    {
      id: 'config-2',
      category: 'Connector Configuration',
      task: 'Configure Base URL',
      description: 'Set the base URL for your API (e.g., https://jsonplaceholder.typicode.com)',
      completed: false,
      points: 10,
    },
    {
      id: 'config-3',
      category: 'Connector Configuration',
      task: 'Add Endpoint Path',
      description: 'Specify at least one endpoint (e.g., /users or /posts)',
      completed: false,
      points: 10,
    },
    {
      id: 'config-4',
      category: 'Connector Configuration',
      task: 'Configure Authentication',
      description: 'Set up authentication if required (API key, Bearer token, or None for public APIs)',
      completed: false,
      points: 15,
    },
    {
      id: 'config-5',
      category: 'Connector Configuration',
      task: 'Add Custom Headers',
      description: 'Add any required headers (e.g., Accept: application/json, User-Agent)',
      completed: false,
      points: 10,
    },

    // Testing & Validation
    {
      id: 'test-1',
      category: 'Testing & Validation',
      task: 'Test API Connection',
      description: 'Use the platform\'s test function to verify the connector can reach the API',
      completed: false,
      points: 15,
    },
    {
      id: 'test-2',
      category: 'Testing & Validation',
      task: 'Verify Response Data',
      description: 'Check that the API returns valid JSON data with expected fields',
      completed: false,
      points: 10,
    },
    {
      id: 'test-3',
      category: 'Testing & Validation',
      task: 'Handle Errors Gracefully',
      description: 'Test error scenarios (invalid endpoint, authentication failure) and verify error messages',
      completed: false,
      points: 15,
    },

    // Schema Discovery
    {
      id: 'schema-1',
      category: 'Schema Discovery',
      task: 'Introspect API Schema',
      description: 'Run schema introspection to discover the structure of API responses',
      completed: false,
      points: 15,
    },
    {
      id: 'schema-2',
      category: 'Schema Discovery',
      task: 'Review Detected Fields',
      description: 'Examine all fields, their types, and nested structures discovered by introspection',
      completed: false,
      points: 10,
    },
    {
      id: 'schema-3',
      category: 'Schema Discovery',
      task: 'Document Data Types',
      description: 'Note the data types of key fields (strings, numbers, booleans, dates, arrays)',
      completed: false,
      points: 10,
    },
  ]);

  const [showHints, setShowHints] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com');
  const [endpoint, setEndpoint] = useState('/users');

  const totalPoints = checklist.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = checklist
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.points, 0);
  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);
  const completedCount = checklist.filter(item => item.completed).length;

  useEffect(() => {
    if (completedCount === checklist.length && !exerciseCompleted) {
      setExerciseCompleted(true);
      setCelebrationShown(true);
      progressTracker.completeLesson('module-2-exercise', 100);
      setTimeout(() => setCelebrationShown(false), 5000);
    }
  }, [completedCount, checklist.length, exerciseCompleted]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const resetExercise = () => {
    setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    setExerciseCompleted(false);
    setCelebrationShown(false);
  };

  const categories = Array.from(new Set(checklist.map(item => item.category)));

  const suggestedAPIs = [
    {
      name: 'JSONPlaceholder',
      url: 'https://jsonplaceholder.typicode.com',
      endpoints: ['/users', '/posts', '/comments'],
      auth: 'None',
      description: 'Fake REST API for testing and prototyping',
    },
    {
      name: 'GitHub API',
      url: 'https://api.github.com',
      endpoints: ['/users/:username', '/repos/:owner/:repo'],
      auth: 'Bearer Token (optional)',
      description: 'Access GitHub repositories, users, and issues',
    },
    {
      name: 'OpenWeather API',
      url: 'https://api.openweathermap.org/data/2.5',
      endpoints: ['/weather', '/forecast'],
      auth: 'API Key',
      description: 'Current weather and forecast data',
    },
    {
      name: 'REST Countries',
      url: 'https://restcountries.com/v3.1',
      endpoints: ['/all', '/name/:country'],
      auth: 'None',
      description: 'Information about countries worldwide',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/modules/2-connectors"
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Back to Module 2
          </Link>

          <div className="flex items-start justify-between gap-8 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="warning">Exercise</Badge>
                <Badge variant="info">Hands-on</Badge>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Exercise 2: Create a REST API Connector
              </h1>
              <p className="text-lg text-gray-600">
                Apply your knowledge of connectors by creating a complete REST API connector,
                testing it, and introspecting its schema. Choose from popular public APIs!
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Globe className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Banner */}
        {celebrationShown && (
          <Alert variant="success" className="mb-8 animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <strong className="text-lg">Congratulations! 🎉</strong>
                <p className="mt-1">
                  You've completed Module 2! You've earned your Data Connectors badge.
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Progress Overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Your Progress</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {checklist.length} tasks completed • {earnedPoints}/{totalPoints} points
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">{completionPercentage}%</div>
              {exerciseCompleted && (
                <Badge variant="success" className="mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete!
                </Badge>
              )}
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3" />

          <div className="mt-4 flex gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHints(!showHints)}
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </Button>
            {exerciseCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={resetExercise}
              >
                Reset Exercise
              </Button>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Exercise Instructions</h3>
          </div>
          <ol className="space-y-2 text-blue-800 list-decimal list-inside">
            <li>Choose a public REST API from the suggestions below (or use your own)</li>
            <li>Navigate to the main platform at{' '}
              <a href="http://localhost:8001" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                http://localhost:8001
              </a>
            </li>
            <li>Create a new REST API connector with your chosen API</li>
            <li>Configure the connector (base URL, endpoints, authentication, headers)</li>
            <li>Test the connection to verify it works</li>
            <li>Run schema introspection to discover the data structure</li>
            <li>Check off each task as you complete it</li>
          </ol>
        </Card>

        {/* Suggested APIs */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Suggested Public APIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedAPIs.map((api) => (
              <Card key={api.name} className="p-4 border-2 border-gray-200 hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  <h4 className="font-semibold text-gray-900">{api.name}</h4>
                  <Badge variant={api.auth === 'None' ? 'success' : 'warning'} className="ml-auto">
                    {api.auth}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{api.description}</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Base URL:</span>
                    <code className="block text-xs bg-gray-50 p-2 rounded mt-1 font-mono">
                      {api.url}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Endpoints:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {api.endpoints.map((ep) => (
                        <Badge key={ep} variant="outline" className="text-xs">{ep}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => {
                    setApiUrl(api.url);
                    setEndpoint(api.endpoints[0]);
                  }}
                >
                  Use This API
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        {/* Quick Reference */}
        <Card className="p-6 mb-8 bg-purple-50 border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3">Quick Configuration Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">
                Base URL
              </label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">
                Endpoint
              </label>
              <Input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-medium text-purple-900">Full URL:</span>
            <code className="block text-sm bg-white p-3 rounded mt-1 font-mono border border-purple-200">
              {apiUrl}{endpoint}
            </code>
          </div>
          <Alert variant="info" className="mt-3">
            <strong>Tip:</strong> You can test this URL in your browser or Postman before configuring the connector.
          </Alert>
        </Card>

        {/* Checklist by Category */}
        {categories.map((category) => {
          const categoryItems = checklist.filter(item => item.category === category);
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          const categoryProgress = Math.round((categoryCompleted / categoryItems.length) * 100);

          const categoryIcon = category === 'API Research' ? <Globe className="w-5 h-5" />
            : category === 'Connector Configuration' ? <Settings className="w-5 h-5" />
            : category === 'Testing & Validation' ? <CheckCircle className="w-5 h-5" />
            : <Database className="w-5 h-5" />;

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {categoryIcon}
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {categoryCompleted}/{categoryItems.length}
                  </span>
                  <div className="w-24">
                    <Progress value={categoryProgress} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-5 transition-all cursor-pointer ${
                      item.completed
                        ? 'border-2 border-success-200 bg-success-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {item.completed ? (
                          <CheckCircle className="w-6 h-6 text-success-600" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4
                              className={`font-semibold mb-1 ${
                                item.completed ? 'text-success-900 line-through' : 'text-gray-900'
                              }`}
                            >
                              {item.task}
                            </h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Badge variant={item.completed ? 'success' : 'default'}>
                            {item.points} pts
                          </Badge>
                        </div>

                        {showHints && !item.completed && (
                          <Alert variant="info" className="mt-3 text-sm">
                            <strong>Hint:</strong> {getHintForTask(item.id)}
                          </Alert>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Completion Card */}
        {exerciseCompleted ? (
          <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Module 2 Complete! 🎉
              </h3>
              <p className="text-gray-700 mb-6">
                Excellent work! You've mastered data connectors. You're now ready to learn about
                data transformations in Module 3.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/modules/3-transformations">
                  <Button>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Module 3
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/modules">
                  <Button variant="outline">Back to All Modules</Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-gray-50 border-gray-200">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Keep Going!</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Complete all {checklist.length} tasks to finish Module 2 and earn your Data Connectors badge.
                  You're {checklist.length - completedCount} tasks away!
                </p>
                <div className="flex gap-3">
                  <Link href="/modules/2-connectors/lesson-1">
                    <Button variant="outline" size="sm">
                      Review Lessons
                    </Button>
                  </Link>
                  <a href="http://localhost:8001" target="_blank" rel="noopener noreferrer">
                    <Button size="sm">
                      Open Platform
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function to provide hints for each task
function getHintForTask(taskId: string): string {
  const hints: Record<string, string> = {
    'api-1': 'JSONPlaceholder is recommended for beginners - it requires no authentication and has simple data structures.',
    'api-2': 'Look for the base URL, available endpoints, authentication requirements, and example responses.',
    'api-3': 'Open the full URL (base + endpoint) in your browser, or use Postman/Insomnia to test it.',
    'config-1': 'Go to Connectors in the main platform, click "New Connector", and select "REST API" as the type.',
    'config-2': 'The base URL is everything before the endpoint path (e.g., https://jsonplaceholder.typicode.com).',
    'config-3': 'Common endpoints include /users, /posts, /todos. Start with a simple GET endpoint.',
    'config-4': 'For public APIs like JSONPlaceholder, set auth to "None". For others, use API Key or Bearer Token.',
    'config-5': 'Common headers: Accept: application/json, User-Agent: DataAggregator/1.0',
    'test-1': 'Use the "Test Connection" button in the connector configuration to verify it works.',
    'test-2': 'Check that the test returns JSON data with the fields you expect (id, name, etc.).',
    'test-3': 'Try testing with an invalid endpoint or wrong credentials to see error handling.',
    'schema-1': 'Click "Introspect Schema" after successfully testing the connection.',
    'schema-2': 'The introspection results will show all fields detected in the API response.',
    'schema-3': 'Note which fields are strings, numbers, booleans, arrays, or objects.',
  };

  return hints[taskId] || 'Review the corresponding lesson for guidance on this task.';
}
