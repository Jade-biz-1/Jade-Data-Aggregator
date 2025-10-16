'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getActionIcon = (action: string) => {
    const iconClasses = "w-5 h-5";

    switch (action.toLowerCase()) {
      case 'login':
      case 'login_success':
        return (
          <svg className={`${iconClasses} text-green-600 dark:text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'logout':
        return (
          <svg className={`${iconClasses} text-gray-600 dark:text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case 'login_failed':
      case 'password_change_failed':
        return (
          <svg className={`${iconClasses} text-red-600 dark:text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'password_change':
      case 'password_reset':
        return (
          <svg className={`${iconClasses} text-yellow-600 dark:text-yellow-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      case 'user_created':
      case 'user_registered':
        return (
          <svg className={`${iconClasses} text-blue-600 dark:text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'user_updated':
      case 'profile_updated':
        return (
          <svg className={`${iconClasses} text-purple-600 dark:text-purple-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'user_deleted':
      case 'user_deactivated':
        return (
          <svg className={`${iconClasses} text-red-600 dark:text-red-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
        );
      case 'user_activated':
        return (
          <svg className={`${iconClasses} text-green-600 dark:text-green-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClasses} text-gray-600 dark:text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'login_success':
      case 'user_activated':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'logout':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'login_failed':
      case 'password_change_failed':
      case 'user_deleted':
      case 'user_deactivated':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'password_change':
      case 'password_reset':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'user_created':
      case 'user_registered':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'user_updated':
      case 'profile_updated':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const isExpanded = expandedId === activity.id;

        return (
          <div
            key={activity.id}
            className={`border rounded-lg p-4 transition-all ${getActionColor(activity.action)}`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(activity.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {activity.username || 'Unknown User'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">•</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatAction(activity.action)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>

                    {/* Details (shown when expanded) */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-sm">
                        {activity.details && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Details: </span>
                            <span className="text-gray-600 dark:text-gray-400">{activity.details}</span>
                          </div>
                        )}
                        {activity.ip_address && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">IP Address: </span>
                            <span className="text-gray-600 dark:text-gray-400 font-mono">{activity.ip_address}</span>
                          </div>
                        )}
                        {activity.user_agent && (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">User Agent: </span>
                            <span className="text-gray-600 dark:text-gray-400 text-xs break-all">{activity.user_agent}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Timestamp: </span>
                          <span className="text-gray-600 dark:text-gray-400">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(activity.id)}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Connecting line to next activity (except last one) */}
            {index < activities.length - 1 && (
              <div className="ml-2 mt-2 mb-2 border-l-2 border-gray-300 dark:border-gray-600 h-4"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
