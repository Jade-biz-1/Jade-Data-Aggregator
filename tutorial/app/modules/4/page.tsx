'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import { GitBranch, CheckCircle, Clock, Award, ArrowRight, Target, PlayCircle } from 'lucide-react';

export default function Module4Page() {
  const lessons = [
    {id: 1, title: 'Pipeline Architecture', description: 'Understand pipeline components and execution flow', duration: '12 min'},
    {id: 2, title: 'Visual Pipeline Builder', description: 'Use drag-and-drop to build pipelines visually', duration: '15 min'},
    {id: 3, title: 'Source Configuration', description: 'Configure data sources in pipelines', duration: '10 min'},
    {id: 4, title: 'Transformation Steps', description: 'Add and chain transformations', duration: '12 min'},
    {id: 5, title: 'Destination Setup', description: 'Configure where data gets loaded', duration: '10 min'},
    {id: 6, title: 'Scheduling', description: 'Schedule pipelines with cron or triggers', duration: '15 min'},
    {id: 7, title: 'Execution', description: 'Run and monitor pipeline execution', duration: '10 min'},
    {id: 8, title: 'Monitoring & Alerts', description: 'Track health and set up alerts', duration: '12 min'},
  ];

  const progress = 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link href="/modules" className="text-primary-600 mb-4 inline-block">← Back to All Modules</Link>

        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex gap-3 mb-3">
              <Badge variant="warning">Advanced</Badge>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" /><span>96 minutes</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Module 4: Data Pipelines</h1>
            <p className="text-lg text-gray-600">
              Build end-to-end data pipelines by combining sources, transformations, and destinations.
              Learn scheduling, monitoring, and production best practices.
            </p>
          </div>
          <div className="hidden lg:block w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <GitBranch className="w-10 h-10 text-white" />
          </div>
        </div>

        <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
          <Award className="w-5 h-5 text-yellow-600 mb-2" />
          <h3 className="font-semibold text-yellow-900 mb-2">Prerequisites</h3>
          <p className="text-sm text-yellow-800">
            Complete <strong>Module 2: Connectors</strong> and <strong>Module 3: Transformations</strong> first.
          </p>
        </Card>

        <Card className="p-6 mb-8">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-semibold">Your Progress</h3>
              <p className="text-sm text-gray-600">0 of {lessons.length} lessons</p>
            </div>
            <div className="text-2xl font-bold text-primary-600">{progress}%</div>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson, i) => (
              <Link key={lesson.id} href={`/modules/4/lesson-${lesson.id}`}>
                <Card className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" /><span>{lesson.duration}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{lesson.description}</p>
                      <Button size="sm">
                        <PlayCircle className="w-4 h-4 mr-2" />Start Lesson
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-gradient-to-r from-primary-50 to-indigo-50">
          <Award className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold mb-2">Complete This Module</h3>
          <p className="text-sm text-gray-600 mb-4">
            Finish all {lessons.length} lessons and the exercise to earn your Data Pipelines badge.
          </p>
          <Link href="/modules/4/lesson-1"><Button>Start First Lesson</Button></Link>
        </Card>
      </div>
    </div>
  );
}
