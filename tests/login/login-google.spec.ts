// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Negative and Edge', () => {
  test('Google OAuth button when not configured', async ({ page }) => {
    // 1. Click login-google-btn
    await page.goto('/login');
    await page.getByTestId('login-google-btn').click();
    await page.waitForURL(/error=google_not_configured|accounts\.google\.com/);

    // Google may be configured in some environments; the not-configured path is what this test covers.
    test.skip(/accounts\.google\.com/.test(page.url()), 'Google OAuth is configured on this server');

    // Redirect back to /login?error=google_not_configured on the same origin (not the 0.0.0.0 bind host)
    await expect(page).toHaveURL('/login?error=google_not_configured');
    await expect(page.getByTestId('login-error')).toHaveText('Google sign-in is not configured on this server.');

    // 2. Open /login?error=account_banned and /login?error=oauth_failed
    await page.goto('/login?error=account_banned');
    await expect(page.getByTestId('login-error')).toHaveText('Your account has been suspended.');

    await page.goto('/login?error=oauth_failed');
    await expect(page.getByTestId('login-error')).toHaveText('Google sign-in failed. Please try again.');
  });
});
