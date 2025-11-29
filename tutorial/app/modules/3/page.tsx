'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import {
  GitBranch,
  CheckCircle,
  Clock,
  Award,
  ArrowRight,
  Target,
  PlayCircle,
  Code,
  Filter,
  Shuffle,
  AlertCircle,
  TestTube
} from 'lucide-react';

export default function Module3Page() {
  const lessons = [
    {
      id: 1,
      title: 'Transformation Concepts',
      description: 'Understand what transformations are, why they\'re needed, and transformation types.',
      duration: '15 min',
      completed: false,
    },
    {
      id: 2,
      title: 'Field Mapping',
      description: 'Learn how to map source fields to destination fields and handle different data structures.',
      duration: '20 min',
      completed: false,
    },
    {
      id: 3,
      title: 'Validation Rules',
      description: 'Add data quality checks and validation rules to ensure clean, accurate data.',
      duration: '18 min',
      completed: false,
    },
    {
      id: 4,
      title: 'Custom Functions',
      description: 'Write custom transformation logic using Python for complex data manipulation.',
      duration: '25 min',
      completed: false,
    },
    {
      id: 5,
      title: 'Testing Transformations',
      description: 'Test your transformations with sample data before deploying to production.',
      duration: '15 min',
      completed: false,
    },
  ];

  const completedLessons = lessons.filter(l => l.completed).length;
  const progress = (completedLessons / lessons.length) * 100;

  const transformationTypes = [
    { icon: <Shuffle className="w-5 h-5" />, name: 'Field Mapping', color: 'bg-blue-500' },
    { icon: <Filter className="w-5 h-5" />, name: 'Filtering', color: 'bg-green-500' },
    { icon: <Code className="w-5 h-5" />, name: 'Custom Logic', color: 'bg-purple-500' },
    { icon: <AlertCircle className="w-5 h-5" />, name: 'Validation', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Module Header */}
        <div className="mb-8">
          <Link href="/modules" className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-2">
            ← Back to All Modules
          </Link>

          <div className="flex items-start justify-between gap-8 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="warning">Intermediate</Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>93 minutes</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Module 3: Data Transformations
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Master the art of data transformation. Learn how to map fields, validate data, apply
                custom logic, and ensure data quality through the transformation process.
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <GitBranch className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Prerequisites</h3>
              <p className="text-sm text-yellow-800">
                Before starting this module, complete <strong>Module 2: Data Connectors</strong>.
                You should understand how to connect to data sources and introspect schemas.
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Your Progress</h3>
              <p className="text-sm text-gray-600">
                {completedLessons} of {lessons.length} lessons completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{Math.round(progress)}%</div>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>

        {/* Transformation Flow Diagram */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-4">Transformation Flow</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Source Data</h4>
              <p className="text-sm text-gray-600">Raw data from connectors</p>
            </div>

            <ArrowRight className="w-8 h-8 text-gray-400 transform rotate-90 md:rotate-0" />

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <GitBranch className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Transform</h4>
              <p className="text-sm text-gray-600">Map, validate, modify</p>
            </div>

            <ArrowRight className="w-8 h-8 text-gray-400 transform rotate-90 md:rotate-0" />

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Clean Data</h4>
              <p className="text-sm text-gray-600">Ready for destination</p>
            </div>
          </div>
        </Card>

        {/* Transformation Types Overview */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">Transformation Types You&apos;ll Learn</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {transformationTypes.map((type) => (
              <div key={type.name} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center text-white`}>
                  {type.icon}
                </div>
                <span className="font-medium text-gray-900">{type.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Learning Objectives */}
        <Card className="p-6 mb-8 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">What You&apos;ll Learn</h3>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Core transformation concepts and when to use different transformation types</span>
            </li>
            <li className="flex items-start gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Field mapping techniques for restructuring data between source and destination</span>
            </li>
            <li className="flex items-start gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Data validation rules to ensure quality and catch errors early</span>
            </li>
            <li className="flex items-start gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Writing custom Python functions for complex data manipulation</span>
            </li>
            <li className="flex items-start gap-2 text-purple-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Testing transformations with sample data before production deployment</span>
            </li>
          </ul>
        </Card>

        {/* Lessons List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <Link key={lesson.id} href={`/modules/3/lesson-${lesson.id}`}>
                <Card className={`p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${lesson.completed ? 'border-2 border-success-200 bg-success-50' : ''
                  }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${lesson.completed
                      ? 'bg-success-100'
                      : 'bg-primary-100'
                      }`}>
                      {lesson.completed ? (
                        <CheckCircle className="w-6 h-6 text-success-600" />
                      ) : (
                        <span className="text-lg font-bold text-primary-600">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {lesson.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.duration}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          variant={lesson.completed ? 'primary' : 'outline'}
                          size="sm"
                          className="group"
                        >
                          {lesson.completed ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review Lesson
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Start Lesson
                            </>
                          )}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Exercise Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Hands-On Exercise</h2>
          <Link href="/modules/3/exercise">
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TestTube className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    E-commerce Data Transformation
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Transform messy e-commerce data by mapping fields, applying validation rules,
                    and using custom functions to clean and structure the data.
                  </p>
                  <Button variant="danger" size="sm" className="group">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Exercise
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Module Completion */}
        <Card className="p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-200">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-primary-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Complete This Module</h3>
              <p className="text-gray-600 text-sm mb-4">
                Finish all 5 lessons and the exercise to earn your Data Transformations badge and unlock Module 4: Pipelines.
              </p>
              <div className="flex gap-3">
                <Link href="/modules/3/lesson-1">
                  <Button>Start First Lesson</Button>
                </Link>
                <Link href="/modules">
                  <Button variant="outline">Back to Modules</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
