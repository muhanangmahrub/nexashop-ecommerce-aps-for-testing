// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Server error handling', async ({ page }) => {
    // 1. Route /api/auth/login to return 500 and then abort; submit valid creds
    let calls = 0;
    await page.route('**/api/auth/login', async (route) => {
      calls++;
      if (calls === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Internal server error' }),
        });
      } else {
        await route.abort('failed');
      }
    });

    await page.goto('/login');
    const error = page.getByTestId('login-error');
    const submit = page.getByTestId('login-submit-btn');

    // 500 response: generic message, button re-enabled, no crash
    await submitLogin(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);
    await expect(error).toHaveText('Internal server error');
    await expect(submit).toBeEnabled();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

    // Aborted request (network failure): an error message is shown and the form stays usable
    await submit.click();
    await expect.poll(() => calls).toBe(2);
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
    await expect(submit).toBeEnabled();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
