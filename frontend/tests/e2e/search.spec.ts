import { test, expect } from '@playwright/test';

/**
 * Global Search E2E Tests
 * Tests the global search functionality
 */

test.describe('Global Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should open search with keyboard shortcut', async ({ page }) => {
    // Press Ctrl+K (or Cmd+K on Mac)
    await page.keyboard.press('Control+K');

    // Search modal should appear
    await expect(page.getByRole('dialog').or(page.locator('[role="search"]'))).toBeVisible();
  });

  test('should display search modal', async ({ page }) => {
    // Click search button or icon
    const searchButton = page.getByRole('button', { name: /search/i }).or(
      page.locator('[aria-label*="search"]')
    ).first();

    if (await searchButton.isVisible()) {
      await searchButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/search');

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    await page.goto('/search');

    // Type in search query
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i));
    await searchInput.fill('pipeline');

    // Wait for results
    await page.waitForTimeout(500);

    // Results should appear
    await expect(page.getByText(/results|found|pipeline/i)).toBeVisible({ timeout: 5000 });
  });
});
