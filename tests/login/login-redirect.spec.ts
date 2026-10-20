// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Positive', () => {
  test('Redirect back after login', async ({ page }) => {
    // 1. As guest, open /account
    await page.goto('/account');
    await expect(page).toHaveURL('/login?redirect=%2Faccount');

    // 2. Login as customer1
    await submitLogin(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);

    // Lands on /account
    await expect(page).toHaveURL(/\/account$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
