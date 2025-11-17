/**
 * E2E Test Helper Utilities
 * Phase 9B-1: E2E Testing Infrastructure
 */

import { Page, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

/**
 * Login helper function
 */
export async function login(page: Page, username: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard or home
  await page.waitForURL(/\/(dashboard|home)/);
}

/**
 * Login as specific role
 */
export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await login(page, user.username, user.password);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu-button"], button:has-text("admin"), button:has-text("dev"), button:has-text("viewer")');

  // Click logout
  await page.click('text=Sign out, text=Logout');

  // Wait for redirect to login
  await page.waitForURL('/auth/login');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentURL = page.url();
  return !currentURL.includes('/auth/login');
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Wait for toast/notification to appear
 */
export async function waitForToast(page: Page, message?: string) {
  const toastSelector = '[role="alert"], [data-testid="toast"], .toast';
  await page.waitForSelector(toastSelector, { state: 'visible' });

  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Fill form fields
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`[name="${name}"]`, value);
  }
}

/**
 * Click and confirm dialog
 */
export async function confirmDialog(page: Page, confirmText: string = 'Confirm') {
  await page.click(`text=${confirmText}, button:has-text("${confirmText}")`);
}

/**
 * Navigate to page and wait for load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page, tableSelector: string = 'table'): Promise<number> {
  const rows = await page.locator(`${tableSelector} tbody tr`).count();
  return rows;
}

/**
 * Click table row by text content
 */
export async function clickTableRow(page: Page, text: string) {
  await page.click(`table tbody tr:has-text("${text}")`);
}

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish(page: Page) {
  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '[data-testid="loading"]',
    '.loading',
    '.spinner',
    'text=Loading...',
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 2000 });
    } catch {
      // Selector not found or already hidden
    }
  }
}

/**
 * Check if navigation item is visible
 */
export async function hasNavigationItem(page: Page, itemName: string): Promise<boolean> {
  return isVisible(page, `nav a:has-text("${itemName}"), aside a:has-text("${itemName}")`);
}

/**
 * Check if user has specific role badge
 */
export async function hasRoleBadge(page: Page, role: string): Promise<boolean> {
  return isVisible(page, `[data-testid="role-badge"]:has-text("${role}")`);
}
