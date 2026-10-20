// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password missing number', async ({ page }) => {
    await page.goto('/register');

    // 1. 'Password!'
    await fillRegisterForm(page, validData({ password: 'Password!', confirmPassword: 'Password!' }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must contain at least one number');
    await expect(page).toHaveURL(/\/register/);
  });
});
