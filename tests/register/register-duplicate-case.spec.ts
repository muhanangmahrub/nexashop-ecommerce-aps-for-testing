// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Duplicate email differing by case/whitespace', async ({ page }) => {
    await page.goto('/register');

    // 1. Register with ' CUSTOMER1@NEXASHOP.TEST '
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/auth/register'));
    await fillRegisterForm(page, validData({ email: ' CUSTOMER1@NEXASHOP.TEST ' }));
    await submitRegister(page);

    expect((await responsePromise).status()).toBe(409);
    await expect(fieldError(page, 'email')).toHaveText('Email already exists');
    await expect(page.getByTestId('register-error')).toHaveText('Email already exists');
    await expect(page).toHaveURL(/\/register/);
  });
});
