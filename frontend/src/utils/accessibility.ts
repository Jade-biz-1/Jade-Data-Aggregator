/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

/**
 * Check if color contrast ratio meets WCAG AA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Object with contrast ratio and compliance status
 */
export const checkColorContrast = (
  foreground: string,
  background: string
): { ratio: number; isCompliant: boolean; level: 'AAA' | 'AA' | 'Fail' } => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    isCompliant: ratio >= 4.5, // WCAG AA for normal text
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
  };
};

/**
 * Generate accessible label for form inputs
 * @param id - Input element ID
 * @param label - Label text
 * @param required - Whether field is required
 * @param description - Optional description
 */
export const generateAccessibleLabel = (
  id: string,
  label: string,
  required: boolean = false,
  description?: string
) => {
  return {
    id: `${id}-label`,
    htmlFor: id,
    'aria-label': label,
    'aria-required': required,
    'aria-describedby': description ? `${id}-description` : undefined,
  };
};

/**
 * Check if element is keyboard accessible
 * @param element - HTML element to check
 */
export const isKeyboardAccessible = (element: HTMLElement): boolean => {
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive =
    element.tagName === 'A' ||
    element.tagName === 'BUTTON' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA';

  return isInteractive || (tabIndex !== null && parseInt(tabIndex) >= 0);
};

/**
 * Get ARIA attributes for button states
 * @param isPressed - Whether button is pressed
 * @param isExpanded - Whether button controls expanded content
 * @param controls - ID of element controlled by button
 */
export const getButtonAriaAttributes = (
  isPressed?: boolean,
  isExpanded?: boolean,
  controls?: string
) => {
  return {
    'aria-pressed': isPressed !== undefined ? isPressed : undefined,
    'aria-expanded': isExpanded !== undefined ? isExpanded : undefined,
    'aria-controls': controls,
  };
};

/**
 * Generate unique ID for accessibility purposes
 * @param prefix - Prefix for the ID
 */
export const generateA11yId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Announce message to screen readers
 * @param message - Message to announce
 * @param priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

/**
 * Focus first focusable element in container
 * @param container - Container element
 */
export const focusFirstElement = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
};
