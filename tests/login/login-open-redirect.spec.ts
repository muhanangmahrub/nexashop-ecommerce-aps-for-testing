// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Positive', () => {
  test('Open-redirect protection', async ({ page, context, baseURL }) => {
    // 1. Open /login?redirect=//evil.com and /login?redirect=https://evil.com and login as customer1
    for (const redirect of ['//evil.com', 'https://evil.com']) {
      await context.clearCookies();
      await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
      await submitLogin(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);

      // After login URL is / on the same origin, never an external site
      await expect(page.getByTestId('user-menu-button')).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(/^[^?#]*\/$/);
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
      expect(page.url()).not.toContain('evil.com');
    }
  });
});
