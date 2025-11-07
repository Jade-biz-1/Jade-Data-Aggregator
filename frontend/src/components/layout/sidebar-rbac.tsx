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
  HelpCircle,
  Wrench,
  ClipboardList
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth';
import { DevWarningBanner } from './dev-warning-banner';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  requiredNavKey?: keyof import('@/hooks/usePermissions').NavigationPermissions;
}

const allNavigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiredNavKey: 'dashboard' },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch, requiredNavKey: 'pipelines' },
  { name: 'Connectors', href: '/connectors', icon: Database, requiredNavKey: 'connectors' },
  { name: 'Transformations', href: '/transformations', icon: Code, requiredNavKey: 'transformations' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiredNavKey: 'analytics' },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, requiredNavKey: 'monitoring' },
  { name: 'Users', href: '/users', icon: Users, requiredNavKey: 'users' },
];

const adminNavigationItems: NavigationItem[] = [
  { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench, requiredNavKey: 'maintenance' },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: ClipboardList, requiredNavKey: 'activity_logs' },
];

const baseSecondaryNavigation: NavigationItem[] = [
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings, requiredNavKey: 'settings' },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export function SidebarRBAC({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { navigation, devWarning, loading } = usePermissions();

  // Dev-only example data link gate
  const showExampleData =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SHOW_EXAMPLE_DATA === 'true') ||
    (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');

  // Filter navigation items based on user permissions
  const getVisibleNavItems = () => {
    if (!navigation || loading) return [];

    return allNavigationItems.filter(item => {
      if (!item.requiredNavKey) return true;
      return navigation[item.requiredNavKey] === true;
    });
  };

  // Filter admin navigation items
  const getVisibleAdminNavItems = () => {
    if (!navigation || loading) return [];

    return adminNavigationItems.filter(item => {
      if (!item.requiredNavKey) return true;
      return navigation[item.requiredNavKey] === true;
    });
  };

  // Filter secondary navigation items
  const getVisibleSecondaryNavItems = () => {
    const secondaryNavigation = showExampleData
      ? [...baseSecondaryNavigation, { name: 'Example Data', href: '/example-data', icon: FileText }]
      : baseSecondaryNavigation;

    if (!navigation || loading) return secondaryNavigation;

    return secondaryNavigation.filter(item => {
      if (!item.requiredNavKey) return true;
      return navigation[item.requiredNavKey] === true;
    });
  };

  const visibleNavItems = getVisibleNavItems();
  const visibleAdminNavItems = getVisibleAdminNavItems();
  const visibleSecondaryNavItems = getVisibleSecondaryNavItems();

  return (
    <>
      {/* Developer Warning Banner */}
      {devWarning.isActive && (
        <DevWarningBanner
          message={devWarning.message}
          expiresAt={devWarning.expiresAt}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-soft transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          devWarning.isActive && 'mt-12', // Add margin when warning banner is shown
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

          {/* User Role Badge */}
          {user?.role && (
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Role</span>
                <span className={cn(
                  "px-2 py-1 text-xs font-semibold rounded-full",
                  user.role === 'admin' && "bg-red-100 text-red-700",
                  user.role === 'developer' && "bg-purple-100 text-purple-700",
                  user.role === 'designer' && "bg-blue-100 text-blue-700",
                  user.role === 'executor' && "bg-green-100 text-green-700",
                  user.role === 'executive' && "bg-amber-100 text-amber-700",
                  user.role === 'viewer' && "bg-gray-100 text-gray-700"
                )}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {visibleNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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

                {/* Admin-only section */}
                {visibleAdminNavItems.length > 0 && (
                  <>
                    <div className="pt-4 pb-2 px-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Administration
                      </h3>
                    </div>
                    {visibleAdminNavItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                            isActive
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium'
                              : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                              isActive ? 'text-white' : 'text-gray-500 group-hover:text-red-600'
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
                  </>
                )}
              </>
            )}
          </nav>

          {/* Secondary Navigation */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 bg-opacity-50">
            <div className="space-y-1">
              {visibleSecondaryNavItems.map((item) => {
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
    </>
  );
}
