import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Add custom render function that includes providers if needed
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }
