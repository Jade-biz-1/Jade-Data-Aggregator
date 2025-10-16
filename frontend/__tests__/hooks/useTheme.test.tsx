/**
 * Unit tests for useTheme hook and ThemeContext
 * Phase 9 Sprint 3: Dark Mode Testing
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme, type Theme } from '@/contexts/ThemeContext';

describe('ThemeContext and useTheme Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  describe('ThemeProvider Initialization', () => {
    it('should initialize with system theme by default', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
    });

    it('should load theme from localStorage if present', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });
    });

    it('should ignore invalid theme values from localStorage', async () => {
      localStorage.setItem('theme', 'invalid-theme');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Should fallback to system
      expect(result.current.theme).toBe('system');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light theme', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.effectiveTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should switch to dark theme', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.effectiveTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should switch to system theme', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(localStorage.getItem('theme')).toBe('system');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark mode preference', () => {
      // Mock matchMedia to simulate dark mode
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // When theme is 'system', it should match system preference
      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should detect system light mode preference', () => {
      // Mock matchMedia to simulate light mode
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false, // Not dark mode
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should update when system theme changes', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.effectiveTheme).toBe('light');

      // Simulate system theme change
      mockMediaQueryList.matches = true;
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1];
      
      act(() => {
        changeHandler();
      });

      expect(result.current.effectiveTheme).toBe('dark');
    });

  });

  describe('DOM Manipulation', () => {
    it('should apply light class to document root', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark class to document root', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should remove previous theme class when switching themes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist theme preference to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should persist multiple theme changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      const themes: Theme[] = ['light', 'dark', 'system', 'light'];

      themes.forEach((theme) => {
        act(() => {
          result.current.setTheme(theme);
        });

        expect(localStorage.getItem('theme')).toBe(theme);
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTheme is used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      console.error = consoleError;
    });
  });

  describe('isDark Helper', () => {
    it('should return true when effectiveTheme is dark', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.isDark).toBe(true);
    });

    it('should return false when effectiveTheme is light', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.isDark).toBe(false);
    });
  });

  describe('Meta Theme Color', () => {
    it('should update meta theme-color for dark mode', () => {
      // Create meta tag
      const metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      metaTag.content = '#ffffff';
      document.head.appendChild(metaTag);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      const updatedMetaTag = document.querySelector('meta[name="theme-color"]');
      expect(updatedMetaTag?.getAttribute('content')).toBe('#1f2937');

      // Cleanup
      document.head.removeChild(metaTag);
    });

    it('should update meta theme-color for light mode', () => {
      // Create meta tag
      const metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      metaTag.content = '#1f2937';
      document.head.appendChild(metaTag);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      const updatedMetaTag = document.querySelector('meta[name="theme-color"]');
      expect(updatedMetaTag?.getAttribute('content')).toBe('#ffffff');

      // Cleanup
      document.head.removeChild(metaTag);
    });

    it('should not crash if meta theme-color tag does not exist', () => {
      // Ensure meta tag doesn't exist
      const existingMeta = document.querySelector('meta[name="theme-color"]');
      if (existingMeta) {
        document.head.removeChild(existingMeta);
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(() => {
        act(() => {
          result.current.setTheme('dark');
        });
      }).not.toThrow();
    });
  });

  describe('Theme Value Validation', () => {
    it('should accept all valid theme values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      const validThemes: Theme[] = ['light', 'dark', 'system'];

      validThemes.forEach((theme) => {
        act(() => {
          result.current.setTheme(theme);
        });

        expect(result.current.theme).toBe(theme);
      });
    });
  });

  describe('Concurrent Theme Changes', () => {
    it('should handle rapid theme changes correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
        result.current.setTheme('light');
        result.current.setTheme('system');
      });

      // Last theme should win
      expect(result.current.theme).toBe('system');
      expect(localStorage.getItem('theme')).toBe('system');
    });
  });
});
