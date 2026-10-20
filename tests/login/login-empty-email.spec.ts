// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Empty email only', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);

    // 1. Enter password only, submit
    await page.getByTestId('login-password-input').fill('Customer@123');
    await page.getByTestId('login-submit-btn').click();

    // Only 'Email is required' shown
    await expect(page.getByTestId('login-email-input-error')).toHaveText('Email is required');
    await expect(page.getByTestId('login-password-input-error')).toHaveCount(0);
    expect(requests.count).toBe(0);
  });
});
