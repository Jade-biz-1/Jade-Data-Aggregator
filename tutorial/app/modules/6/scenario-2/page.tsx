'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, Wifi, ArrowRight } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { CodeBlock } from '@/components/tutorial/CodeBlock';

export default function Scenario2Page() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Connect to IoT sensor stream', done: false, points: 20},
    {id: 2, name: 'Process time-series data', done: false, points: 25},
    {id: 3, name: 'Implement anomaly detection', done: false, points: 30},
    {id: 4, name: 'Configure real-time alerts', done: false, points: 15},
    {id: 5, name: 'Build monitoring dashboard', done: false, points: 10}
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
      progressTracker.completeLesson('scenario-2', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/6" className="text-primary-600 mb-4 inline-block">← Back to Module 6</Link>

        <div className="flex items-center gap-3 mb-4">
          <Wifi className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-bold">Scenario 2: IoT Sensor Data Processing</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Process millions of sensor readings from IoT devices with real-time anomaly detection.
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

        <Card className="p-6 mb-6 bg-purple-50 border-purple-200">
          <h2 className="text-xl font-semibold mb-3">Business Context</h2>
          <p className="text-gray-700 mb-4">
            You manage a fleet of 10,000 manufacturing machines, each sending temperature, vibration,
            and pressure readings every 30 seconds. You need to detect anomalies in real-time to prevent
            equipment failures and schedule predictive maintenance.
          </p>
          <h3 className="font-semibold mb-2">Requirements:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Process 20M+ sensor readings per hour</li>
            <li>• Detect anomalies within 60 seconds</li>
            <li>• Store aggregated metrics for analysis</li>
            <li>• Alert maintenance team for critical issues</li>
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Anomaly Detection Example</h2>
          <CodeBlock code={`def detect_anomaly(sensor_data):
    # Calculate z-score for temperature
    mean = sensor_data['temp_mean']
    std = sensor_data['temp_std']
    current_temp = sensor_data['temperature']

    z_score = (current_temp - mean) / std

    if abs(z_score) > 3:  # 3 sigma rule
        return {
            'anomaly': True,
            'severity': 'critical' if abs(z_score) > 4 else 'warning',
            'metric': 'temperature',
            'value': current_temp,
            'expected_range': [mean - 2*std, mean + 2*std]
        }
    return {'anomaly': False}`} language="python" showLineNumbers showCopyButton />
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

        {completed === tasks.length && (
          <Card className="p-6 bg-green-50 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Scenario 2 Complete!</h3>
            <Link href="/modules/6/scenario-3">
              <Button>Next Scenario <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
