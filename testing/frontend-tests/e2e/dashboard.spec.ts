import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Tests the main dashboard functionality
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add authentication helper once auth is set up
    // For now, navigate directly to dashboard
    await page.goto('/dashboard');
  });

  test('should display dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for main dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Look for common dashboard metrics
    const statsCards = page.locator('[data-testid="stat-card"]').or(
      page.locator('.card').filter({ hasText: /total|active|pipelines|connectors/i })
    );

    // Should have at least one stat card
    await expect(statsCards.first()).toBeVisible();
  });

  test('should navigate to pipelines page', async ({ page }) => {
    // Click on pipelines link
    const pipelinesLink = page.getByRole('link', { name: /pipelines/i });
    await pipelinesLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/pipelines/);
  });

  test('should navigate to connectors page', async ({ page }) => {
    // Click on connectors link
    const connectorsLink = page.getByRole('link', { name: /connectors/i });
    await connectorsLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/connectors/);
  });

  test('should have responsive sidebar navigation', async ({ page }) => {
    // Check for navigation sidebar
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();

    // Verify key navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pipelines/i })).toBeVisible();
  });
});
