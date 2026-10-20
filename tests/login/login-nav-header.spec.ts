// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Navigation', () => {
  test('Header Log in button carries redirect', async ({ page }) => {
    // 1. From / click header 'Log in'
    await page.goto('/');
    await page.getByTestId('header-login-link').click();

    // URL /login?redirect=%2F
    await expect(page).toHaveURL('/login?redirect=%2F');
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
