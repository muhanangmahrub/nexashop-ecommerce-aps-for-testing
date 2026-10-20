// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, uniqueEmail, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('SQL injection style input', async ({ page, request }) => {
    // 1. Name "Robert'); DROP TABLE users;--"
    await page.goto('/register');
    await fillRegisterForm(page, validData({ name: "Robert'); DROP TABLE users;--" }));
    await submitRegister(page);
    await expect(fieldError(page, 'name')).toHaveText(
      'Name may only contain letters, spaces, apostrophes, periods and hyphens',
    );

    // Tables are intact: an existing seed customer can still log in via the API
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'customer6@nexashop.test', password: 'Customer@123' },
    });
    expect(loginRes.status()).toBe(200);

    // 2. Email "x@y.com' OR '1'='1" and "a'--@example.com"
    // Observed: the first is rejected as invalid; the second is a syntactically valid address and is safely
    // accepted (account created with the literal value). Either outcome is fine as long as there is no 500.
    const statuses: number[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/auth/register')) statuses.push(r.status());
    });

    await page.goto('/register');
    await fillRegisterForm(page, validData({ email: "x@y.com' OR '1'='1" }));
    await submitRegister(page);
    await expect(fieldError(page, 'email')).toHaveText('Please enter a valid email address');

    await page.goto('/register');
    await fillRegisterForm(page, validData({ email: uniqueEmail("a'--") }));
    await submitRegister(page);
    await expect(
      page.getByTestId('user-menu-button').or(fieldError(page, 'email')),
    ).toBeVisible();

    expect(statuses.every((s) => s < 500)).toBe(true);
  });
});
