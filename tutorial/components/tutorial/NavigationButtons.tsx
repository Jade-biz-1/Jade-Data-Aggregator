'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface NavigationButtonsProps {
  previousUrl?: string;
  nextUrl?: string;
  previousLabel?: string;
  nextLabel?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  showComplete?: boolean;
  disabled?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  previousUrl,
  nextUrl,
  previousLabel = 'Previous Lesson',
  nextLabel = 'Next Lesson',
  onComplete,
  isCompleted = false,
  showComplete = true,
  disabled = false,
}) => {
  const router = useRouter();

  const handlePrevious = () => {
    if (previousUrl) {
      router.push(previousUrl);
    }
  };

  const handleNext = () => {
    if (nextUrl) {
      router.push(nextUrl);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mt-8 pt-8 border-t border-gray-200">
      {/* Previous Button */}
      <div className="flex-1">
        {previousUrl ? (
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={disabled}
            className="w-full sm:w-auto"
            aria-label={previousLabel}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {previousLabel}
          </Button>
        ) : (
          <div></div>
        )}
      </div>

      {/* Complete Button (Center) */}
      {showComplete && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={disabled || isCompleted}
            className={`w-full sm:w-auto ${isCompleted ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
            aria-label={isCompleted ? 'Lesson Completed' : 'Mark Lesson as Complete'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isCompleted ? 'Completed' : 'Mark as Complete'}
          </Button>
        </div>
      )}

      {/* Next Button */}
      <div className="flex-1 flex justify-end">
        {nextUrl ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={disabled}
            className="w-full sm:w-auto"
            aria-label={nextLabel}
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};
