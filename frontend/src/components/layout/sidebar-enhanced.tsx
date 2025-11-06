'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions, NavigationPermissions, FeatureAccess } from '@/hooks/usePermissions';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
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
  HelpCircle,
  Wrench,
  Shield,
  Bell,
  ScrollText,
  Folder,
  Share2
} from 'lucide-react';

interface NavVisibilityContext {
  navigation: NavigationPermissions | null;
  features: FeatureAccess | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  isVisible: (context: NavVisibilityContext) => boolean;
}

const primaryNavigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    isVisible: ({ navigation }) => Boolean(navigation?.dashboard),
  },
  {
    name: 'Pipelines',
    href: '/pipelines',
    icon: GitBranch,
    isVisible: ({ navigation }) => Boolean(navigation?.pipelines),
  },
  {
    name: 'Connectors',
    href: '/connectors',
    icon: Database,
    isVisible: ({ navigation }) => Boolean(navigation?.connectors),
  },
  {
    name: 'Transformations',
    href: '/transformations',
    icon: Code,
    isVisible: ({ navigation }) => Boolean(navigation?.transformations),
  },
  {
    name: 'Schema Mapping',
    href: '/schema/mapping',
    icon: Share2,
    isVisible: ({ features }) => Boolean(features?.transformations?.view),
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    isVisible: ({ navigation }) => Boolean(navigation?.analytics),
  },
  {
    name: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
    isVisible: ({ navigation }) => Boolean(navigation?.monitoring),
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: Bell,
    isVisible: ({ features }) => Boolean(features?.monitoring?.view_alerts),
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: ScrollText,
    isVisible: ({ features }) => Boolean(features?.monitoring?.view_logs),
  },
  {
    name: 'Files',
    href: '/files',
    icon: Folder,
    isVisible: ({ features }) => Boolean(features?.files?.view),
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    isVisible: ({ navigation }) => Boolean(navigation?.users),
  },
  {
    name: 'Maintenance',
    href: '/admin/maintenance',
    icon: Wrench,
    isVisible: ({ navigation }) => Boolean(navigation?.maintenance),
  },
];

const secondaryNavigation: NavItem[] = [
  {
    name: 'Documentation',
    href: '/docs',
    icon: FileText,
    isVisible: () => true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    isVisible: ({ navigation }) => Boolean(navigation?.settings),
  },
  {
    name: 'Help',
    href: '/help',
    icon: HelpCircle,
    isVisible: () => true,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { navigation, loading, permissions, features } = usePermissions();

  // Filter navigation based on permissions
  const context: NavVisibilityContext = { navigation, features };
  const visibleNavigation = primaryNavigationItems.filter(item => item.isVisible(context));
  const visibleSecondaryNav = secondaryNavigation.filter(item => item.isVisible(context));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-soft transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-800">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-shadow duration-200">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
              DataAggregator
            </span>
          </Link>
        </div>

        {/* Role Badge */}
        {permissions && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Role</span>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                permissions.role === 'admin' && "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                permissions.role === 'developer' && "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
                permissions.role === 'designer' && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                permissions.role === 'executor' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                permissions.role === 'viewer' && "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                permissions.role === 'executive' && "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
              )}>
                <Shield className="w-3 h-3 inline-block mr-1" />
                {permissions.role_info?.title || permissions.role}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : visibleNavigation.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No navigation items available
            </div>
          ) : (
            visibleNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-700 dark:hover:text-primary-400'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
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
            })
          )}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 dark:bg-gray-800 bg-opacity-50">
          <div className="space-y-1">
            {visibleSecondaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-primary-700 dark:hover:text-primary-400 hover:shadow-soft'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* Theme Toggle */}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
