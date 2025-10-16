/**
 * Environment Badge Component
 * Phase 8: Enhanced RBAC - Shows environment type and highlights production warnings
 */

'use client';

import React from 'react';
import { AlertTriangle, Server, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnvironmentBadgeProps {
  environment?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EnvironmentBadge({
  environment = 'development',
  className,
  size = 'md'
}: EnvironmentBadgeProps) {
  const envType = environment.toLowerCase();

  const envConfig = {
    production: {
      icon: Server,
      label: 'Production',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      iconColor: 'text-red-600',
    },
    staging: {
      icon: Wrench,
      label: 'Staging',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      iconColor: 'text-amber-600',
    },
    development: {
      icon: Wrench,
      label: 'Development',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      iconColor: 'text-green-600',
    },
  };

  const config = envConfig[envType as keyof typeof envConfig] || envConfig.development;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-1.5 rounded-full font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(config.iconColor, iconSizes[size])} />
      <span>{config.label}</span>
    </div>
  );
}

interface DeveloperInProductionWarningProps {
  expiresAt?: string;
  className?: string;
}

export function DeveloperInProductionWarning({
  expiresAt,
  className
}: DeveloperInProductionWarningProps) {
  const getTimeRemaining = () => {
    if (!expiresAt) return 'Unknown';

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={cn(
      'inline-flex items-center space-x-2 px-3 py-1 rounded-full',
      'bg-red-100 text-red-700 border border-red-300 text-xs font-medium',
      className
    )}>
      <AlertTriangle className="h-4 w-4 animate-pulse" />
      <span>Developer in Production</span>
      {expiresAt && (
        <span className="text-xs opacity-75">
          • Expires: {getTimeRemaining()}
        </span>
      )}
    </div>
  );
}
