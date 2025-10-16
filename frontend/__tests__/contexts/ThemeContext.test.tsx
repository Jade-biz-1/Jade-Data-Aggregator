/**
 * Unit tests for ThemeContext and useTheme hook
 * Tests dark mode functionality, theme persistence, and system theme detection
 */

import React from 'react'
import { renderHook, act, render, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme, Theme } from '@/contexts/ThemeContext'

describe('ThemeContext', () => {
  let mockMatchMedia: jest.Mock

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Mock matchMedia
    mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
    window.matchMedia = mockMatchMedia

    // Clear document classes
    document.documentElement.classList.remove('light', 'dark')

    // Mock meta theme-color
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.remove()
    }
  })

  describe('ThemeProvider Initialization', () => {
    it('should initialize with system theme by default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('system')
    })

    it('should load theme from localStorage if available', () => {
      localStorage.setItem('theme', 'dark')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should ignore invalid theme values from localStorage', () => {
      localStorage.setItem('theme', 'invalid-theme')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('system')
    })
  })

  describe('useTheme Hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within a ThemeProvider')

      console.error = originalError
    })

    it('should provide theme context values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('setTheme')
      expect(result.current).toHaveProperty('isDark')
      expect(result.current).toHaveProperty('effectiveTheme')
    })
  })

  describe('Theme Setting', () => {
    it('should update theme when setTheme is called', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should persist theme to localStorage when changed', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should update theme multiple times', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.setTheme('system')
      })
      expect(result.current.theme).toBe('system')
    })
  })

  describe('Effective Theme Calculation', () => {
    it('should set effective theme to light when theme is light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.effectiveTheme).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    it('should set effective theme to dark when theme is dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.effectiveTheme).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    it('should use system preference when theme is system (light)', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: false, // System prefers light
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('system')
      })

      expect(result.current.effectiveTheme).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    it('should use system preference when theme is system (dark)', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // System prefers dark
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('system')
      })

      expect(result.current.effectiveTheme).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('System Theme Change Detection', () => {
    it('should listen to system theme changes when using system theme', () => {
      const addEventListenerSpy = jest.fn()

      mockMatchMedia.mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: addEventListenerSpy,
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('system')
      })

      // Verify that event listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should not respond to system changes when using explicit theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('light')
      })

      // Even if system changes, effective theme should stay light
      expect(result.current.effectiveTheme).toBe('light')
    })
  })

  describe('DOM Updates', () => {
    it('should add light class to document root when theme is light', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('light')
      })

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should add dark class to document root when theme is dark', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        expect(document.documentElement.classList.contains('light')).toBe(false)
      })
    })

    it('should update meta theme-color for light theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('light')
      })

      await waitFor(() => {
        const meta = document.querySelector('meta[name="theme-color"]')
        expect(meta?.getAttribute('content')).toBe('#ffffff')
      })
    })

    it('should update meta theme-color for dark theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      await waitFor(() => {
        const meta = document.querySelector('meta[name="theme-color"]')
        expect(meta?.getAttribute('content')).toBe('#1f2937')
      })
    })

    it('should handle missing meta theme-color gracefully', async () => {
      // Remove meta tag
      const meta = document.querySelector('meta[name="theme-color"]')
      meta?.remove()

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.setTheme('dark')
        })
      }).not.toThrow()
    })
  })

  describe('isDark Property', () => {
    it('should return false when effective theme is light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.isDark).toBe(false)
    })

    it('should return true when effective theme is dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.isDark).toBe(true)
    })

    it('should reflect system preference when using system theme', () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // System prefers dark
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('system')
      })

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Component Rendering', () => {
    it('should render children within ThemeProvider', () => {
      const TestComponent = () => {
        const { theme } = useTheme()
        return <div data-testid="test-child">Theme: {theme}</div>
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(getByTestId('test-child')).toBeInTheDocument()
    })

    it('should provide consistent theme context to multiple children', () => {
      const TestComponent1 = () => {
        const { theme, setTheme } = useTheme()
        return (
          <button data-testid="btn1" onClick={() => setTheme('dark')}>
            Theme 1: {theme}
          </button>
        )
      }

      const TestComponent2 = () => {
        const { theme } = useTheme()
        return <div data-testid="div2">Theme 2: {theme}</div>
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent1 />
          <TestComponent2 />
        </ThemeProvider>
      )

      const btn1 = getByTestId('btn1')
      const div2 = getByTestId('div2')

      expect(btn1).toHaveTextContent('Theme 1: system')
      expect(div2).toHaveTextContent('Theme 2: system')

      // Click button to change theme
      act(() => {
        btn1.click()
      })

      // Both components should reflect the change
      expect(btn1).toHaveTextContent('Theme 1: dark')
      expect(div2).toHaveTextContent('Theme 2: dark')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
        result.current.setTheme('light')
        result.current.setTheme('system')
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should maintain theme across re-renders', () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      rerender()

      expect(result.current.theme).toBe('dark')
    })
  })
})
