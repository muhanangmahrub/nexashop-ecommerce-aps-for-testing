// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Email too long', async ({ page }) => {
    await page.goto('/register');

    // 1. Enter email over 254 chars
    await fillRegisterForm(page, validData({ email: `${'a'.repeat(250)}@example.com` }));
    await submitRegister(page);

    await expect(fieldError(page, 'email')).toHaveText('Email must be at most 254 characters');
    await expect(page).toHaveURL(/\/register/);
  });
});
