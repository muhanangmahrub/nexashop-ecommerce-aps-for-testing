// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin, unlock } from './helpers';

const { email, password } = ACCOUNTS.lockout;
const LOCKED = 'Account locked due to too many failed login attempts. Try again in 15 minute(s).';
const isLoginResponse = (r: { url(): string; request(): { method(): string } }) =>
  r.url().includes('/api/auth/login') && r.request().method() === 'POST';

test.describe('Login - Negative and Edge', () => {
  test('Account lockout after 5 failed attempts', async ({ page, request }) => {
    // Lockout state is per-account; the mobile project would race with chromium on the same account.
    test.skip(test.info().project.name !== 'chromium', 'Lockout state is per-account; run on a single project only');

    // 1. POST /api/test/unlock for lockout@nexashop.test, then submit wrong password 5 times via UI
    await unlock(request, email);
    try {
      await page.goto('/login');
      const error = page.getByTestId('login-error');

      for (let i = 0; i < 4; i++) {
        await submitLogin(page, email, 'Wrong@123');
        await expect(error).toHaveText('Invalid email or password');
      }

      // 5th attempt shows the locked message (HTTP 403 ACCOUNT_LOCKED)
      const fifth = page.waitForResponse(isLoginResponse);
      await submitLogin(page, email, 'Wrong@123');
      expect((await fifth).status()).toBe(403);
      await expect(error).toHaveText(LOCKED);

      // While locked, a wrong password gets the generic message (lock state isn't revealed)
      const lockedWrong = page.waitForResponse(isLoginResponse);
      await submitLogin(page, email, 'Wrong@123');
      expect((await lockedWrong).status()).toBe(401);
      await expect(error).toHaveText('Invalid email or password');

      // 2. Login with the CORRECT password: still blocked with the locked message, no session
      const correct = page.waitForResponse(isLoginResponse);
      await submitLogin(page, email, password);
      expect((await correct).status()).toBe(403);
      await expect(error).toHaveText(LOCKED);
      await expect(page).toHaveURL('/login');
      await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

      // 3. POST /api/test/unlock then login with correct password
      await unlock(request, email);
      await submitLogin(page, email, password);
      await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
      await expect(page.getByTestId('user-menu-button')).toBeVisible();
    } finally {
      await unlock(request, email);
    }
  });
});
