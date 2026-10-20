// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Confirm password mismatch', async ({ page }) => {
    // 1. Password 'Passw0rd!', confirm 'Passw0rd?'
    await page.goto('/register');
    await fillRegisterForm(page, validData({ password: 'Passw0rd!', confirmPassword: 'Passw0rd?' }));
    await submitRegister(page);
    await expect(fieldError(page, 'confirm')).toHaveText('Passwords do not match');
    await expect(page).toHaveURL(/\/register/);

    // 2. Confirm differing only by case
    await page.goto('/register');
    await fillRegisterForm(page, validData({ password: 'Passw0rd!', confirmPassword: 'passw0rd!' }));
    await submitRegister(page);
    await expect(fieldError(page, 'confirm')).toHaveText('Passwords do not match');
    await expect(page).toHaveURL(/\/register/);
  });
});
