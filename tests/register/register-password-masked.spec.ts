// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Passwords are not exposed', async ({ page }) => {
    await page.goto('/register');

    // 1. Inspect password and confirm inputs
    await expect(page.getByTestId('register-password-input')).toHaveAttribute('type', 'password');
    await expect(page.getByTestId('register-confirm-password-input')).toHaveAttribute('type', 'password');

    // ... and the successful register response
    const data = validData();
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/auth/register'));
    await fillRegisterForm(page, data);
    await submitRegister(page);

    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const body = await response.text();
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('"password"');
    expect(body).not.toContain(data.password);
    await expectRegistered(page);
  });
});
