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
  Loader2
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { navigation: navPermissions, permissions, loading } = usePermissions();

  // Define all navigation items with their permission keys
  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, permissionKey: 'dashboard' },
    { name: 'Pipelines', href: '/pipelines', icon: GitBranch, permissionKey: 'pipelines' },
    { name: 'Connectors', href: '/connectors', icon: Database, permissionKey: 'connectors' },
    { name: 'Transformations', href: '/transformations', icon: Code, permissionKey: 'transformations' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, permissionKey: 'analytics' },
    { name: 'Monitoring', href: '/monitoring', icon: Activity, permissionKey: 'monitoring' },
    { name: 'Users', href: '/users', icon: Users, permissionKey: 'users' },
    { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench, permissionKey: 'maintenance' },
  ];

  const secondaryNavigation = [
    { name: 'Documentation', href: '/docs', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  // Filter navigation items based on permissions
  const visibleNavigation = loading
    ? allNavigation // Show all while loading, they'll be filtered on render
    : allNavigation.filter(item => {
        if (!navPermissions) return false;
        return navPermissions[item.permissionKey as keyof typeof navPermissions];
      });

  // Get role badge color
  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'developer': return 'bg-purple-100 text-purple-800';
      case 'designer': return 'bg-blue-100 text-blue-800';
      case 'executor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      case 'executive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string | undefined) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

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
        {permissions?.role && (
          <div className="px-6 py-3 border-b border-gray-100">
            <div className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold',
              getRoleBadgeColor(permissions.role)
            )}>
              {getRoleDisplayName(permissions.role)}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : (
            visibleNavigation.map((item) => {
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
            })
          )}
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