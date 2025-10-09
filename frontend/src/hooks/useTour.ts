'use client';

import { useState, useCallback } from 'react';
import { TourStep } from '@/components/ui/Tour';

export const useTour = (steps: TourStep[]) => {
  const [isOpen, setIsOpen] = useState(false);

  const start = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const reset = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    start,
    close,
    reset,
    steps,
  };
};

export default useTour;
