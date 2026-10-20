// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Duplicate email', async ({ page }) => {
    await page.goto('/register');

    // 1. Register with customer1@nexashop.test and valid other fields
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/auth/register'));
    await fillRegisterForm(page, validData({ email: 'customer1@nexashop.test' }));
    await submitRegister(page);

    const response = await responsePromise;
    expect(response.status()).toBe(409);

    await expect(fieldError(page, 'email')).toHaveText('Email already exists');
    await expect(page.getByTestId('register-error')).toHaveText('Email already exists');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
  });
});
