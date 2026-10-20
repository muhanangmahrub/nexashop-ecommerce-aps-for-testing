// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Register - Navigation', () => {
  test('Header Sign up button', async ({ page }) => {
    await page.goto('/');

    // 1. From / click 'Sign up'
    await page.getByTestId('header-register-link').click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByTestId('register-form')).toBeVisible();
  });
});
