// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Banned user', async ({ page }) => {
    // 1. Login as banned@nexashop.test / Customer@123
    await page.goto('/login');
    await submitLogin(page, ACCOUNTS.banned.email, ACCOUNTS.banned.password);

    // login-error shows the suspended message (403 ACCOUNT_BANNED); no session
    await expect(page.getByTestId('login-error')).toHaveText(
      'Your account has been suspended: Violation of terms of service',
    );
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
  });
});
