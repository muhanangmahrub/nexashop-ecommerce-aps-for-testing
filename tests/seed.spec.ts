import { test, expect } from './fixtures';

// Seed for Playwright agents: guest visitor on the home page, cookie banner pre-dismissed.
test.describe('Seed', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NexaShop/i);
  });
});
