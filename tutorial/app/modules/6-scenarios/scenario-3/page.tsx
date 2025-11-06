'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, DollarSign, ArrowRight } from 'lucide-react';
import { progressTracker } from '@/lib/progress';
import { CodeBlock } from '@/components/tutorial/CodeBlock';

export default function Scenario3Page() {
  const [tasks, setTasks] = useState([
    {id: 1, name: 'Connect to accounting system', done: false, points: 15},
    {id: 2, name: 'Integrate bank transaction feeds', done: false, points: 20},
    {id: 3, name: 'Reconcile transactions automatically', done: false, points: 30},
    {id: 4, name: 'Generate financial reports', done: false, points: 20},
    {id: 5, name: 'Create audit trail', done: false, points: 15}
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
      progressTracker.completeLesson('scenario-3', 100);
    }
  }, [completed, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/modules/6-scenarios" className="text-primary-600 mb-4 inline-block">← Back to Module 6</Link>

        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-bold">Scenario 3: Financial Reporting System</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Automate financial reporting by consolidating data from accounting systems, banks, and payment processors.
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
            Your finance team spends 3 days each month manually reconciling transactions across
            QuickBooks, 5 bank accounts, and multiple payment processors. You need to automate
            this process to close books faster and ensure accuracy.
          </p>
          <h3 className="font-semibold mb-2">Requirements:</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Auto-reconcile 10,000+ monthly transactions</li>
            <li>• Generate P&L, balance sheet, and cash flow</li>
            <li>• Flag discrepancies for review</li>
            <li>• Maintain complete audit trail</li>
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Reconciliation Logic</h2>
          <CodeBlock code={`def reconcile_transaction(bank_tx, accounting_tx):
    # Match by amount, date, and reference
    matches = []

    for acct_tx in accounting_tx:
        if (abs(bank_tx['amount'] - acct_tx['amount']) < 0.01 and
            bank_tx['date'] == acct_tx['date'] and
            bank_tx['reference'] in acct_tx['description']):
            matches.append({
                'bank_tx_id': bank_tx['id'],
                'acct_tx_id': acct_tx['id'],
                'confidence': calculate_confidence(bank_tx, acct_tx),
                'status': 'matched'
            })

    if not matches:
        # Flag for manual review
        return {'status': 'unmatched', 'bank_tx': bank_tx}

    return matches[0]`} language="python" showLineNumbers showCopyButton />
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
            <h3 className="text-xl font-bold mb-2">Scenario 3 Complete!</h3>
            <Link href="/modules/6-scenarios/scenario-4">
              <Button>Next Scenario <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
