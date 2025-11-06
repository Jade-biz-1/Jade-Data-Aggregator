'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { Award, CheckCircle, Target, PlayCircle, ArrowRight, GitBranch } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { PipelineCanvas } from '@/components/sandbox';

export default function Module4ExercisePage() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Create a new pipeline', done: false, points: 15},
    {id: 2, name: 'Add CSV file as source connector', done: false, points: 20},
    {id: 3, name: 'Add transformation to clean data', done: false, points: 25},
    {id: 4, name: 'Configure database destination', done: false, points: 20},
    {id: 5, name: 'Test pipeline execution', done: false, points: 15},
    {id: 6, name: 'Schedule pipeline to run daily', done: false, points: 15},
    {id: 7, name: 'Monitor execution and review logs', done: false, points: 10}
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
      progressTracker.completeLesson('module-4-exercise', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/4-pipelines" className="text-primary-600 mb-4 inline-block">
          ← Back to Module 4
        </Link>

        <h1 className="text-4xl font-bold mb-4">Exercise 4: Build a Complete Pipeline</h1>
        <p className="text-lg text-gray-600 mb-8">
          Create an end-to-end data pipeline from CSV source to database destination.
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

        <Card className="p-6 mb-8 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3 mb-4">
            <GitBranch className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interactive Pipeline Builder
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Use the visual pipeline builder below to design your end-to-end data pipeline.
                Add a CSV source, transformation step, and database destination, then connect them together.
              </p>
            </div>
          </div>

          <PipelineCanvas />
        </Card>

        {completed === tasks.length ? (
          <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 text-center">
            <Award className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Phase 3 Complete! 🎉</h3>
            <p className="text-gray-700 mb-2">You've mastered Modules 3 & 4!</p>
            <p className="text-gray-600 mb-6">
              You can now build complete data pipelines from source to destination.
            </p>
            <Link href="/modules">
              <Button>
                <PlayCircle className="w-4 h-4 mr-2" />
                Back to All Modules
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
                  Complete all {tasks.length} tasks to finish Module 4 and earn your Pipelines badge.
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
