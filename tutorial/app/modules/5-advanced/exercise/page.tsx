'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { Award, CheckCircle, Target, Trophy, ArrowRight } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function Module5ExercisePage() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Set up analytics dashboard with key metrics', done: false, points: 20},
    {id: 2, name: 'Implement real-time monitoring for pipeline', done: false, points: 20},
    {id: 3, name: 'Configure error handling with retry logic', done: false, points: 20},
    {id: 4, name: 'Create pipeline template for common pattern', done: false, points: 15},
    {id: 5, name: 'Implement batch processing for large dataset', done: false, points: 25}
  ]);

  const completed = tasks.filter(t => t.done).length;
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tasks.filter(t => t.done).reduce((sum, t) => sum + t.points, 0);
  const progress = (completed / tasks.length) * 100;

  const toggle = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? {...t, done: !t.done} : t));
  };

  useEffect(() => {
    if (completed === tasks.length) {
      progressTracker.completeLesson('module-5-exercise', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/5-advanced" className="text-primary-600 mb-4 inline-block">
          ← Back to Module 5
        </Link>

        <h1 className="text-4xl font-bold mb-4">Capstone Exercise: Multi-Source Integration</h1>
        <p className="text-lg text-gray-600 mb-8">
          Build a production-grade multi-source pipeline with analytics, monitoring, error handling, and optimization.
        </p>

        <Card className="p-6 mb-8">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-semibold">Progress</h3>
              <p className="text-sm text-gray-600">{completed}/{tasks.length} tasks • {earnedPoints}/{totalPoints} pts</p>
            </div>
            <div className="text-2xl font-bold text-primary-600">{Math.round(progress)}%</div>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>

        {/* Scenario Description */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Scenario: E-commerce Data Integration</h2>
          <p className="text-gray-700 mb-4">
            You're building a data pipeline that combines data from three sources: a PostgreSQL
            database (orders), a REST API (customer data), and CSV files (product catalog). The
            pipeline must process 1M+ records daily with real-time monitoring and robust error handling.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Source 1: PostgreSQL</div>
              <div className="text-sm text-gray-600">Orders table (500K records/day)</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Source 2: REST API</div>
              <div className="text-sm text-gray-600">Customer API (rate-limited)</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-900 mb-1">Source 3: CSV Files</div>
              <div className="text-sm text-gray-600">Product catalog (daily updates)</div>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        <div className="space-y-3 mb-8">
          {tasks.map(task => (
            <Card
              key={task.id}
              className={`p-5 cursor-pointer transition-all ${task.done ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}
              onClick={() => toggle(task.id)}
            >
              <div className="flex items-center gap-4">
                {task.done ?
                  <CheckCircle className="w-6 h-6 text-green-600" /> :
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                }
                <div className="flex-1">
                  <h4 className={`font-semibold ${task.done ? 'line-through text-green-900' : ''}`}>
                    {task.name}
                  </h4>
                </div>
                <Badge variant={task.done ? 'success' : 'default'}>{task.points} pts</Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Requirements */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Requirements</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Analytics:</strong> Dashboard showing throughput, success rate, and error count</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Monitoring:</strong> Real-time status updates via WebSocket</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Error Handling:</strong> Retry with exponential backoff + dead letter queue</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Template:</strong> Create reusable template for similar integrations</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Batch Processing:</strong> Process in batches of 1000 records with parallelism=4</span>
            </div>
          </div>
        </Card>

        {completed === tasks.length ? (
          <Card className="p-8 bg-gradient-to-r from-orange-50 to-red-50 text-center">
            <Trophy className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Module 5 Complete! 🎉</h3>
            <p className="text-gray-700 mb-2">You've mastered advanced platform features!</p>
            <p className="text-gray-600 mb-6">
              Ready to tackle real-world production scenarios in Module 6.
            </p>
            <Link href="/modules">
              <Button>
                Continue to Module 6
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex gap-4">
              <Target className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Keep Going!</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Complete all {tasks.length} tasks to earn your Advanced Features badge and move to Module 6.
                </p>
                <a href="http://localhost:8001" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Open Platform</Button>
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
