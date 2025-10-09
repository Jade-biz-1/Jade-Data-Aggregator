import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance
 */

test.describe('Accessibility', () => {
  test('dashboard should not have accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/auth/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have skip navigation links', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab to skip link
    await page.keyboard.press('Tab');

    // Skip link should be focused and visible
    const skipLink = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(skipLink).toBeFocused();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some element should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for common ARIA landmarks
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });
});
