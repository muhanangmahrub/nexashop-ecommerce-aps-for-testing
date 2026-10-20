// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password missing special character', async ({ page }) => {
    await page.goto('/register');

    // 1. 'Passw0rd1'
    await fillRegisterForm(page, validData({ password: 'Passw0rd1', confirmPassword: 'Passw0rd1' }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must contain at least one special character');
    await expect(page).toHaveURL(/\/register/);
  });
});
