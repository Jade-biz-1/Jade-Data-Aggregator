/**
 * Unit tests for ThemeToggle component
 * Tests theme selection, dropdown interaction, and UI behavior
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Helper to render component with ThemeProvider
const renderWithTheme = () => {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial Rendering', () => {
    it('should render the theme toggle button', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toBeInTheDocument()
    })

    it('should show system theme icon by default', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('title', 'Current theme: System')
    })

    it('should not show dropdown menu initially', () => {
      renderWithTheme()

      // Dropdown should not be visible
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
      expect(screen.queryByText('Dark')).not.toBeInTheDocument()
      expect(screen.queryByText('System')).not.toBeInTheDocument()
    })
  })

  describe('Dropdown Interaction', () => {
    it('should open dropdown when toggle button is clicked', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // Dropdown options should now be visible
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })

    it('should close dropdown when toggle button is clicked again', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Open dropdown
      fireEvent.click(button)
      expect(screen.getByText('Light')).toBeInTheDocument()

      // Close dropdown
      fireEvent.click(button)
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })

    it('should close dropdown when backdrop is clicked', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // Dropdown is open
      expect(screen.getByText('Light')).toBeInTheDocument()

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0')
      expect(backdrop).toBeInTheDocument()
      fireEvent.click(backdrop!)

      // Dropdown should be closed
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })

    it('should close dropdown when a theme is selected', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // Select dark theme
      const darkOption = screen.getByText('Dark')
      fireEvent.click(darkOption)

      // Dropdown should be closed
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })
  })

  describe('Theme Selection', () => {
    it('should change to light theme when Light is clicked', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const lightOption = screen.getByText('Light')
      fireEvent.click(lightOption)

      // Button should now show light theme
      fireEvent.click(button)
      const lightButton = screen.getByText('Light').closest('button')
      expect(lightButton).toHaveClass('bg-blue-50')
    })

    it('should change to dark theme when Dark is clicked', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const darkOption = screen.getByText('Dark')
      fireEvent.click(darkOption)

      // Button should now show dark theme
      fireEvent.click(button)
      const darkButton = screen.getByText('Dark').closest('button')
      expect(darkButton).toHaveClass('dark:bg-blue-900/20')
    })

    it('should change to system theme when System is clicked', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // First change to light theme
      fireEvent.click(button)
      fireEvent.click(screen.getByText('Light'))

      // Then change back to system
      fireEvent.click(button)
      fireEvent.click(screen.getByText('System'))

      // Button should now show system theme
      fireEvent.click(button)
      const systemButton = screen.getByText('System').closest('button')
      expect(systemButton).toHaveClass('bg-blue-50')
    })

    it('should persist theme selection to localStorage', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const darkOption = screen.getByText('Dark')
      fireEvent.click(darkOption)

      expect(localStorage.getItem('theme')).toBe('dark')
    })
  })

  describe('Active Theme Indicator', () => {
    it('should show checkmark on currently selected theme', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // System should be active by default
      const systemButton = screen.getByText('System').closest('button')
      const checkmark = systemButton!.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkmark).toBeInTheDocument()
    })

    it('should move checkmark when theme changes', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Open and select dark theme
      fireEvent.click(button)
      fireEvent.click(screen.getByText('Dark'))

      // Reopen dropdown
      fireEvent.click(button)

      // Dark should now have the checkmark
      const darkButton = screen.getByText('Dark').closest('button')
      const checkmark = darkButton!.querySelector('svg path[d*="M5 13l4 4L19 7"]')
      expect(checkmark).toBeInTheDocument()
    })

    it('should highlight active theme with special styling', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // System is active by default
      const systemButton = screen.getByText('System').closest('button')
      expect(systemButton).toHaveClass('bg-blue-50')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for screen readers', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('should have title attribute showing current theme', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('title')
      expect(button.getAttribute('title')).toContain('Current theme:')
    })

    it('should update title when theme changes', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Change to dark theme
      fireEvent.click(button)
      fireEvent.click(screen.getByText('Dark'))

      expect(button).toHaveAttribute('title', 'Current theme: Dark')
    })

    it('should be keyboard accessible', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Button should be focusable
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Theme Icons', () => {
    it('should display correct icon for light theme', () => {
      localStorage.setItem('theme', 'light')
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('title', 'Current theme: Light')
    })

    it('should display correct icon for dark theme', () => {
      localStorage.setItem('theme', 'dark')
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('title', 'Current theme: Dark')
    })

    it('should display correct icon for system theme', () => {
      localStorage.setItem('theme', 'system')
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      expect(button).toHaveAttribute('title', 'Current theme: System')
    })

    it('should show all three theme icons in dropdown', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      // All three options should be present
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })
  })

  describe('Dropdown Styling', () => {
    it('should apply hover styles to non-active themes', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const lightButton = screen.getByText('Light').closest('button')
      expect(lightButton).toHaveClass('hover:bg-gray-50')
    })

    it('should apply different styles to active theme', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const systemButton = screen.getByText('System').closest('button')
      expect(systemButton).toHaveClass('bg-blue-50')
    })

    it('should position dropdown correctly', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')
      fireEvent.click(button)

      const dropdown = screen.getByText('Light').closest('div.absolute')
      expect(dropdown).toHaveClass('right-0')
      expect(dropdown).toHaveClass('mt-2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid clicking without errors', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Rapidly click multiple times
      expect(() => {
        fireEvent.click(button)
        fireEvent.click(button)
        fireEvent.click(button)
        fireEvent.click(button)
      }).not.toThrow()
    })

    it('should handle rapid theme changes', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      expect(() => {
        fireEvent.click(button)
        fireEvent.click(screen.getByText('Dark'))

        fireEvent.click(button)
        fireEvent.click(screen.getByText('Light'))

        fireEvent.click(button)
        fireEvent.click(screen.getByText('System'))
      }).not.toThrow()
    })

    it('should maintain state after multiple open/close cycles', () => {
      renderWithTheme()

      const button = screen.getByLabelText('Toggle theme')

      // Open and close multiple times
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Should still be able to select a theme
      fireEvent.click(button)
      const darkOption = screen.getByText('Dark')
      fireEvent.click(darkOption)

      expect(localStorage.getItem('theme')).toBe('dark')
    })
  })
})
