/**
 * Access Denied Component
 * Phase 8: Enhanced RBAC - Reusable permission denied message
 */

'use client';

import React from 'react';
import { Shield } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  className?: string;
}

export function AccessDenied({
  title = 'Access Denied',
  message = 'You don\'t have permission to view this resource.',
  className = '',
}: AccessDeniedProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-100 rounded-full">
            <Shield className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{message}</p>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            If you believe you should have access, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
