// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Register - Navigation', () => {
  test('Link to login', async ({ page }) => {
    await page.goto('/register');

    // 1. Click register-login-link
    await page.getByTestId('register-login-link').click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
