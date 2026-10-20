// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectOnlyFieldErrors, fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Each required field missing individually', async ({ page }) => {
    // 1. Fill everything validly but leave one field empty/unchecked in turn
    const cases = [
      { field: 'name' as const, data: validData({ name: '' }), message: 'Name is required' },
      { field: 'email' as const, data: validData({ email: '' }), message: 'Email is required' },
      { field: 'confirm' as const, data: validData({ confirmPassword: '' }), message: 'Please confirm your password' },
      {
        field: 'terms' as const,
        data: validData({ acceptTerms: false }),
        message: 'You must accept the terms and conditions',
      },
    ];

    for (const c of cases) {
      await page.goto('/register');
      await fillRegisterForm(page, c.data);
      await submitRegister(page);
      await expect(fieldError(page, c.field)).toHaveText(c.message);
      await expectOnlyFieldErrors(page, [c.field]);
    }

    // Missing password: observed that the confirm field also reports a mismatch
    await page.goto('/register');
    await fillRegisterForm(page, validData({ password: '', confirmPassword: 'Passw0rd!' }));
    await submitRegister(page);
    await expect(fieldError(page, 'password')).toHaveText('Password is required');
    await expect(fieldError(page, 'name')).toHaveCount(0);
    await expect(fieldError(page, 'email')).toHaveCount(0);
    await expect(fieldError(page, 'terms')).toHaveCount(0);
  });
});
