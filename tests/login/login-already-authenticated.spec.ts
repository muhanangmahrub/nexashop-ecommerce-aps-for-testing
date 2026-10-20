// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { loginViaUi } from './helpers';

test.describe('Login - Positive', () => {
  test('Logged-in user visiting /login is redirected home', async ({ page }) => {
    // 1. Login, then goto /login
    await loginViaUi(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/login');

    // Redirected to /
    await expect(page).toHaveURL(/^[^?#]*\/$/);
    await expect(page.getByTestId('login-page')).toHaveCount(0);
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
