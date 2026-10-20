// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';

test.describe('Login - Negative and Edge', () => {
  test('Keyboard submit with Enter', async ({ page }) => {
    // 1. Fill fields and press Enter in password field
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(ACCOUNTS.customer.email);
    await page.getByTestId('login-password-input').fill(ACCOUNTS.customer.password);
    await page.getByTestId('login-password-input').press('Enter');

    // Form submits and logs in
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
