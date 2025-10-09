import { Page } from '@playwright/test';

/**
 * Authentication Helper Functions for E2E Tests
 */

export interface TestUser {
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
}

/**
 * Default test users
 */
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin' as const,
  },
  editor: {
    email: 'editor@test.com',
    password: 'editor123',
    role: 'editor' as const,
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'viewer123',
    role: 'viewer' as const,
  },
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/auth/login');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try clicking user menu first
    const userMenu = page.getByRole('button', { name: /user|account|profile/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    }
  }

  // Wait for redirect to login
  await page.waitForURL('/auth/login', { timeout: 5000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for auth token in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    });

    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get current user info from localStorage
 */
export async function getCurrentUser(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
}
