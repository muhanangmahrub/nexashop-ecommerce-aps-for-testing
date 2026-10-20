// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Positive', () => {
  test('Login page renders all elements', async ({ page }) => {
    // 1. Navigate to /login
    await page.goto('/login');

    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    const email = page.getByTestId('login-email-input');
    const password = page.getByTestId('login-password-input');
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-remember-checkbox')).toBeChecked();
    await expect(page.getByTestId('login-forgot-password-link')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
    await expect(page.getByTestId('login-google-btn')).toBeVisible();
    await expect(page.getByTestId('login-register-link')).toBeVisible();

    // Password input is masked
    await expect(password).toHaveAttribute('type', 'password');
  });
});
