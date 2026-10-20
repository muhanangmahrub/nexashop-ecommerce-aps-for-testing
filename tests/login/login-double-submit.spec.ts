// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Double submit protection', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);

    // 1. Enter valid creds and double-click submit
    await page.getByTestId('login-email-input').fill(ACCOUNTS.customer.email);
    await page.getByTestId('login-password-input').fill(ACCOUNTS.customer.password);
    await page.getByTestId('login-submit-btn').dblclick();

    // Single navigation to home and logged in
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();

    // Only one login request was sent
    expect(requests.count).toBe(1);
  });
});
