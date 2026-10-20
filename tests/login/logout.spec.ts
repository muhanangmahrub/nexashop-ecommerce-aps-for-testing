// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { loginViaUi } from './helpers';

test.describe('Login - Positive', () => {
  test('Logout', async ({ page }) => {
    // 1. Login as customer1, click user-menu-button then logout-button
    await loginViaUi(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.getByTestId('user-menu-button').click();
    await page.getByTestId('logout-button').click();

    // Session ended; header shows Log in / Sign up
    await expect(page.getByTestId('header-login-link')).toBeVisible();
    await expect(page.getByTestId('header-register-link')).toBeVisible();
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

    // Navigating to /account redirects to /login?redirect=%2Faccount
    await page.goto('/account');
    await expect(page).toHaveURL('/login?redirect=%2Faccount');
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
