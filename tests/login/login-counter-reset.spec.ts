// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin, unlock } from './helpers';

const email = 'customer5@nexashop.test';
const password = 'Customer@123';

test.describe('Login - Negative and Edge', () => {
  test('Successful login resets failed counter', async ({ page, request }) => {
    test.skip(test.info().project.name !== 'chromium', 'Failed-attempt counter is per-account; run on a single project only');

    // 1. Unlock customer5
    await unlock(request, email);
    try {
      // Fail twice
      await page.goto('/login');
      const error = page.getByTestId('login-error');
      for (let i = 0; i < 2; i++) {
        await submitLogin(page, email, 'Wrong@123');
        await expect(error).toHaveText('Invalid email or password');
      }

      // Login correctly
      await submitLogin(page, email, password);
      await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
      await expect(page.getByTestId('user-menu-button')).toBeVisible();

      // Logout
      await page.getByTestId('user-menu-button').click();
      await page.getByTestId('logout-button').click();
      await expect(page.getByTestId('header-login-link')).toBeVisible();

      // Counter was reset: 4 more failures don't lock (2 + 4 would have without the reset), the 5th does
      await page.goto('/login');
      for (let i = 0; i < 4; i++) {
        await submitLogin(page, email, 'Wrong@123');
        await expect(error).toHaveText('Invalid email or password');
      }
      await submitLogin(page, email, 'Wrong@123');
      await expect(error).toHaveText(/^Account locked due to too many failed login attempts/);
    } finally {
      await unlock(request, email);
    }
  });
});
