// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password over 128 chars', async ({ page }) => {
    await page.goto('/register');

    // 1. 129-char otherwise valid password
    const password = 'Passw0rd!'.padEnd(129, 'a');
    expect(password).toHaveLength(129);
    await fillRegisterForm(page, validData({ password, confirmPassword: password }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must be at most 128 characters');
    await expect(page).toHaveURL(/\/register/);
  });
});
