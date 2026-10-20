// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Empty form submit', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);

    // 1. Click login-submit-btn with both fields empty
    await page.getByTestId('login-submit-btn').click();

    // 'Email is required' and 'Password is required' shown inline
    await expect(page.getByTestId('login-email-input-error')).toHaveText('Email is required');
    await expect(page.getByTestId('login-password-input-error')).toHaveText('Password is required');

    // No network request; URL unchanged
    expect(requests.count).toBe(0);
    await expect(page).toHaveURL('/login');
  });
});
