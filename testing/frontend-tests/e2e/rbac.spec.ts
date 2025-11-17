/**
 * E2E Tests: RBAC Enforcement
 * Phase 9B-1: E2E Testing Infrastructure
 *
 * Tests role-based access control across the application
 */

import { test, expect } from '@playwright/test';
import { loginAs, hasNavigationItem } from './utils/helpers';

test.describe('RBAC: Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('admin sees all navigation items', async ({ page }) => {
    const expectedItems = [
      'Dashboard',
      'Pipelines',
      'Connectors',
      'Transformations',
      'Analytics',
      'Monitoring',
      'Users',
      'Maintenance',
    ];

    for (const item of expectedItems) {
      const hasItem = await hasNavigationItem(page, item);
      expect(hasItem).toBe(true);
    }
  });

  test('admin can access all pages', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/pipelines',
      '/connectors',
      '/transformations',
      '/analytics',
      '/monitoring',
      '/users',
      '/admin/maintenance',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Should not be redirected to login or access denied
      expect(page.url()).toContain(route);
    }
  });
});

test.describe('RBAC: Developer Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'developer');
  });

  test('developer has limited navigation', async ({ page }) => {
    // Should see
    const shouldSee = ['Dashboard', 'Pipelines', 'Connectors', 'Transformations'];

    for (const item of shouldSee) {
      expect(await hasNavigationItem(page, item)).toBe(true);
    }

    // Should NOT see
    const shouldNotSee = ['Users', 'Maintenance'];

    for (const item of shouldNotSee) {
      expect(await hasNavigationItem(page, item)).toBe(false);
    }
  });

  test('developer cannot access user management', async ({ page }) => {
    await page.goto('/users');

    // Should be denied or redirected
    const onUsersPage = page.url().includes('/users') && !page.url().includes('/login');
    const hasAccessDenied = await page.locator('text=/access denied|unauthorized/i').isVisible().catch(() => false);

    expect(!onUsersPage || hasAccessDenied).toBe(true);
  });

  test('developer cannot access maintenance', async ({ page }) => {
    await page.goto('/admin/maintenance');

    const onMaintenancePage = page.url().includes('/maintenance') && !page.url().includes('/login');
    const hasAccessDenied = await page.locator('text=/access denied|unauthorized/i').isVisible().catch(() => false);

    expect(!onMaintenancePage || hasAccessDenied).toBe(true);
  });
});

test.describe('RBAC: Viewer Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'viewer');
  });

  test('viewer has read-only access', async ({ page }) => {
    await page.goto('/pipelines');

    // Create/Edit/Delete buttons should be disabled or hidden
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")');
    const editButtons = page.locator('button:has-text("Edit")');
    const deleteButtons = page.locator('button:has-text("Delete")');

    const hasCreate = await createButton.count() > 0;
    if (hasCreate) {
      expect(await createButton.isDisabled()).toBe(true);
    }

    const hasEdit = await editButtons.count() > 0;
    if (hasEdit) {
      expect(await editButtons.first().isDisabled()).toBe(true);
    }

    const hasDelete = await deleteButtons.count() > 0;
    if (hasDelete) {
      expect(await deleteButtons.first().isDisabled()).toBe(true);
    }
  });

  test('viewer cannot access users page', async ({ page }) => {
    await page.goto('/users');

    const onUsersPage = page.url().includes('/users') && !page.url().includes('/login');
    const hasAccessDenied = await page.locator('text=/access denied|unauthorized/i').isVisible().catch(() => false);

    expect(!onUsersPage || hasAccessDenied).toBe(true);
  });
});

test.describe('RBAC: Executor Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'executor');
  });

  test('executor can run but not edit pipelines', async ({ page }) => {
    await page.goto('/pipelines');

    // Run/Execute buttons should be enabled
    const runButtons = page.locator('button:has-text("Run"), button:has-text("Execute")');
    const hasRun = await runButtons.count() > 0;

    if (hasRun) {
      expect(await runButtons.first().isEnabled()).toBe(true);
    }

    // Edit button should be disabled
    const editButtons = page.locator('button:has-text("Edit")');
    const hasEdit = await editButtons.count() > 0;

    if (hasEdit) {
      expect(await editButtons.first().isDisabled()).toBe(true);
    }
  });
});

test.describe('RBAC: Executive Role', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'executive');
  });

  test('executive only sees analytics and monitoring', async ({ page }) => {
    // Should see analytics
    expect(await hasNavigationItem(page, 'Analytics')).toBe(true);

    // Should NOT see operational items
    expect(await hasNavigationItem(page, 'Pipelines')).toBe(false);
    expect(await hasNavigationItem(page, 'Connectors')).toBe(false);
    expect(await hasNavigationItem(page, 'Users')).toBe(false);
  });

  test('executive has read-only analytics access', async ({ page }) => {
    await page.goto('/analytics');

    // Should be able to view
    const onAnalyticsPage = page.url().includes('/analytics');
    expect(onAnalyticsPage).toBe(true);

    // No create/edit buttons
    const actionButtons = page.locator('button:has-text("Create"), button:has-text("Edit"), button:has-text("Delete")');
    const hasActions = await actionButtons.count();
    expect(hasActions).toBe(0);
  });
});
