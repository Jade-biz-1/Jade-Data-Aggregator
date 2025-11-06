'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModuleCard } from '@/components/home/ModuleCard';
import Button from '@/components/ui/Button';
import { progressTracker } from '@/lib/progress';
import { BookOpen, Code, Database, Workflow, Sparkles, Trophy } from 'lucide-react';

export default function Home() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const completion = progressTracker.getCompletionPercentage();
    setProgress(completion);
  }, []);

  const modules = [
    {
      moduleId: '1',
      title: 'Platform Basics',
      description: 'Learn the fundamentals of the Data Aggregator Platform, including navigation, authentication, and core concepts.',
      lessonCount: 5,
      completedLessons: 0,
      duration: '45 min',
      difficulty: 'beginner' as const,
      locked: false,
      icon: <BookOpen className="w-8 h-8 text-primary-600" />,
    },
    {
      moduleId: '2',
      title: 'Data Connectors',
      description: 'Master data source connections with CSV, JSON, databases, and APIs. Learn to configure and test connectors.',
      lessonCount: 4,
      completedLessons: 0,
      duration: '60 min',
      difficulty: 'beginner' as const,
      locked: false,
      icon: <Database className="w-8 h-8 text-primary-600" />,
    },
    {
      moduleId: '3',
      title: 'Transformations',
      description: 'Transform and enrich your data with filtering, mapping, aggregation, and custom transformation logic.',
      lessonCount: 5,
      completedLessons: 0,
      duration: '75 min',
      difficulty: 'intermediate' as const,
      locked: true,
      icon: <Code className="w-8 h-8 text-primary-600" />,
    },
    {
      moduleId: '4',
      title: 'Pipeline Building',
      description: 'Orchestrate complete data workflows by combining connectors and transformations into pipelines.',
      lessonCount: 4,
      completedLessons: 0,
      duration: '60 min',
      difficulty: 'intermediate' as const,
      locked: true,
      icon: <Workflow className="w-8 h-8 text-primary-600" />,
    },
    {
      moduleId: '5',
      title: 'Advanced Patterns',
      description: 'Explore advanced techniques including error handling, scheduling, monitoring, and performance optimization.',
      lessonCount: 5,
      completedLessons: 0,
      duration: '90 min',
      difficulty: 'advanced' as const,
      locked: true,
      icon: <Sparkles className="w-8 h-8 text-primary-600" />,
    },
    {
      moduleId: '6',
      title: 'Real-World Projects',
      description: 'Apply your knowledge to production-ready scenarios: e-commerce analytics, IoT monitoring, and financial reporting.',
      lessonCount: 6,
      completedLessons: 0,
      duration: '120 min',
      difficulty: 'advanced' as const,
      locked: true,
      icon: <Trophy className="w-8 h-8 text-primary-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Data Aggregator Platform
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 mt-2">
                Interactive Tutorial
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master data integration through hands-on exercises and real-world scenarios.
              Build pipelines, transform data, and unlock insights.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/modules/1">
                <Button size="lg" className="text-lg px-8 py-4">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Start Learning
                </Button>
              </Link>
              <Link href="/progress-demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  View Progress
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-primary-600">6</div>
                <div className="text-sm text-gray-600">Modules</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-primary-600">29</div>
                <div className="text-sm text-gray-600">Lessons</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-primary-600">450</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="text-3xl font-bold text-primary-600">{progress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Learning Path
          </h2>
          <p className="text-lg text-gray-600">
            Progress through six comprehensive modules to become a data integration expert
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.moduleId} {...module} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Progressive Learning</h3>
            <p className="text-gray-600">
              Start with basics and advance through intermediate to expert-level topics with a structured curriculum.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Hands-On Practice</h3>
            <p className="text-gray-600">
              Interactive exercises with real API integration, live data, and instant feedback on your progress.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Real Scenarios</h3>
            <p className="text-gray-600">
              Production-ready use cases including e-commerce analytics, IoT monitoring, and financial reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white/80 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Explore More</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/api-demo">
                <Button variant="outline">API Demo</Button>
              </Link>
              <Link href="/progress-demo">
                <Button variant="outline">Progress Tracker</Button>
              </Link>
              <Link href="/test-components">
                <Button variant="outline">UI Components</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
