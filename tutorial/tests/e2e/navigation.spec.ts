import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test('should navigate to home page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Data Aggregator/);
        // Add more specific checks based on actual content
    });

    test('should navigate to modules page', async ({ page }) => {
        await page.goto('/modules');
        // Verify modules page content
        // await expect(page.getByText('Learning Modules')).toBeVisible(); 
        // Note: Adjust selector based on actual content
    });
});
