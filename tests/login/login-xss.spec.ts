// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('XSS payload in login fields', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    // 1. Email '<script>alert(1)</script>@x.com', password '<img src=x onerror=alert(1)>'
    await page.goto('/login');
    await submitLogin(page, '<script>alert(1)</script>@x.com', '<img src=x onerror=alert(1)>');

    // Errors rendered as text
    const emailError = page.getByTestId('login-email-input-error');
    await expect(emailError).toHaveText('Please enter a valid email address');
    await expect(emailError.locator('script, img')).toHaveCount(0);

    // Payload in the password with a well-formed unknown email goes through the server
    await submitLogin(page, 'nobody@nexashop.test', '<img src=x onerror=alert(1)>');
    const error = page.getByTestId('login-error');
    await expect(error).toHaveText('Invalid email or password');
    await expect(error.locator('img, script')).toHaveCount(0);
    await expect(page.locator('main img[src="x"]')).toHaveCount(0);

    // No dialog fired
    expect(dialogFired).toBe(false);
  });
});
