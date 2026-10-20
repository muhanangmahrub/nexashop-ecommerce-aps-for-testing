// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Password with only spaces / all-lowercase simple', async ({ page }) => {
    // 1. '        ' and 'aaaaaaaa'
    for (const password of ['        ', 'aaaaaaaa']) {
      await page.goto('/register');
      await fillRegisterForm(page, validData({ password, confirmPassword: password }));
      await submitRegister(page);

      // First failing rule is the uppercase rule for both inputs
      await expect(fieldError(page, 'password')).toHaveText('Password must contain at least one uppercase letter');
      await expect(page.getByTestId('password-strength-label')).toHaveText('Weak');
      await expect(page).toHaveURL(/\/register/);
    }
  });
});
