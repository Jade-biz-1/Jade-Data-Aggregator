'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SkipLink } from '@/components/ui/SkipLink';
import { NavigationProgress } from '@/components/ui/NavigationProgress';
import { initSentryClient } from '../../lib/sentry';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  // OBS-002: Initialise Sentry once on the client side.
  useEffect(() => {
    initSentryClient();
  }, []);

  return (
    <ThemeProvider>
      <NavigationProgress />
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      {children}
    </ThemeProvider>
  );
}