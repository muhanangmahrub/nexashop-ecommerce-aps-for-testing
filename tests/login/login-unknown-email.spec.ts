// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Unknown email', async ({ page }) => {
    // 1. Login as nobody@nexashop.test / Wrong@123
    await page.goto('/login');
    await submitLogin(page, 'nobody@nexashop.test', 'Wrong@123');

    // Exactly 'Invalid email or password' (no remaining-attempts text, no user enumeration)
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
  });
});
