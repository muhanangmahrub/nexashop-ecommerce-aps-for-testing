// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Terms not accepted', async ({ page }) => {
    await page.goto('/register');

    // 1. Fill all valid, leave terms unchecked, submit
    await fillRegisterForm(page, validData({ acceptTerms: false }));
    await submitRegister(page);
    await expect(fieldError(page, 'terms')).toHaveText('You must accept the terms and conditions');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

    // 2. Check then uncheck then submit
    const terms = page.getByTestId('register-terms-checkbox');
    await terms.check();
    await terms.uncheck();
    await submitRegister(page);
    await expect(fieldError(page, 'terms')).toHaveText('You must accept the terms and conditions');
    await expect(page).toHaveURL(/\/register/);
  });
});
