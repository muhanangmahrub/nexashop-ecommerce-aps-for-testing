// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin, unlock } from './helpers';

const email = 'customer3@nexashop.test';

test.describe('Login - Negative and Edge', () => {
  test('Wrong password', async ({ page, request }) => {
    await unlock(request, email);
    try {
      // 1. Login as customer3@nexashop.test with 'Wrong@123'
      await page.goto('/login');
      await submitLogin(page, email, 'Wrong@123');

      // Generic message, identical to the unknown-email case (no account enumeration)
      await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');

      // Stays on /login, password field retained, no session
      await expect(page).toHaveURL('/login');
      await expect(page.getByTestId('login-password-input')).toHaveValue('Wrong@123');
      await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
    } finally {
      await unlock(request, email);
    }
  });
});
