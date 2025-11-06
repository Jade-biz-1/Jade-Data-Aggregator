'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { Award, CheckCircle, Target, ArrowRight, Code } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { TransformationEditor } from '@/components/sandbox';

export default function Module3ExercisePage() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Create field mapping transformation', done: false, points: 20},
    {id: 2, name: 'Add validation rules for email and price', done: false, points: 15},
    {id: 3, name: 'Write custom function to calculate totals', done: false, points: 25},
    {id: 4, name: 'Test transformation with sample data', done: false, points: 20},
    {id: 5, name: 'Fix validation errors and re-test', done: false, points: 20}
  ]);

  const completed = tasks.filter(t => t.done).length;
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = tasks.filter(t => t.done).reduce((sum, t) => sum + t.points, 0);
  const progress = (completed / tasks.length) * 100;

  const toggle = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? {...t, done: !t.done} : t));
  };

  React.useEffect(() => {
    if (completed === tasks.length) {
      progressTracker.completeLesson('module-3-exercise', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/3" className="text-primary-600 mb-4 inline-block">
          ← Back to Module 3
        </Link>

        <h1 className="text-4xl font-bold mb-4">Exercise 3: E-commerce Transformation</h1>
        <p className="text-lg text-gray-600 mb-8">
          Transform messy e-commerce data using field mappings, validation rules, and custom functions.
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

        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <Code className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interactive Workspace
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Use the editor below to build your e-commerce transformation. The sample data includes
                product orders that need to be cleaned, validated, and enriched with calculated fields.
              </p>
            </div>
          </div>

          <TransformationEditor
            initialCode={`# E-commerce Order Transformation
def transform(data):
    """
    Transform and validate e-commerce order data.

    Requirements:
    1. Convert product names to uppercase
    2. Validate email addresses
    3. Calculate total (price * quantity)
    4. Add 10% discount
    5. Calculate final_price
    """
    import re

    if isinstance(data, dict):
        # TODO: Implement your transformation logic here

        # Example validation
        email = data.get('email', '')
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        is_valid = bool(re.match(email_regex, email))

        return {
            'order_id': data.get('order_id'),
            'customer_email': email,
            'email_valid': is_valid,
            'product': data.get('product', '').upper(),
            'price': data.get('price', 0),
            'quantity': data.get('quantity', 1),
            # Add calculated fields here
            'status': 'pending'
        }

    return data`}
            sampleInput={{
              order_id: "ORD-001",
              customer_email: "john@example.com",
              product: "wireless headphones",
              price: 79.99,
              quantity: 2,
              customer_name: "John Doe"
            }}
            height="500px"
          />
        </Card>

        {completed === tasks.length ? (
          <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 text-center">
            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Module 3 Complete! 🎉</h3>
            <p className="text-gray-700 mb-6">You&apos;ve mastered data transformations!</p>
            <Link href="/modules/4">
              <Button>
                Start Module 4: Pipelines
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
                  Complete all {tasks.length} tasks to earn your Data Transformations badge.
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
