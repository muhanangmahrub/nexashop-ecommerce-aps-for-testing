// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin } from './helpers';

const DAY = 24 * 60 * 60;

test.describe('Login - Positive', () => {
  test('Remember me checkbox toggles and login works unchecked', async ({ page, context }) => {
    const account = { email: 'customer2@nexashop.test', password: 'Customer@123' };
    const refreshExpiresIn = async () => {
      const cookie = (await context.cookies()).find((c) => c.name === 'nx_refresh');
      expect(cookie, 'nx_refresh cookie').toBeTruthy();
      return cookie!.expires - Date.now() / 1000;
    };

    // 1. Verify login-remember-checkbox is checked by default; uncheck it; login as customer2
    await page.goto('/login');
    const remember = page.getByTestId('login-remember-checkbox');
    await expect(remember).toBeChecked();
    await remember.uncheck();
    await expect(remember).not.toBeChecked();

    const requestPromise = page.waitForRequest((r) => r.method() === 'POST' && r.url().includes('/api/auth/login'));
    await submitLogin(page, account.email, account.password);
    const request = await requestPromise;

    // Request body contains rememberMe=false
    expect(request.postDataJSON().rememberMe).toBe(false);

    // Login succeeds
    await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();

    // Refresh cookie lifetime is short (1 day) when unchecked
    const shortLifetime = await refreshExpiresIn();
    expect(shortLifetime).toBeGreaterThan(0);
    expect(shortLifetime).toBeLessThanOrEqual(1 * DAY + 60);

    // Compare with the checked case (default 7 days)
    await context.clearCookies();
    await page.goto('/login');
    await expect(remember).toBeChecked();
    await submitLogin(page, account.email, account.password);
    await expect(page.getByTestId('user-menu-button')).toBeVisible({ timeout: 30_000 });
    const longLifetime = await refreshExpiresIn();
    expect(longLifetime).toBeGreaterThan(shortLifetime);
    expect(longLifetime).toBeGreaterThan(2 * DAY);
  });
});
