// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Positive', () => {
  test('Email is case-insensitive and trimmed', async ({ page }) => {
    // 1. Login with '  CUSTOMER1@NEXASHOP.TEST  ' and Customer@123
    await page.goto('/login');
    await submitLogin(page, '  CUSTOMER1@NEXASHOP.TEST  ', ACCOUNTS.customer.password);

    // Login succeeds (schema trims and lowercases)
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
    await page.getByTestId('user-menu-button').click();
    await expect(page.getByTestId('user-menu-email')).toHaveText(ACCOUNTS.customer.email);
  });
});
