// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin, unlock } from './helpers';

const email = 'customer4@nexashop.test';

test.describe('Login - Negative and Edge', () => {
  test('Password is case-sensitive', async ({ page, request }) => {
    await unlock(request, email);
    try {
      // 1. Login customer4 with 'customer@123'
      await page.goto('/login');
      await submitLogin(page, email, 'customer@123');

      // Invalid email or password error
      await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
      await expect(page).toHaveURL('/login');
      await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
    } finally {
      await unlock(request, email);
    }
  });
});
