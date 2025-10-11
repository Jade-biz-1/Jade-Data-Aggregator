'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
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
  Shield
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiresPermission?: keyof import('@/hooks/usePermissions').NavigationPermissions;
}

const allNavigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiresPermission: 'dashboard' },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch, requiresPermission: 'pipelines' },
  { name: 'Connectors', href: '/connectors', icon: Database, requiresPermission: 'connectors' },
  { name: 'Transformations', href: '/transformations', icon: Code, requiresPermission: 'transformations' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiresPermission: 'analytics' },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, requiresPermission: 'monitoring' },
  { name: 'Users', href: '/users', icon: Users, requiresPermission: 'users' },
  { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench, requiresPermission: 'maintenance' },
];

const secondaryNavigation: NavItem[] = [
  { name: 'Documentation', href: '/docs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings, requiresPermission: 'settings' },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { navigation, loading, permissions } = usePermissions();

  // Filter navigation based on permissions
  const visibleNavigation = allNavigationItems.filter(item => {
    if (!item.requiresPermission) return true;
    if (!navigation) return false;
    return navigation[item.requiresPermission];
  });

  const visibleSecondaryNav = secondaryNavigation.filter(item => {
    if (!item.requiresPermission) return true;
    if (!navigation) return false;
    return navigation[item.requiresPermission];
  });

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

        {/* Role Badge */}
        {permissions && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Role</span>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                permissions.role === 'admin' && "bg-purple-100 text-purple-700",
                permissions.role === 'developer' && "bg-yellow-100 text-yellow-700",
                permissions.role === 'designer' && "bg-blue-100 text-blue-700",
                permissions.role === 'executor' && "bg-green-100 text-green-700",
                permissions.role === 'viewer' && "bg-gray-100 text-gray-700",
                permissions.role === 'executive' && "bg-indigo-100 text-indigo-700"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : visibleNavigation.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
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
            })
          )}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 bg-opacity-50">
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
