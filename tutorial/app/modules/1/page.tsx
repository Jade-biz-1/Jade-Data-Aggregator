'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  ArrowRight,
  Target,
  PlayCircle
} from 'lucide-react';

export default function Module1Page() {
  const lessons = [
    {
      id: 1,
      title: 'Login and Navigation',
      description: 'Learn how to access the platform, authenticate securely, and navigate the main interface.',
      duration: '10 min',
      completed: false,
    },
    {
      id: 2,
      title: 'Dashboard Overview',
      description: 'Explore the dashboard components, widgets, and how to customize your view.',
      duration: '12 min',
      completed: false,
    },
    {
      id: 3,
      title: 'Roles and Permissions',
      description: 'Understand the 6 user roles and their access levels in the platform.',
      duration: '15 min',
      completed: false,
    },
  ];

  const completedLessons = lessons.filter(l => l.completed).length;
  const progress = (completedLessons / lessons.length) * 100;

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
                <Badge variant="success">Beginner</Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>45 minutes</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Module 1: Platform Basics
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Get started with the Data Aggregator Platform. Learn the fundamentals of navigation,
                authentication, and understand the core concepts that power your data integration workflows.
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

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

        {/* Learning Objectives */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">What You&apos;ll Learn</h3>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-blue-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>How to log in and navigate the platform interface</span>
            </li>
            <li className="flex items-start gap-2 text-blue-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Understanding dashboard components and customization options</span>
            </li>
            <li className="flex items-start gap-2 text-blue-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>The 6 user roles and their permission levels</span>
            </li>
            <li className="flex items-start gap-2 text-blue-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Common platform operations and best practices</span>
            </li>
          </ul>
        </Card>

        {/* Lessons List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h2>
          <div className="space-y-6">
            {lessons.map((lesson, index) => (
              <Link key={lesson.id} href={`/modules/1/lesson-${lesson.id}`}>
                <Card className={`p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  lesson.completed ? 'border-2 border-success-200 bg-success-50' : ''
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      lesson.completed
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
          <Link href="/modules/1/exercise">
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Platform Exploration Exercise
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Test your knowledge with hands-on tasks covering login, dashboard, and roles.
                    Complete all checkpoints to earn your badge!
                  </p>
                  <Button variant="primary" size="sm" className="group">
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
                Finish all 3 lessons and the exercise to earn your Platform Basics badge and unlock Module 2: Data Connectors.
              </p>
              <div className="flex gap-3">
                <Link href="/modules/1/lesson-1">
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
