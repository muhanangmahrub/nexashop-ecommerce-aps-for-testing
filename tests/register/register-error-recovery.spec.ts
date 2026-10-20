// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, fieldError, fillRegisterForm, submitRegister, uniqueEmail, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Error clearing on correction', async ({ page }) => {
    await page.goto('/register');

    // 1. Trigger duplicate email error
    await fillRegisterForm(page, validData({ email: 'customer1@nexashop.test' }));
    await submitRegister(page);
    await expect(fieldError(page, 'email')).toHaveText('Email already exists');
    await expect(page.getByTestId('register-error')).toBeVisible();

    // ... change email to a unique one, submit
    await page.getByTestId('register-email-input').fill(uniqueEmail());
    await submitRegister(page);

    // Prior errors cleared, registration succeeds
    await expectRegistered(page);
    await expect(page.getByTestId('register-error')).toHaveCount(0);
  });
});
