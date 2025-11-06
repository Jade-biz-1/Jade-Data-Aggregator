'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Progress from '@/components/ui/Progress';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { progressTracker } from '@/lib/progress';
import type { ProgressStats, UserProgress } from '@/lib/progress';
import {
  Trophy,
  CheckCircle,
  Clock,
  Award,
  Download,
  Upload,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

export default function ProgressDemoPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Demo data
  const demoModules = [
    { id: 'module-1', name: 'Platform Basics', lessons: 5 },
    { id: 'module-2', name: 'Data Connectors', lessons: 4 },
    { id: 'module-3', name: 'Transformations', lessons: 6 },
  ];

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(progressTracker.getStats());
    setProgress(progressTracker.getProgress());
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Demo Actions
  const handleStartLesson = (lessonId: string, moduleId: string) => {
    progressTracker.startLesson(lessonId, moduleId);
    refreshData();
    showNotification(`Started lesson: ${lessonId}`);
  };

  const handleCompleteLesson = (lessonId: string) => {
    const quizScore = Math.floor(Math.random() * 30) + 70; // Random score 70-100
    progressTracker.completeLesson(lessonId, quizScore);
    refreshData();
    showNotification(`Completed lesson: ${lessonId} (Score: ${quizScore}%)`);
  };

  const handleCompleteExercise = (lessonId: string, exerciseId: string) => {
    progressTracker.completeExercise(lessonId, exerciseId, 100, 120);
    refreshData();
    showNotification(`Completed exercise: ${exerciseId}`);
  };

  const handleAwardBadge = (badgeId: string) => {
    progressTracker.awardBadge(badgeId);
    refreshData();
    showNotification(`Badge earned: ${badgeId}`);
  };

  const handleExport = () => {
    progressTracker.exportProgressAsFile();
    showNotification('Progress exported to file');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = progressTracker.importProgress(content);
      if (success) {
        refreshData();
        showNotification('Progress imported successfully');
      } else {
        showNotification('Failed to import progress');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      progressTracker.resetProgress();
      refreshData();
      showNotification('Progress reset');
    }
  };

  const handleInitializeModules = () => {
    demoModules.forEach((module) => {
      progressTracker.setModuleInfo(module.id, module.name, module.lessons);
    });
    refreshData();
    showNotification('Modules initialized');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracker Demo</h1>
          <p className="text-gray-600">
            Test the ProgressTracker with various operations
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <Alert variant="success" className="mb-6">
            {notification}
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {stats.overallCompletion}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                  <p className="text-3xl font-bold text-success-600">
                    {stats.completedLessons}/{stats.totalLessons}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Badges Earned</p>
                  <p className="text-3xl font-bold text-warning-600">
                    {stats.earnedBadges}/{stats.totalBadges}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-warning-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Time Spent</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatTime(stats.totalTimeSpent)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Lesson Operations</h3>

              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleInitializeModules()}
                      size="sm"
                    >
                      Initialize Modules
                    </Button>
                  </div>
                </div>

                {demoModules.map((module) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{module.name}</h4>
                    <div className="space-y-2">
                      {Array.from({ length: module.lessons }, (_, i) => {
                        const lessonId = `${module.id}-lesson-${i + 1}`;
                        const isCompleted = progressTracker.isLessonCompleted(lessonId);

                        return (
                          <div
                            key={lessonId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-success-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                              <span className="text-sm">Lesson {i + 1}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartLesson(lessonId, module.id)}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCompleteLesson(lessonId)}
                                disabled={isCompleted}
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteExercise(lessonId, 'exercise-1')}
                              >
                                + Exercise
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Module Progress</h3>
              {stats && (
                <div className="space-y-4">
                  {Object.values(progress?.modules || {}).map((module) => (
                    <div key={module.moduleId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{module.title}</h4>
                        {module.completed && (
                          <Badge variant="success">Completed</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            {module.lessonsCompleted} of {module.totalLessons} lessons
                          </span>
                          <span>
                            {module.totalLessons > 0
                              ? Math.round((module.lessonsCompleted / module.totalLessons) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            module.totalLessons > 0
                              ? (module.lessonsCompleted / module.totalLessons) * 100
                              : 0
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Badge System</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['beginner', 'intermediate', 'advanced', 'expert', 'master', 'champion'].map(
                    (badge) => {
                      const badgeId = `badge-${badge}`;
                      const isEarned = progressTracker.isBadgeEarned(badgeId);

                      return (
                        <button
                          key={badgeId}
                          onClick={() => !isEarned && handleAwardBadge(badgeId)}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            isEarned
                              ? 'border-warning-500 bg-warning-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <Award
                            className={`w-8 h-8 mx-auto mb-2 ${
                              isEarned ? 'text-warning-600' : 'text-gray-400'
                            }`}
                          />
                          <p className="text-sm font-medium capitalize">{badge}</p>
                          {isEarned && (
                            <Badge variant="success" className="mt-2 text-xs">
                              Earned
                            </Badge>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Management</h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleExport} variant="default">
                    <Download className="w-4 h-4 mr-2" />
                    Export Progress
                  </Button>

                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <Button variant="outline" as="span">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Progress
                    </Button>
                  </label>

                  <Button onClick={handleReset} variant="outline" className="ml-auto">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Progress Data (JSON)</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(progress, null, 2)}
                  </pre>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Documentation */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Progress Tracker Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Tracking Capabilities</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Lesson completion with quiz scores</li>
                <li>✓ Exercise tracking with attempts and time</li>
                <li>✓ Module progress with percentages</li>
                <li>✓ Badge system with progress indicators</li>
                <li>✓ Time spent tracking per lesson</li>
                <li>✓ Overall completion calculation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Management</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ LocalStorage persistence</li>
                <li>✓ Auto-save with debouncing (500ms)</li>
                <li>✓ Export to JSON file</li>
                <li>✓ Import from JSON file</li>
                <li>✓ Date serialization/deserialization</li>
                <li>✓ Version management</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
