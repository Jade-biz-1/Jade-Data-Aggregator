'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { CodeBlock } from '@/components/tutorial/CodeBlock';

export default function Scenario1Page() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Connect to e-commerce database', done: false, points: 15},
    {id: 2, name: 'Set up Shopify API connector', done: false, points: 20},
    {id: 3, name: 'Create order transformation logic', done: false, points: 25},
    {id: 4, name: 'Build sales analytics dashboard', done: false, points: 25},
    {id: 5, name: 'Configure real-time inventory sync', done: false, points: 15}
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
      progressTracker.completeLesson('scenario-1', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/6-scenarios" className="text-primary-600 mb-4 inline-block">← Back to Module 6</Link>

        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-bold">Scenario 1: E-commerce Sales Pipeline</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Build a unified sales analytics system integrating data from your online store, Shopify, and payment processors.
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
            Your company sells products through multiple channels: a custom website (PostgreSQL database),
            Shopify stores, and Amazon. Sales data is scattered, making it difficult to get a unified
            view of performance, manage inventory, and forecast demand.
          </p>
          <h3 className="font-semibold mb-2">Requirements:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Consolidate all sales data into a single warehouse</li>
            <li>• Update inventory levels in real-time across all channels</li>
            <li>• Generate daily sales reports and dashboards</li>
            <li>• Alert when inventory falls below threshold</li>
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Guide</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 1: Database Connector</h3>
              <CodeBlock code={`# Connect to e-commerce database
connector = api.create_connector({
    "name": "E-commerce DB",
    "type": "postgresql",
    "config": {
        "host": "db.company.com",
        "database": "ecommerce",
        "table": "orders"
    }
})`} language="python" showLineNumbers showCopyButton />
            </div>

            <div>
              <h3 className="font-medium mb-2">Step 2: Shopify API</h3>
              <CodeBlock code={`# Connect to Shopify
shopify_connector = api.create_connector({
    "name": "Shopify Store",
    "type": "rest_api",
    "config": {
        "base_url": "https://yourstore.myshopify.com",
        "endpoint": "/admin/api/2024-01/orders.json",
        "auth_type": "api_key"
    }
})`} language="python" showLineNumbers showCopyButton />
            </div>

            <div>
              <h3 className="font-medium mb-2">Step 3: Transform & Unify</h3>
              <CodeBlock code={`def transform(order):
    # Normalize order format
    return {
        'order_id': order.get('id'),
        'channel': order.get('source', 'website'),
        'customer_email': order.get('customer_email'),
        'total_amount': float(order.get('total_price')),
        'currency': order.get('currency', 'USD'),
        'items': len(order.get('line_items', [])),
        'order_date': order.get('created_at')
    }`} language="python" showLineNumbers showCopyButton />
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
                  <h4 className={`font-semibold ${task.done ? 'line-through text-green-900' : ''}`}>
                    {task.name}
                  </h4>
                </div>
                <Badge variant={task.done ? 'success' : 'default'}>{task.points} pts</Badge>
              </div>
            </Card>
          ))}
        </div>

        {completed === tasks.length && (
          <Card className="p-6 bg-green-50 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Scenario 1 Complete!</h3>
            <Link href="/modules/6-scenarios/scenario-2">
              <Button>Next Scenario <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
