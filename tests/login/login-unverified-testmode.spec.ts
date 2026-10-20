// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin } from './helpers';

const unverified = { email: 'unverified@nexashop.test', password: 'Customer@123' };

test.describe('Login - Positive', () => {
  test('Unverified user can log in under TEST_MODE', async ({ page }) => {
    // Environment default is TEST_MODE=true; set TEST_MODE=false in the test runner env to skip this test.
    test.skip(process.env.TEST_MODE === 'false', 'Requires TEST_MODE=true (email verification is skipped)');

    // 1. Login as unverified@nexashop.test / Customer@123 with TEST_MODE=true
    await page.goto('/login');
    await submitLogin(page, unverified.email, unverified.password);

    // Login succeeds and redirects to / (verification skipped)
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });

  test('Unverified user is blocked when TEST_MODE=false', async ({ page }) => {
    // Runs only when the app is started with TEST_MODE=false and the runner env has TEST_MODE=false.
    test.skip(process.env.TEST_MODE !== 'false', 'Requires TEST_MODE=false on the app and TEST_MODE=false in the runner env');

    await page.goto('/login');
    await submitLogin(page, unverified.email, unverified.password);

    await expect(page.getByTestId('login-error')).toHaveText('Please verify your email address before logging in');
    await expect(page.getByTestId('login-resend-verification-link')).toHaveAttribute(
      'href',
      `/verify-email?email=${encodeURIComponent(unverified.email)}`,
    );
    await expect(page).toHaveURL(/\/login/);
  });
});
