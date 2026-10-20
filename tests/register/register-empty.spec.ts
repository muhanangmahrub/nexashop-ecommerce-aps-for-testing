// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Empty form submit', async ({ page }) => {
    await page.goto('/register');

    // 1. Click register-submit-btn with all fields empty
    await page.getByTestId('register-submit-btn').click();

    await expect(fieldError(page, 'name')).toHaveText('Name is required');
    await expect(fieldError(page, 'email')).toHaveText('Email is required');
    await expect(fieldError(page, 'password')).toHaveText('Password is required');
    await expect(fieldError(page, 'confirm')).toHaveText('Please confirm your password');
    await expect(fieldError(page, 'terms')).toHaveText('You must accept the terms and conditions');
    await expect(page).toHaveURL(/\/register/);
  });
});
