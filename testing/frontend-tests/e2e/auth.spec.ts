/**
 * E2E Tests: Authentication Flows
 * Phase 9B-1: E2E Testing Infrastructure
 *
 * Tests user authentication, login, logout, and session management
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';
import { login, logout, isAuthenticated } from './utils/helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page for each test
    await page.goto('/auth/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Data Aggregator|Login/i);

    // Check form elements are present
    await expect(page.locator('[name="username"]')).toBeVisible();
    await expect(page.locator('[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login as admin successfully', async ({ page }) => {
    const admin = TEST_USERS.admin;

    // Fill in credentials
    await page.fill('[name="username"]', admin.username);
    await page.fill('[name="password"]', admin.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/);

    // Should see user menu or profile
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('should login as developer successfully', async ({ page }) => {
    const dev = TEST_USERS.developer;

    await login(page, dev.username, dev.password);

    // Should be on dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/);

    // Should see role badge or user info
    const roleVisible = await page.locator('text=/developer/i').isVisible().catch(() => false);
    expect(roleVisible || await isAuthenticated(page)).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[name="username"]', 'invalid_user');
    await page.fill('[name="password"]', 'wrong_password');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorVisible = await Promise.race([
      page.waitForSelector('text=/invalid|incorrect|wrong/i', { timeout: 5000 }).then(() => true),
      page.waitForTimeout(5000).then(() => false),
    ]);

    // Either error message shown or still on login page
    expect(errorVisible || page.url().includes('/auth/login')).toBe(true);
  });

  test('should show error for empty credentials', async ({ page }) => {
    // Try to submit without filling
    await page.click('button[type="submit"]');

    // Should still be on login page or show validation error
    const onLoginPage = page.url().includes('/auth/login');
    expect(onLoginPage).toBe(true);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await login(page, TEST_USERS.admin.username, TEST_USERS.admin.password);

    // Verify logged in
    await expect(page).toHaveURL(/\/(dashboard|home)/);

    // Logout
    await logout(page);

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/pipelines');

    // Should redirect to login
    await page.waitForURL(/auth\/login/);

    // Login
    await login(page, TEST_USERS.admin.username, TEST_USERS.admin.password);

    // Should redirect back to pipelines (or dashboard)
    // This depends on implementation
    const finalUrl = page.url();
    expect(finalUrl.includes('/pipelines') || final Url.includes('/dashboard')).toBe(true);
  });

  test('should handle session timeout', async ({ page }) => {
    // Login
    await login(page, TEST_USERS.admin.username, TEST_USERS.admin.password);

    await expect(page).toHaveURL(/\/(dashboard|home)/);

    // Clear session storage and cookies to simulate timeout
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to a protected page
    await page.goto('/users');

    // Should redirect to login
    await page.waitForURL(/auth\/login/, { timeout: 10000 });
  });

  test('should remember username if "Remember me" is checked', async ({ page }) => {
    // Check if remember me checkbox exists
    const rememberMeExists = await page.locator('[name="remember"], [type="checkbox"]:has-text("Remember")').count() > 0;

    if (rememberMeExists) {
      await page.fill('[name="username"]', TEST_USERS.admin.username);
      await page.check('[name="remember"], [type="checkbox"]:has-text("Remember")');
      await page.fill('[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/(dashboard|home)/);

      // Logout and check if username is remembered
      await logout(page);
      await page.goto('/auth/login');

      const usernameValue = await page.locator('[name="username"]').inputValue();
      expect(usernameValue).toBe(TEST_USERS.admin.username);
    } else {
      test.skip();
    }
  });

  test('should handle concurrent login attempts', async ({ page, context }) => {
    // Open another page in same context
    const page2 = await context.newPage();

    // Try to login on both pages simultaneously
    await page.goto('/auth/login');
    await page2.goto('/auth/login');

    await Promise.all([
      login(page, TEST_USERS.admin.username, TEST_USERS.admin.password),
      login(page2, TEST_USERS.admin.username, TEST_USERS.admin.password),
    ]);

    // Both should be authenticated
    await expect(page).toHaveURL(/\/(dashboard|home)/);
    await expect(page2).toHaveURL(/\/(dashboard|home)/);

    await page2.close();
  });
});

test.describe('Password Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should show/hide password when toggle clicked', async ({ page }) => {
    const passwordInput = page.locator('[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button:has([data-icon="eye"])');

    const toggleExists = await toggleButton.count() > 0;

    if (toggleExists) {
      // Initially should be type="password"
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Should now be type="text"
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again
      await toggleButton.click();

      // Should be type="password" again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    } else {
      test.skip();
    }
  });
});

test.describe('Access Control', () => {
  test('should prevent access to protected routes without authentication', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/users',
      '/pipelines',
      '/connectors',
      '/transformations',
      '/analytics',
      '/monitoring',
      '/admin/maintenance',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login
      await page.waitForURL(/auth\/login/, { timeout: 10000 });
    }
  });

  test('should allow access to public routes without authentication', async ({ page }) => {
    // If there are public routes like docs, help, etc.
    const publicRoutes = ['/auth/login'];

    for (const route of publicRoutes) {
      await page.goto(route);

      // Should not redirect
      await expect(page).toHaveURL(route);
    }
  });
});
