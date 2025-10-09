'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

export interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const Tour: React.FC<TourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (!isOpen || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (!target || !tooltipRef.current) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const offset = step.offset ?? 16;

      let top = 0;
      let left = 0;

      switch (step.placement ?? 'bottom') {
        case 'top':
          top = targetRect.top - tooltipRect.height - offset;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + offset;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - offset;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + offset;
          break;
      }

      // Keep tooltip within viewport
      top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

      setPosition({ top, left });

      // Add highlight to target element
      target.classList.add('tour-highlight');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      const target = document.querySelector(step.target);
      if (target) {
        target.classList.remove('tour-highlight');
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStep, step]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 animate-fadeIn" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-scaleIn"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            id="tour-title"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
          >
            {step.title}
          </h3>
          <p
            id="tour-content"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {step.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 inline ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tour;
