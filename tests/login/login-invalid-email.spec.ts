// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { trackLoginRequests } from './helpers';

test.describe('Login - Negative and Edge', () => {
  test('Invalid email formats', async ({ page }) => {
    await page.goto('/login');
    const requests = trackLoginRequests(page);
    const emailError = page.getByTestId('login-email-input-error');

    // 1. Try each invalid email with password x
    for (const invalid of ['abc', 'abc@', '@example.com', 'a b@example.com', 'abc@example']) {
      await page.getByTestId('login-email-input').fill(invalid);
      await page.getByTestId('login-password-input').fill('x');
      await page.getByTestId('login-submit-btn').click();

      // Each shows 'Please enter a valid email address'
      await expect(emailError, `email "${invalid}"`).toHaveText('Please enter a valid email address');
    }

    // No API call was made
    expect(requests.count).toBe(0);
    await expect(page).toHaveURL('/login');
  });
});
