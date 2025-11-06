'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, Users, ArrowRight } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { CodeBlock } from '@/components/tutorial/CodeBlock';

export default function Scenario4Page() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Connect CRM, support, and sales data', done: false, points: 20},
    {id: 2, name: 'Implement entity resolution', done: false, points: 30},
    {id: 3, name: 'Build unified customer profile', done: false, points: 25},
    {id: 4, name: 'Create customer segmentation', done: false, points: 15},
    {id: 5, name: 'Build 360-degree dashboard', done: false, points: 10}
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
      progressTracker.completeLesson('scenario-4', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/6" className="text-primary-600 mb-4 inline-block">← Back to Module 6</Link>

        <div className="flex items-center gap-3 mb-4">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-bold">Scenario 4: Customer 360 View</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Build a unified customer profile by consolidating data from CRM, support, purchases, and interactions.
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
            Customer data is fragmented across Salesforce (CRM), Zendesk (support tickets),
            Stripe (payments), and Google Analytics (web behavior). Sales and support teams
            lack a complete view of each customer, leading to poor experiences.
          </p>
          <h3 className="font-semibold mb-2">Requirements:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Merge 500K+ customer records from 4+ sources</li>
            <li>• Resolve duplicate identities (email, phone, account ID)</li>
            <li>• Enrich profiles with behavioral and transactional data</li>
            <li>• Enable real-time profile lookup for customer service</li>
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Entity Resolution Example</h2>
          <CodeBlock code={`def resolve_customer_identity(records):
    # Match records by email, phone, or account ID
    customer_groups = {}

    for record in records:
        # Extract identifiers
        email = normalize_email(record.get('email'))
        phone = normalize_phone(record.get('phone'))
        account_id = record.get('account_id')

        # Find matching group
        match_key = None
        for key in customer_groups:
            group = customer_groups[key]
            if (email in group['emails'] or
                phone in group['phones'] or
                account_id in group['account_ids']):
                match_key = key
                break

        if match_key:
            # Add to existing group
            merge_customer_record(customer_groups[match_key], record)
        else:
            # Create new group
            customer_groups[generate_id()] = create_customer_group(record)

    return customer_groups`} language="python" showLineNumbers showCopyButton />
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
            <h3 className="text-xl font-bold mb-2">Scenario 4 Complete!</h3>
            <Link href="/modules/6/capstone">
              <Button>Start Capstone Project <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
