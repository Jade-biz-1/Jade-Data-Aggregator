'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BarChart3,
  Activity,
  AlertTriangle,
  FileCode,
  Layers,
  CheckCircle,
  ArrowRight,
  Clock,
  Trophy
} from 'lucide-react';

export default function Module5Page() {
  const lessons = [
    {
      id: 1,
      title: 'Analytics Dashboard',
      description: 'Build powerful analytics dashboards to visualize pipeline performance and data flow metrics',
      icon: BarChart3,
      duration: '25 min',
      difficulty: 'Advanced',
      url: '/modules/5/lesson-1',
      topics: ['Data visualization', 'Performance metrics', 'Custom charts', 'KPI tracking']
    },
    {
      id: 2,
      title: 'Real-time Monitoring',
      description: 'Implement real-time monitoring systems to track pipeline execution and data processing',
      icon: Activity,
      duration: '30 min',
      difficulty: 'Advanced',
      url: '/modules/5/lesson-2',
      topics: ['Live updates', 'WebSockets', 'Status tracking', 'Alerting']
    },
    {
      id: 3,
      title: 'Error Handling Strategies',
      description: 'Master advanced error handling patterns for robust and resilient data pipelines',
      icon: AlertTriangle,
      duration: '25 min',
      difficulty: 'Advanced',
      url: '/modules/5/lesson-3',
      topics: ['Retry logic', 'Dead letter queues', 'Circuit breakers', 'Error recovery']
    },
    {
      id: 4,
      title: 'Pipeline Templates',
      description: 'Create reusable pipeline templates to accelerate development and standardize patterns',
      icon: FileCode,
      duration: '20 min',
      difficulty: 'Intermediate',
      url: '/modules/5/lesson-4',
      topics: ['Template design', 'Parameterization', 'Template library', 'Best practices']
    },
    {
      id: 5,
      title: 'Batch Operations',
      description: 'Optimize data processing with batch operations and parallel execution strategies',
      icon: Layers,
      duration: '30 min',
      difficulty: 'Advanced',
      url: '/modules/5/lesson-5',
      topics: ['Batch processing', 'Parallel execution', 'Performance tuning', 'Resource management']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/modules"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to All Modules
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Module 5: Advanced Features
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Master advanced platform capabilities
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="warning" className="text-lg px-4 py-2">
              Advanced
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">5</div>
                  <div className="text-sm text-gray-600">Lessons</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">~2.5 hrs</div>
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">1</div>
                  <div className="text-sm text-gray-600">Capstone Exercise</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Module Overview */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            What You&apos;ll Learn
          </h2>
          <p className="text-gray-700 mb-4">
            In this advanced module, you&apos;ll learn professional-grade features used in production
            environments. You&apos;ll build analytics dashboards, implement real-time monitoring,
            master error handling patterns, create reusable templates, and optimize with batch operations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Build production-ready analytics dashboards
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Implement real-time monitoring systems
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Design robust error handling strategies
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Create reusable pipeline templates
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Optimize with batch processing
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Apply enterprise-grade best practices
              </span>
            </div>
          </div>
        </Card>

        {/* Lessons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <lesson.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Lesson {lesson.id}: {lesson.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{lesson.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge variant="default" className="whitespace-nowrap">
                          {lesson.duration}
                        </Badge>
                        <Badge
                          variant={lesson.difficulty === 'Advanced' ? 'warning' : 'default'}
                          className="whitespace-nowrap"
                        >
                          {lesson.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {lesson.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <Link href={lesson.url}>
                      <Button size="sm" className="flex items-center gap-2">
                        Start Lesson
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exercise */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Capstone Exercise: Multi-Source Integration
              </h3>
              <p className="text-gray-700 mb-4">
                Put your advanced skills to the test by building a complex multi-source data
                integration pipeline with real-time monitoring, error handling, and analytics.
                This exercise combines all the concepts from Module 5.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="warning" className="text-base px-3 py-1">
                  Advanced Challenge
                </Badge>
                <span className="text-sm text-gray-600">
                  Estimated time: 60-90 minutes
                </span>
              </div>
              <Link href="/modules/5/exercise">
                <Button variant="primary" className="flex items-center gap-2">
                  Start Capstone Exercise
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Prerequisites */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Prerequisites
          </h3>
          <p className="text-gray-700 mb-3">
            Before starting this module, ensure you have completed:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 1: Platform Basics</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 2: Connectors</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 3: Transformations</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Module 4: Pipelines</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
