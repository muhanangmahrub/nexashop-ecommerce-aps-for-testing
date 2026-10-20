// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, fillRegisterForm, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Double submit creates only one account', async ({ page }) => {
    const statuses: number[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/auth/register') && r.request().method() === 'POST') statuses.push(r.status());
    });

    await page.goto('/register');
    await fillRegisterForm(page, validData());

    // 1. Double-click submit with valid data
    await page.getByTestId('register-submit-btn').dblclick();

    await expectRegistered(page);

    // At most one account was created; a second attempt (if any) is a duplicate error, never a 500
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.every((s) => s === 201 || s === 409)).toBe(true);
  });
});
