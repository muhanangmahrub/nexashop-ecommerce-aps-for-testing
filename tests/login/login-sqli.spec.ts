// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { submitLogin, trackLoginRequests, unlock } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('SQL injection style input in login', async ({ page, request }) => {
    const injectedEmail = "a'--@example.com";
    await unlock(request, ACCOUNTS.customer.email);
    // This address can exist from earlier runs with failed attempts/lockout; reset it if present
    // (404 when it does not exist is fine).
    const res = await request.post('/api/test/unlock', { data: { email: injectedEmail } });
    expect([200, 404]).toContain(res.status());
    try {
      await page.goto('/login');
      const requests = trackLoginRequests(page);

      // 1. Email "' OR '1'='1" and password "' OR '1'='1"
      await submitLogin(page, "' OR '1'='1", "' OR '1'='1");

      // Email invalid format error; no login
      await expect(page.getByTestId('login-email-input-error')).toHaveText('Please enter a valid email address');
      expect(requests.count).toBe(0);
      await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

      // 2. Valid-format email "a'--@example.com" / password "' OR 1=1 --" (and customer1 with injected password)
      await submitLogin(page, injectedEmail, "' OR 1=1 --");
      await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');

      await submitLogin(page, ACCOUNTS.customer.email, "' OR 1=1 --");
      await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
      await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
      await expect(page).toHaveURL('/login');

      // App remains functional
      await page.goto('/');
      await expect(page.getByTestId('site-header')).toBeVisible();
    } finally {
      await unlock(request, ACCOUNTS.customer.email);
      await request.post('/api/test/unlock', { data: { email: injectedEmail } });
    }
  });
});
