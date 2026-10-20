// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Navigation', () => {
  test('Forgot password link', async ({ page }) => {
    await page.goto('/login');

    // 1. Click login-forgot-password-link
    await page.getByTestId('login-forgot-password-link').click();

    // URL /forgot-password and forgot form is displayed
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByTestId('forgot-password-page')).toBeVisible();
    await expect(page.getByTestId('forgot-password-form')).toBeVisible();
  });
});
