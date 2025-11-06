'use client';

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SkipLink } from '@/components/ui/SkipLink';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      {children}
    </ThemeProvider>
  );
}