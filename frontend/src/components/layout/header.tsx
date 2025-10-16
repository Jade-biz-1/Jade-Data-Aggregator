'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import GlobalSearch from '@/components/search/GlobalSearch';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = true }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleChangePasswordClick = () => {
    setShowChangePassword(true);
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6 shadow-soft transition-colors">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-primary-50 dark:hover:bg-gray-800"
          >
            <Menu className="h-6 w-6 dark:text-gray-300" />
          </Button>
        )}

        {/* Global Search */}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Search button for mobile */}
        <div className="md:hidden">
          <GlobalSearch />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="hover:bg-primary-50 dark:hover:bg-gray-800 relative"
          >
            <Bell className="h-5 w-5 dark:text-gray-300" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 ring-2 ring-white dark:ring-gray-900 shadow-medium animate-pulse" />
          </Button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-100 dark:border-gray-700 z-50 animate-slide-down">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-700 rounded-t-xl">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-300">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-shadow duration-200">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username || 'User'}
          </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <ChevronDown className={cn(
              'h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200',
              showUserMenu && 'rotate-180'
            )} />
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-100 dark:border-gray-700 z-50 animate-slide-down">
              <div className="py-2">
                <a
                  href="/settings"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </a>
                <button
                  onClick={handleChangePasswordClick}
                  className="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  <KeyRound className="mr-3 h-4 w-4" />
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
}