// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Navigation', () => {
  test('Link to register', async ({ page }) => {
    // 1. Click login-register-link
    await page.goto('/login');
    await page.getByTestId('login-register-link').click();

    // URL /register
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('register-page')).toBeVisible();

    // 2. Open /login?redirect=%2Fcart and click Sign up
    await page.goto('/login?redirect=%2Fcart');
    await page.getByTestId('login-register-link').click();

    // URL /register?redirect=%2Fcart
    await expect(page).toHaveURL('/register?redirect=%2Fcart');
  });
});
