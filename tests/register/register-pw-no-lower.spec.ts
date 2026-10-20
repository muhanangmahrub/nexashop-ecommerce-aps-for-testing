// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password missing lowercase', async ({ page }) => {
    await page.goto('/register');

    // 1. 'PASSW0RD!' (lowercase is an extra rule beyond the original spec)
    await fillRegisterForm(page, validData({ password: 'PASSW0RD!', confirmPassword: 'PASSW0RD!' }));
    await submitRegister(page);

    await expect(fieldError(page, 'password')).toHaveText('Password must contain at least one lowercase letter');
    await expect(page).toHaveURL(/\/register/);
  });
});
