// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { loginViaUi } from './helpers';

test.describe('Login - Positive', () => {
  test('Customer cannot access admin area', async ({ page }) => {
    // 1. Login as customer1, then navigate to /admin
    await loginViaUi(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await page.goto('/admin');

    // URL stays /admin but page shows the 403 access denied content
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('forbidden-page')).toBeVisible();
    await expect(page.getByText('403', { exact: true })).toBeVisible();
    await expect(page.getByTestId('forbidden-title')).toHaveText('Access denied');
    await expect(page.getByText('You do not have permission to view this page.')).toBeVisible();
    await expect(page.getByTestId('forbidden-home-btn')).toBeVisible();
    await expect(page.getByTestId('admin-dashboard')).toHaveCount(0);

    // user-menu-admin link absent from menu
    await page.getByTestId('user-menu-button').click();
    await expect(page.getByTestId('user-menu-dropdown')).toBeVisible();
    await expect(page.getByTestId('user-menu-admin')).toHaveCount(0);
  });
});
