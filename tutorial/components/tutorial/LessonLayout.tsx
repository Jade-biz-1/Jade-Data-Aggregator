'use client';

import React, { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Clock, Target } from 'lucide-react';

interface LessonLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  module: string;
  lessonNumber: number;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  objectives?: string[];
  sidebar?: ReactNode;
}

export const LessonLayout: React.FC<LessonLayoutProps> = ({
  children,
  title,
  description,
  module,
  lessonNumber,
  estimatedTime = '15 min',
  difficulty = 'beginner',
  objectives = [],
  sidebar,
}) => {
  const difficultyColors = {
    beginner: 'success' as const,
    intermediate: 'warning' as const,
    advanced: 'danger' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="default">{module}</Badge>
            <Badge variant={difficultyColors[difficulty]}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{estimatedTime}</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lesson {lessonNumber}: {title}
          </h1>

          {description && (
            <p className="text-lg text-gray-600">{description}</p>
          )}

          {objectives.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Learning Objectives</h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                {objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-3">
            <Card className="p-6 sm:p-8">
              <div className="prose max-w-none">
                {children}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          {sidebar && (
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                {sidebar}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
