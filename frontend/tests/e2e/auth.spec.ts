import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests the critical user authentication journey
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/login');

    // Click submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click register link
    await page.getByRole('link', { name: /sign up/i }).click();

    // Verify navigation to register page
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/auth/register');

    // Check for register form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should handle login with test credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for potential redirect or error message
    await page.waitForURL(/\/(dashboard|auth\/login)/, { timeout: 5000 });
  });
});
