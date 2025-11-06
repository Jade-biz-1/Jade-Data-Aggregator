'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Progress from '@/components/ui/Progress';
import { progressTracker } from '@/lib/progress';
import {
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  Target,
  Lock,
  LayoutDashboard,
  Shield,
  PlayCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  description: string;
  completed: boolean;
  points: number;
}

export default function Module1ExercisePage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Login and Navigation Tasks
    {
      id: 'login-1',
      category: 'Login & Navigation',
      task: 'Access the Login Page',
      description: 'Navigate to the platform login page at http://localhost:8001/',
      completed: false,
      points: 5,
    },
    {
      id: 'login-2',
      category: 'Login & Navigation',
      task: 'Understand JWT Authentication',
      description: 'Review the authentication flow and understand how JWT tokens work',
      completed: false,
      points: 10,
    },
    {
      id: 'login-3',
      category: 'Login & Navigation',
      task: 'Identify Navigation Elements',
      description: 'Locate the top navigation bar, sidebar, and main content area',
      completed: false,
      points: 5,
    },
    {
      id: 'login-4',
      category: 'Login & Navigation',
      task: 'Find Quick Actions',
      description: 'Identify where to create connectors, transformations, and pipelines',
      completed: false,
      points: 10,
    },

    // Dashboard Tasks
    {
      id: 'dashboard-1',
      category: 'Dashboard',
      task: 'Identify Dashboard Widgets',
      description: 'Find and count the different widget types on the dashboard',
      completed: false,
      points: 10,
    },
    {
      id: 'dashboard-2',
      category: 'Dashboard',
      task: 'Understand Widget Data',
      description: 'Review what data each widget displays (statistics, pipelines, metrics, activity)',
      completed: false,
      points: 10,
    },
    {
      id: 'dashboard-3',
      category: 'Dashboard',
      task: 'Explore Customization Options',
      description: 'Understand how to rearrange, resize, and configure widgets',
      completed: false,
      points: 10,
    },
    {
      id: 'dashboard-4',
      category: 'Dashboard',
      task: 'Locate Refresh Controls',
      description: 'Find where to manually refresh widgets or set auto-refresh intervals',
      completed: false,
      points: 5,
    },

    // Roles and Permissions Tasks
    {
      id: 'roles-1',
      category: 'Roles & Permissions',
      task: 'List All 6 User Roles',
      description: 'Identify and understand all 6 roles: Super Admin, Admin, Manager, Data Engineer, Analyst, Viewer',
      completed: false,
      points: 10,
    },
    {
      id: 'roles-2',
      category: 'Roles & Permissions',
      task: 'Understand Super Admin vs Admin',
      description: 'Explain the key differences between Super Admin and Admin roles',
      completed: false,
      points: 10,
    },
    {
      id: 'roles-3',
      category: 'Roles & Permissions',
      task: 'Identify Data Engineer Permissions',
      description: 'List what actions a Data Engineer can perform (hint: they can create, edit, delete connectors/transformations/pipelines)',
      completed: false,
      points: 10,
    },
    {
      id: 'roles-4',
      category: 'Roles & Permissions',
      task: 'Compare Analyst vs Viewer',
      description: 'Understand the difference between Analyst and Viewer roles',
      completed: false,
      points: 10,
    },
    {
      id: 'roles-5',
      category: 'Roles & Permissions',
      task: 'Apply Least Privilege Principle',
      description: 'Understand why users should be assigned the minimum role needed for their work',
      completed: false,
      points: 15,
    },
  ]);

  const [showHints, setShowHints] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  const totalPoints = checklist.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = checklist
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.points, 0);
  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);
  const completedCount = checklist.filter(item => item.completed).length;

  useEffect(() => {
    // Check if exercise is complete
    if (completedCount === checklist.length && !exerciseCompleted) {
      setExerciseCompleted(true);
      setCelebrationShown(true);
      progressTracker.completeLesson('module-1-exercise', 100);

      // Hide celebration after 5 seconds
      setTimeout(() => setCelebrationShown(false), 5000);
    }
  }, [completedCount, checklist.length, exerciseCompleted]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const resetExercise = () => {
    setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    setExerciseCompleted(false);
    setCelebrationShown(false);
  };

  const categories = Array.from(new Set(checklist.map(item => item.category)));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/modules/1"
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Back to Module 1
          </Link>

          <div className="flex items-start justify-between gap-8 mt-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="warning">Exercise</Badge>
                <Badge variant="info">Hands-on</Badge>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Exercise 1: Platform Exploration
              </h1>
              <p className="text-lg text-gray-600">
                Complete these tasks to demonstrate your understanding of platform basics, dashboard
                navigation, and role-based access control. Check off each item as you complete it!
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Banner */}
        {celebrationShown && (
          <Alert variant="success" className="mb-8 animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <strong className="text-lg">Congratulations! 🎉</strong>
                <p className="mt-1">
                  You&apos;ve completed all tasks in Module 1! You&apos;ve earned your Platform Basics badge.
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Progress Overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Your Progress</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {checklist.length} tasks completed • {earnedPoints}/{totalPoints} points
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">{completionPercentage}%</div>
              {exerciseCompleted && (
                <Badge variant="success" className="mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete!
                </Badge>
              )}
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3" />

          <div className="mt-4 flex gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHints(!showHints)}
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </Button>
            {exerciseCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={resetExercise}
              >
                Reset Exercise
              </Button>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Exercise Instructions</h3>
          </div>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Review the lessons if you need to refresh your knowledge</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Complete each task by checking it off the list below</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                For hands-on tasks, open the main platform at{' '}
                <a
                  href="http://localhost:8001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  http://localhost:8001
                </a>{' '}
                in a new tab
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Use hints if you get stuck (no penalty!)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Complete all tasks to earn your Platform Basics badge</span>
            </li>
          </ul>
        </Card>

        {/* Checklist by Category */}
        {categories.map((category) => {
          const categoryItems = checklist.filter(item => item.category === category);
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          const categoryProgress = Math.round((categoryCompleted / categoryItems.length) * 100);

          const categoryIcon = category === 'Login & Navigation' ? <Lock className="w-5 h-5" />
            : category === 'Dashboard' ? <LayoutDashboard className="w-5 h-5" />
            : <Shield className="w-5 h-5" />;

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {categoryIcon}
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {categoryCompleted}/{categoryItems.length}
                  </span>
                  <div className="w-24">
                    <Progress value={categoryProgress} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-5 transition-all cursor-pointer ${
                      item.completed
                        ? 'border-2 border-success-200 bg-success-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {item.completed ? (
                          <CheckCircle className="w-6 h-6 text-success-600" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4
                              className={`font-semibold mb-1 ${
                                item.completed ? 'text-success-900 line-through' : 'text-gray-900'
                              }`}
                            >
                              {item.task}
                            </h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Badge variant={item.completed ? 'success' : 'default'}>
                            {item.points} pts
                          </Badge>
                        </div>

                        {showHints && !item.completed && (
                          <Alert variant="info" className="mt-3 text-sm">
                            <strong>Hint:</strong> {getHintForTask(item.id)}
                          </Alert>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Completion Card */}
        {exerciseCompleted ? (
          <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Module 1 Complete! 🎉
              </h3>
              <p className="text-gray-700 mb-6">
                Excellent work! You&apos;ve mastered the platform basics. You&apos;re now ready to dive into
                Module 2: Data Connectors.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/modules/2">
                  <Button>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Module 2
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/modules">
                  <Button variant="outline">Back to All Modules</Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-gray-50 border-gray-200">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Keep Going!</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Complete all {checklist.length} tasks above to finish Module 1 and unlock Module 2.
                  You&apos;re {completedCount} tasks away from earning your Platform Basics badge!
                </p>
                <div className="flex gap-3">
                  <Link href="/modules/1/lesson-1">
                    <Button variant="outline" size="sm">
                      Review Lessons
                    </Button>
                  </Link>
                  <a href="http://localhost:8001" target="_blank" rel="noopener noreferrer">
                    <Button size="sm">
                      Open Platform
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function to provide hints for each task
function getHintForTask(taskId: string): string {
  const hints: Record<string, string> = {
    'login-1': 'The platform runs at http://localhost:8001. Open it in a new browser tab.',
    'login-2': 'Review Lesson 1.1 to understand how JWT tokens provide secure, stateless authentication.',
    'login-3': 'Look for the horizontal bar at the top, vertical menu on the left, and the main area in the center.',
    'login-4': 'Check the sidebar menu or dashboard for links/buttons to create new resources.',
    'dashboard-1': 'Review Lesson 1.2. Common widgets include: Statistics, Pipeline Status, Performance Metrics, and Recent Activity.',
    'dashboard-2': 'Each widget shows different data: stats show aggregates, pipeline widgets show execution status, metrics show performance trends.',
    'dashboard-3': 'Lesson 1.2 explains drag-and-drop, resizing, and refresh interval configuration.',
    'dashboard-4': 'Look for refresh icons on widgets or in settings. Auto-refresh can be set to 5s, 30s, 1min, 5min, or manual.',
    'roles-1': 'Review Lesson 1.3. The 6 roles are: Super Admin, Admin, Manager, Data Engineer, Analyst, and Viewer.',
    'roles-2': 'Super Admin has full system access including low-level config. Admin manages users/resources but not system config.',
    'roles-3': 'Data Engineers can create, edit, and delete connectors, transformations, and pipelines. They cannot manage users.',
    'roles-4': 'Analysts can run pipelines and export data. Viewers can only view resources - they cannot run or export.',
    'roles-5': 'Least privilege means giving users only the access they need. This reduces security risks and prevents accidental changes.',
  };

  return hints[taskId] || 'Review the corresponding lesson for guidance on this task.';
}
