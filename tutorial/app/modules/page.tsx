'use client';

import React from 'react';
import Link from 'next/link';
import { ModuleCard } from '@/components/home/ModuleCard';
import { BookOpen, Code, Database, Workflow, Sparkles, Trophy } from 'lucide-react';

export default function ModulesPage() {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Modules</h1>
          <p className="text-lg text-gray-600">
            Choose a module to begin your learning journey. Complete modules in order to unlock advanced content.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => (
            <ModuleCard key={module.moduleId} {...module} />
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-6">
            If you&apos;re new to the platform, we recommend starting with Module 1: Platform Basics.
            Each module builds on the previous one, so completing them in order will provide the best learning experience.
          </p>
          <div className="flex gap-4">
            <Link
              href="/modules/1"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Start Module 1
            </Link>
            <Link
              href="/progress-demo"
              className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              View My Progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
