// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password too short (7 chars)', async ({ page }) => {
    await page.goto('/register');

    // 1. Password and confirm 'Pass0rd'
    await fillRegisterForm(page, validData({ password: 'Pass0rd', confirmPassword: 'Pass0rd' }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must be at least 8 characters');
    await expect(page).toHaveURL(/\/register/);
  });
});
