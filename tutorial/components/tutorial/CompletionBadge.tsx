'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Award,
  Trophy,
  Star,
  Zap,
  Target,
  Gem,
  Crown,
  Flame,
  Rocket,
  Medal,
} from 'lucide-react';

export type BadgeType =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'master'
  | 'expert'
  | 'achievement'
  | 'milestone'
  | 'special';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  icon?: string;
  earned: boolean;
  earnedDate?: Date;
  progress?: number; // 0-100
  requirement?: string;
}

interface CompletionBadgeProps {
  badge: BadgeData;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

const iconMap = {
  award: Award,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  gem: Gem,
  crown: Crown,
  flame: Flame,
  rocket: Rocket,
  medal: Medal,
};

const typeConfig = {
  beginner: {
    color: 'bg-green-100 text-green-700 border-green-300',
    earnedColor: 'bg-green-500 text-white',
    defaultIcon: 'star',
  },
  intermediate: {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    earnedColor: 'bg-blue-500 text-white',
    defaultIcon: 'target',
  },
  advanced: {
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    earnedColor: 'bg-purple-500 text-white',
    defaultIcon: 'zap',
  },
  master: {
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    earnedColor: 'bg-orange-500 text-white',
    defaultIcon: 'flame',
  },
  expert: {
    color: 'bg-red-100 text-red-700 border-red-300',
    earnedColor: 'bg-red-500 text-white',
    defaultIcon: 'crown',
  },
  achievement: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    earnedColor: 'bg-yellow-500 text-white',
    defaultIcon: 'trophy',
  },
  milestone: {
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    earnedColor: 'bg-indigo-500 text-white',
    defaultIcon: 'medal',
  },
  special: {
    color: 'bg-pink-100 text-pink-700 border-pink-300',
    earnedColor: 'bg-gradient-to-br from-pink-500 to-purple-500 text-white',
    defaultIcon: 'gem',
  },
};

export const CompletionBadge: React.FC<CompletionBadgeProps> = ({
  badge,
  size = 'md',
  showProgress = true,
  onClick,
}) => {
  const config = typeConfig[badge.type];
  const IconComponent = iconMap[badge.icon as keyof typeof iconMap] || iconMap[config.defaultIcon as keyof typeof iconMap];

  const sizeClasses = {
    sm: {
      card: 'p-3',
      icon: 'w-8 h-8',
      iconContainer: 'w-12 h-12',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      card: 'p-4',
      icon: 'w-10 h-10',
      iconContainer: 'w-16 h-16',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      card: 'p-6',
      icon: 'w-12 h-12',
      iconContainer: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <Card
      className={`${classes.card} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${
        badge.earned ? 'border-2 border-primary-200' : 'opacity-60'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`
            ${classes.iconContainer} rounded-full flex items-center justify-center border-2
            ${badge.earned ? config.earnedColor : config.color}
            ${!badge.earned ? 'grayscale' : ''}
          `}
        >
          <IconComponent className={classes.icon} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-gray-900 ${classes.title}`}>
              {badge.name}
            </h4>
            <Badge
              variant={badge.earned ? 'success' : 'default'}
              className="flex-shrink-0 text-xs"
            >
              {badge.earned ? 'Earned' : 'Locked'}
            </Badge>
          </div>

          <p className={`text-gray-600 ${classes.description} mb-2`}>
            {badge.description}
          </p>

          {/* Progress Bar */}
          {showProgress && !badge.earned && badge.progress !== undefined && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{badge.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Requirement */}
          {badge.requirement && !badge.earned && (
            <p className="text-xs text-gray-500 italic">
              {badge.requirement}
            </p>
          )}

          {/* Earned Date */}
          {badge.earned && badge.earnedDate && (
            <p className="text-xs text-gray-500">
              Earned on {badge.earnedDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Component for displaying multiple badges in a grid
interface BadgeGridProps {
  badges: BadgeData[];
  columns?: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  onBadgeClick?: (badge: BadgeData) => void;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  columns = 3,
  size = 'md',
  onBadgeClick,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {badges.map((badge) => (
        <CompletionBadge
          key={badge.id}
          badge={badge}
          size={size}
          onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
        />
      ))}
    </div>
  );
};
