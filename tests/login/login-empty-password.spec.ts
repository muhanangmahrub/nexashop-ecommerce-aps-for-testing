// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Empty password only', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);

    // 1. Enter valid email, leave password empty, submit
    await page.getByTestId('login-email-input').fill('customer1@nexashop.test');
    await page.getByTestId('login-submit-btn').click();

    // Only 'Password is required' shown
    await expect(page.getByTestId('login-password-input-error')).toHaveText('Password is required');
    await expect(page.getByTestId('login-email-input-error')).toHaveCount(0);
    expect(requests.count).toBe(0);
  });
});
