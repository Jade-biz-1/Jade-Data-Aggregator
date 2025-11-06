'use client';

import React from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { CheckCircle, Lock, Clock, Award } from 'lucide-react';

export interface ModuleCardProps {
  moduleId: string;
  title: string;
  description: string;
  lessonCount: number;
  completedLessons: number;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  locked: boolean;
  icon?: React.ReactNode;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleId,
  title,
  description,
  lessonCount,
  completedLessons,
  duration,
  difficulty,
  locked,
  icon,
}) => {
  const progress = lessonCount > 0 ? (completedLessons / lessonCount) * 100 : 0;
  const isCompleted = completedLessons === lessonCount && lessonCount > 0;

  const difficultyColors = {
    beginner: 'success' as const,
    intermediate: 'warning' as const,
    advanced: 'danger' as const,
  };

  return (
    <Link href={locked ? '#' : `/modules/${moduleId}`} className={locked ? 'pointer-events-none' : ''}>
      <Card
        className={`p-6 h-full ${
          locked ? 'opacity-60' : 'hover:-translate-y-2 hover:scale-[1.02]'
        } ${isCompleted ? 'border-2 border-success-200 bg-success-50 animate-fade-in' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="text-3xl">{icon}</div>
            ) : (
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">{moduleId}</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={difficultyColors[difficulty]} className="text-xs">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{duration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Icon */}
          {locked ? (
            <Lock className="w-6 h-6 text-gray-400" />
          ) : isCompleted ? (
            <Award className="w-6 h-6 text-success-600" />
          ) : progress > 0 ? (
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">{Math.round(progress)}%</span>
            </div>
          ) : null}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {completedLessons} of {lessonCount} lessons
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-success-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                Complete
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Action */}
        <div className="mt-4">
          {locked ? (
            <button
              disabled
              className="w-full py-2 px-4 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              Locked
            </button>
          ) : isCompleted ? (
            <button className="w-full py-2 px-4 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-colors">
              Review Module
            </button>
          ) : progress > 0 ? (
            <button className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
              Continue Learning
            </button>
          ) : (
            <button className="w-full py-2 px-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
              Start Module
            </button>
          )}
        </div>
      </Card>
    </Link>
  );
};
