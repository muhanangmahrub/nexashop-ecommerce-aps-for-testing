// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin, unlock } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Very long password', async ({ page, request }) => {
    await unlock(request, ACCOUNTS.customer.email);
    try {
      await page.goto('/login');

      // 1. Submit 10,000 character password for customer1
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
        { timeout: 30_000 },
      );
      await submitLogin(page, ACCOUNTS.customer.email, 'a'.repeat(10_000));
      const response = await responsePromise;

      // Graceful 401 or validation error, no 500, no hang
      expect([400, 401]).toContain(response.status());
      await expect(page.getByTestId('login-error').or(page.getByTestId('login-password-input-error'))).toBeVisible();
      await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
      await expect(page.getByTestId('login-submit-btn')).toBeEnabled();
      await expect(page).toHaveURL('/login');
    } finally {
      await unlock(request, ACCOUNTS.customer.email);
    }
  });
});
