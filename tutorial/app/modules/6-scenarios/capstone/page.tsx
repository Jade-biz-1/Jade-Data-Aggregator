'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { progressTracker } from '@/lib/progress';

export default function CapstonePage() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Design multi-scenario data architecture', done: false, points: 20},
    {id: 2, name: 'Integrate all 4 scenarios into unified platform', done: false, points: 30},
    {id: 3, name: 'Build executive analytics dashboard', done: false, points: 25},
    {id: 4, name: 'Implement cross-scenario insights', done: false, points: 25},
    {id: 5, name: 'Create comprehensive documentation', done: false, points: 20},
    {id: 6, name: 'Deploy to production environment', done: false, points: 30}
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
      progressTracker.completeLesson('capstone-project', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/6-scenarios" className="text-primary-600 mb-4 inline-block">← Back to Module 6</Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Final Capstone Project</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Design and implement a comprehensive enterprise data platform integrating all four scenarios.
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

        <Card className="p-6 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-600" />
            The Ultimate Challenge
          </h2>
          <p className="text-gray-700 mb-4">
            You've completed all four scenarios individually. Now, integrate them into a unified
            enterprise data platform. This capstone demonstrates your ability to design and implement
            production-grade data systems that solve real business problems.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Project Requirements</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Unified Data Architecture</h3>
              <p className="text-sm text-gray-700">
                Design a centralized data warehouse that consolidates data from all four scenarios:
                e-commerce, IoT sensors, financial systems, and customer profiles. Implement a star
                schema with shared dimensions (customers, products, time).
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Cross-Scenario Analytics</h3>
              <p className="text-sm text-gray-700">
                Build insights that span multiple scenarios:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• Link customer purchases to support tickets (e-commerce + customer360)</li>
                <li>• Correlate equipment failures with financial impact (IoT + financial)</li>
                <li>• Analyze customer lifetime value across all touchpoints</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Executive Dashboard</h3>
              <p className="text-sm text-gray-700">
                Create a single-pane-of-glass dashboard showing:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• Real-time sales and revenue metrics</li>
                <li>• Equipment health and operational efficiency</li>
                <li>• Financial performance and cash position</li>
                <li>• Customer satisfaction and retention metrics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">4. Advanced Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time monitoring across all pipelines</li>
                <li>• Unified error handling and alerting</li>
                <li>• Automated data quality checks</li>
                <li>• Comprehensive audit trails</li>
                <li>• Performance optimization for scale</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">5. Documentation</h3>
              <p className="text-sm text-gray-700">
                Document your solution including:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• Architecture diagrams</li>
                <li>• Data flow documentation</li>
                <li>• API specifications</li>
                <li>• Deployment runbook</li>
                <li>• Troubleshooting guide</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="space-y-3 mb-8">
          {tasks.map(task => (
            <Card key={task.id} className={`p-5 cursor-pointer transition-all ${task.done ? 'bg-green-50 border-green-200' : 'hover:shadow-md'}`}
              onClick={() => toggle(task.id)}>
              <div className="flex items-center gap-4">
                {task.done ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                <div className="flex-1">
                  <h4 className={`font-semibold ${task.done ? 'line-through text-green-900' : ''}`}>{task.name}</h4>
                </div>
                <Badge variant={task.done ? 'success' : 'default'}>{task.points} pts</Badge>
              </div>
            </Card>
          ))}
        </div>

        {completed === tasks.length ? (
          <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">🎉 Congratulations! 🎉</h2>
            <h3 className="text-2xl font-semibold mb-4">You've Completed the Entire Tutorial!</h3>
            <p className="text-lg text-gray-700 mb-6">
              You've mastered the Data Aggregator Platform and built production-ready
              data engineering solutions. You're now equipped to solve complex data challenges!
            </p>
            <div className="space-y-2 mb-6 text-gray-700">
              <p>✅ Completed all 6 modules</p>
              <p>✅ Built 4 production scenarios</p>
              <p>✅ Finished the comprehensive capstone project</p>
              <p>✅ Earned {earnedPoints} total points</p>
            </div>
            <Link href="/modules">
              <Button size="lg" className="mb-4">
                View All Modules <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-gray-600 mt-4">
              Consider sharing your capstone project on LinkedIn or GitHub to showcase your skills!
            </p>
          </Card>
        ) : (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips for Success</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Start with a high-level architecture diagram</li>
              <li>• Reuse and adapt code from previous scenarios</li>
              <li>• Focus on integration points between scenarios</li>
              <li>• Document decisions and trade-offs as you go</li>
              <li>• Test incrementally rather than all at once</li>
              <li>• Don't hesitate to use platform templates and best practices</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
