'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
  };

  const startProgress = () => {
    clearTimers();
    started.current = true;
    setVisible(true);
    setProgress(15);
    // Ease toward 85% — never reaching 100 until navigation completes
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return prev;
        return prev + (85 - prev) * 0.12;
      });
    }, 120);
  };

  const completeProgress = () => {
    clearTimers();
    setProgress(100);
    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      started.current = false;
    }, 350);
  };

  // Listen for clicks on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Only internal non-anchor links
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      startProgress();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Complete when the route actually changes
  useEffect(() => {
    if (started.current) {
      completeProgress();
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
    >
      <div
        className="h-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
