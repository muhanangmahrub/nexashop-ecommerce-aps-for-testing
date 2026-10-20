// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Positive', () => {
  test('Banner messages from query params', async ({ page }) => {
    // 1. Open /login?reason=session_expired
    await page.goto('/login?reason=session_expired');
    await expect(page.getByTestId('login-session-expired')).toHaveText('Your session has expired. Please log in again.');
    await expect(page.getByTestId('login-reset-success')).toHaveCount(0);

    // ...then /login?reset=success
    await page.goto('/login?reset=success');
    await expect(page.getByTestId('login-reset-success')).toHaveText(
      'Password reset successful. Please log in with your new password.',
    );
    await expect(page.getByTestId('login-session-expired')).toHaveCount(0);

    // ...then /login?verified=1
    await page.goto('/login?verified=1');
    await expect(page.getByTestId('login-verified-success')).toHaveText('Email verified! You can now log in.');
    await expect(page.getByTestId('login-reset-success')).toHaveCount(0);
  });
});
