'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Code,
  Database, 
  GitBranch, 
  Home, 
  Settings, 
  Users,
  Activity,
  FileText,
  HelpCircle
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Connectors', href: '/connectors', icon: Database },
  { name: 'Transformations', href: '/transformations', icon: Code },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Users', href: '/users', icon: Users },
];

const secondaryNavigation = [
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-soft transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-shadow duration-200">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
              DataAggregator
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-700'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'
                  )}
                />
                <span className="relative">
                  {item.name}
                  {isActive && (
                    <div className="absolute -inset-1 bg-white bg-opacity-20 rounded-lg blur-sm"></div>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 bg-opacity-50">
          <div className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-white hover:text-primary-700 hover:shadow-soft'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}