'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import { progressTracker } from '@/lib/progress';
import {
  BookOpen,
  Database,
  Code,
  Workflow,
  Sparkles,
  Trophy,
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
} from 'lucide-react';

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const completion = progressTracker.getCompletionPercentage();
    setCompletionPercentage(completion);
  }, [pathname]);

  const modules = [
    {
      id: '1',
      title: 'Platform Basics',
      icon: BookOpen,
      lessons: 5,
      completed: 0,
      locked: false,
    },
    {
      id: '2',
      title: 'Data Connectors',
      icon: Database,
      lessons: 4,
      completed: 0,
      locked: false,
    },
    {
      id: '3',
      title: 'Transformations',
      icon: Code,
      lessons: 5,
      completed: 0,
      locked: true,
    },
    {
      id: '4',
      title: 'Pipeline Building',
      icon: Workflow,
      lessons: 4,
      completed: 0,
      locked: true,
    },
    {
      id: '5',
      title: 'Advanced Patterns',
      icon: Sparkles,
      lessons: 5,
      completed: 0,
      locked: true,
    },
    {
      id: '6',
      title: 'Real-World Projects',
      icon: Trophy,
      lessons: 6,
      completed: 0,
      locked: true,
    },
  ];

  const isModuleActive = (moduleId: string) => {
    return pathname.startsWith(`/modules/${moduleId}`);
  };

  return (
    <aside className={`w-full ${className}`}>
      <div className="space-y-4">
        {/* Progress Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Overall Progress</h3>
          <div className="mb-2">
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completion</span>
            <span className="font-bold text-primary-600">{completionPercentage}%</span>
          </div>
        </Card>

        {/* Modules Navigation */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Learning Path</h3>
          <nav className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = isModuleActive(module.id);
              const progress = module.lessons > 0 ? (module.completed / module.lessons) * 100 : 0;
              const isCompleted = module.completed === module.lessons && module.lessons > 0;

              return (
                <Link
                  key={module.id}
                  href={module.locked ? '#' : `/modules/${module.id}`}
                  className={`block ${module.locked ? 'pointer-events-none' : ''}`}
                >
                  <div
                    className={`p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-50 border-2 border-primary-200'
                        : module.locked
                        ? 'bg-gray-50 opacity-60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? 'text-primary-600'
                              : module.locked
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{module.title}</div>
                          <div className="text-xs text-gray-600">{module.lessons} lessons</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {module.locked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        ) : progress > 0 ? (
                          <Badge variant="default" className="text-xs">
                            {Math.round(progress)}%
                          </Badge>
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {!module.locked && progress > 0 && (
                      <Progress value={progress} className="h-1" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </Card>

        {/* Quick Links */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
          <nav className="space-y-2">
            <Link
              href="/progress-demo"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">Progress Tracker</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/api-demo"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">API Demo</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/test-components"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">UI Components</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </nav>
        </Card>
      </div>
    </aside>
  );
};
