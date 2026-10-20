// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Email longer than 254 chars', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);

    // 1. Enter 250-char local part + @example.com
    await page.getByTestId('login-email-input').fill(`${'a'.repeat(250)}@example.com`);
    await page.getByTestId('login-password-input').fill('x');
    await page.getByTestId('login-submit-btn').click();

    // Error 'Email must be at most 254 characters' (or invalid email message)
    await expect(page.getByTestId('login-email-input-error')).toHaveText(
      /Email must be at most 254 characters|Please enter a valid email address/,
    );
    expect(requests.count).toBe(0);
    await expect(page).toHaveURL('/login');
  });
});
