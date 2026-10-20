// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password missing uppercase', async ({ page }) => {
    await page.goto('/register');

    // 1. 'passw0rd!'
    await fillRegisterForm(page, validData({ password: 'passw0rd!', confirmPassword: 'passw0rd!' }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must contain at least one uppercase letter');
    await expect(page).toHaveURL(/\/register/);
  });
});
