// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Banned user with wrong password', async ({ page }) => {
    // 1. Login banned@ with wrong password
    await page.goto('/login');
    await submitLogin(page, ACCOUNTS.banned.email, 'Wrong@123');

    // Ban status is only revealed after the password is verified, so a wrong password
    // gets the generic message
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
  });
});
