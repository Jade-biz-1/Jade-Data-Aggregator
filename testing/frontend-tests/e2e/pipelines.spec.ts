import { test, expect } from '@playwright/test';

/**
 * Pipelines E2E Tests
 * Tests pipeline management functionality
 */

test.describe('Pipelines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pipelines');
  });

  test('should display pipelines page', async ({ page }) => {
    await expect(page).toHaveURL(/\/pipelines/);
    await expect(page.getByRole('heading', { name: /pipelines/i })).toBeVisible();
  });

  test('should display create pipeline button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new pipeline/i });
    await expect(createButton).toBeVisible();
  });

  test('should display pipelines table or list', async ({ page }) => {
    // Look for table or list container
    const table = page.getByRole('table').or(
      page.locator('[data-testid="pipelines-list"]')
    );

    // Wait for table to load
    await expect(table.or(page.getByText(/no pipelines/i))).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to pipeline builder', async ({ page }) => {
    // Click on pipeline builder link or button
    const builderLink = page.getByRole('link', { name: /builder|create/i }).first();

    if (await builderLink.isVisible()) {
      await builderLink.click();
      await expect(page).toHaveURL(/\/pipeline-builder|\/pipelines\/create/);
    }
  });

  test('should have search/filter functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(
      page.getByRole('searchbox')
    );

    // Search input should exist
    await expect(searchInput.or(page.locator('input[type="search"]'))).toBeVisible({ timeout: 5000 });
  });
});
