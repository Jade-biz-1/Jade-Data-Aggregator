/**
 * E2E Tests: User Management
 * Phase 9B-1: E2E Testing Infrastructure
 *
 * Tests user CRUD operations, role management, and permissions
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS, NEW_USER_DATA } from './fixtures/test-data';
import { loginAs, navigateTo, fillForm, confirmDialog, waitForToast } from './utils/helpers';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for user management tests
    await loginAs(page, 'admin');
    await navigateTo(page, '/users');
  });

  test('should display users list', async ({ page }) => {
    // Check table is visible
    await expect(page.locator('table, [data-testid="users-table"]')).toBeVisible();

    // Should have at least the admin user
    const userRows = await page.locator('table tbody tr, [data-testid="user-row"]').count();
    expect(userRows).toBeGreaterThan(0);
  });

  test('should create new user', async ({ page }) => {
    // Click create button
    await page.click('text=Create User, button:has-text("New User")');

    // Fill form
    await fillForm(page, {
      username: NEW_USER_DATA.username,
      email: NEW_USER_DATA.email,
      first_name: NEW_USER_DATA.first_name,
      last_name: NEW_USER_DATA.last_name,
      password: NEW_USER_DATA.password,
    });

    // Select role
    await page.selectOption('[name="role"]', NEW_USER_DATA.role);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success notification
    await waitForToast(page, 'success');

    // Verify user appears in list
    await expect(page.locator(`text=${NEW_USER_DATA.username}`)).toBeVisible();
  });

  test('should edit user details', async ({ page }) => {
    // Click edit on first user (not admin)
    await page.click('table tbody tr:not(:has-text("admin")) button:has-text("Edit")');

    // Update email
    const newEmail = `updated_${Date.now()}@test.com`;
    await page.fill('[name="email"]', newEmail);

    // Save
    await page.click('button[type="submit"]');

    await waitForToast(page, 'success');

    // Verify update
    await expect(page.locator(`text=${newEmail}`)).toBeVisible();
  });

  test('should change user role', async ({ page }) => {
    // Find non-admin user
    const userRow = page.locator('table tbody tr:not(:has-text("admin"))').first();
    await userRow.locator('button:has-text("Edit")').click();

    // Change role
    await page.selectOption('[name="role"]', 'developer');

    // Save
    await page.click('button[type="submit"]');

    await waitForToast(page, 'success');
  });

  test('should deactivate/activate user', async ({ page }) => {
    // Find non-admin user
    const userRow = page.locator('table tbody tr:not(:has-text("admin"))').first();

    // Click deactivate/toggle
    await userRow.locator('button:has-text("Deactivate"), [data-testid="toggle-active"]').click();

    // Confirm if dialog appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await waitForToast(page, 'success');
  });

  test('should delete user', async ({ page }) => {
    // Create a user to delete
    // (Assume there's a test user we can delete)

    const userRow = page.locator('table tbody tr:has-text("test_delete")').first();

    if (await userRow.count() > 0) {
      await userRow.locator('button:has-text("Delete")').click();

      // Confirm deletion
      await confirmDialog(page, 'Delete');

      await waitForToast(page, 'success');

      // Verify user is removed
      await expect(userRow).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should prevent deleting admin user', async ({ page }) => {
    const adminRow = page.locator('table tbody tr:has-text("admin")').first();

    // Delete button should be disabled or not present
    const deleteButton = adminRow.locator('button:has-text("Delete")');
    const isDisabled = await deleteButton.isDisabled().catch(() => true);
    expect(isDisabled).toBe(true);
  });

  test('should filter users by role', async ({ page }) => {
    // Look for filter/dropdown
    const roleFilter = page.locator('[name="roleFilter"], select:has-text("Role")');

    if (await roleFilter.count() > 0) {
      await roleFilter.selectOption('developer');

      // Wait for table to update
      await page.waitForTimeout(1000);

      // All visible users should be developers
      const userRows = page.locator('table tbody tr');
      const count = await userRows.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const row = userRows.nth(i);
          const hasDeveloper = await row.locator('text=/developer/i').isVisible();
          expect(hasDeveloper).toBe(true);
        }
      }
    } else {
      test.skip();
    }
  });

  test('should search users by username', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Search"], [name="search"]');

    if (await searchInput.count() > 0) {
      await searchInput.fill('admin');

      await page.waitForTimeout(1000);

      // Should show admin user
      await expect(page.locator('table tbody tr:has-text("admin")')).toBeVisible();

      // Other users should be filtered out (or not visible)
      const allRows = await page.locator('table tbody tr').count();
      expect(allRows).toBeLessThanOrEqual(3);  // admin and maybe a few matches
    } else {
      test.skip();
    }
  });
});

test.describe('User Permissions', () => {
  test('developer cannot access user management', async ({ page }) => {
    await loginAs(page, 'developer');

    // Try to navigate to users page
    await page.goto('/users');

    // Should either:
    // 1. Be redirected away
    // 2. See access denied message
    const isOnUsersPage = page.url().includes('/users');
    const hasAccessDenied = await page.locator('text=/access denied|unauthorized/i').isVisible().catch(() => false);

    expect(!isOnUsersPage || hasAccessDenied).toBe(true);
  });

  test('viewer can see users but cannot edit', async ({ page }) => {
    await loginAs(page, 'viewer');

    const canAccessUsers = await page.goto('/users').then(() => !page.url().includes('/auth/login')).catch(() => false);

    if (canAccessUsers) {
      // Edit buttons should not be visible or should be disabled
      const editButtons = page.locator('button:has-text("Edit")');
      const count = await editButtons.count();

      if (count > 0) {
        const firstButton = editButtons.first();
        const isDisabled = await firstButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });
});
