// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Positive', () => {
  test('Customer logs in successfully', async ({ page, context }) => {
    // 1. Go to /login, fill customer1@nexashop.test / Customer@123, click login-submit-btn
    await page.goto('/login');
    await submitLogin(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);

    // Toast 'Welcome back!' appears
    await expect(page.getByText('Welcome back!').first()).toBeVisible({ timeout: 30_000 });

    // URL becomes / (home)
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });

    // Header shows user-menu-button, no Log in / Sign up buttons
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
    await expect(page.getByTestId('header-login-link')).toHaveCount(0);
    await expect(page.getByTestId('header-register-link')).toHaveCount(0);

    // user-menu-email shows the account email after opening the menu
    await page.getByTestId('user-menu-button').click();
    await expect(page.getByTestId('user-menu-email')).toHaveText(ACCOUNTS.customer.email);

    // Session cookies are set
    const names = (await context.cookies()).map((c) => c.name);
    expect(names).toContain('nx_access');
    expect(names).toContain('nx_refresh');
  });
});
