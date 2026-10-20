// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { uniqueEmail, VALID_PASSWORD } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Name too long', async ({ page, request }) => {
    // 1. Input maxlength matches the 50-char server limit: typing 70 chars keeps 50
    await page.goto('/register');
    const name = page.getByTestId('register-name-input');
    await expect(name).toHaveAttribute('maxlength', '50');
    await name.click();
    await page.keyboard.type('b'.repeat(70));
    await expect(name).toHaveValue('b'.repeat(50));

    // 2. Server rejects 51 chars when the input limit is bypassed
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'a'.repeat(51),
        email: uniqueEmail('long'),
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
        acceptTerms: true,
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).errors.name).toBe('Name must be at most 50 characters');
  });
});
