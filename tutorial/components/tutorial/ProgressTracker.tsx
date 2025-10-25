'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Circle, Lock } from 'lucide-react';

export interface LessonProgress {
  id: string;
  title: string;
  completed: boolean;
  locked: boolean;
}

export interface ModuleProgress {
  id: string;
  title: string;
  lessons: LessonProgress[];
  completed: boolean;
}

interface ProgressTrackerProps {
  modules: ModuleProgress[];
  currentLessonId?: string;
  onLessonClick?: (lessonId: string) => void;
  showPercentage?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  modules,
  currentLessonId,
  onLessonClick,
  showPercentage = true,
}) => {
  // Calculate overall progress
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, module) => sum + module.lessons.filter((lesson) => lesson.completed).length,
    0
  );
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const handleLessonClick = (lesson: LessonProgress) => {
    if (!lesson.locked && onLessonClick) {
      onLessonClick(lesson.id);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">Your Progress</h3>
          {showPercentage && (
            <span className="text-sm font-medium text-primary-600">
              {Math.round(progressPercentage)}%
            </span>
          )}
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-xs text-gray-600 mt-1">
          {completedLessons} of {totalLessons} lessons completed
        </p>
      </div>

      {/* Module List */}
      <div className="space-y-4">
        {modules.map((module) => {
          const moduleCompleted = module.lessons.every((lesson) => lesson.completed);
          const moduleProgress = module.lessons.filter((lesson) => lesson.completed).length;

          return (
            <div key={module.id} className="border-l-2 border-gray-200 pl-3">
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900">{module.title}</h4>
                  {moduleCompleted && (
                    <Badge variant="success" className="text-xs">
                      Complete
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {moduleProgress}/{module.lessons.length} lessons
                </p>
              </div>

              {/* Lesson List */}
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
                  const canClick = !lesson.locked && onLessonClick;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      disabled={lesson.locked || !canClick}
                      className={`
                        w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2
                        transition-colors
                        ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : ''}
                        ${lesson.completed ? 'text-gray-700' : 'text-gray-600'}
                        ${lesson.locked ? 'opacity-50 cursor-not-allowed' : ''}
                        ${canClick && !lesson.locked ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                      ) : lesson.locked ? (
                        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
