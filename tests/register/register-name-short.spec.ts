// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Name too short', async ({ page }) => {
    await page.goto('/register');

    // 1. Name 'A'
    await fillRegisterForm(page, validData({ name: 'A' }));
    await submitRegister(page);

    await expect(fieldError(page, 'name')).toHaveText('Name must be at least 2 characters');
    await expect(page).toHaveURL(/\/register/);
  });
});
