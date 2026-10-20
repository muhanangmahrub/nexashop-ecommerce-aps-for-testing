// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Verification notice when TEST_MODE=false', async ({ page, request }) => {
    test.skip(process.env.TEST_MODE !== 'false', 'Requires the app running with TEST_MODE=false (run with env TEST_MODE=false)');

    const data = validData();

    // 1. Register a new user with email verification enabled
    await page.goto('/register');
    await fillRegisterForm(page, data);
    await submitRegister(page);

    await expect(page.getByTestId('register-verify-notice')).toContainText('Check your email');
    await expect(page.getByTestId('register-verify-message')).toContainText(data.email);
    await expect(page.getByTestId('register-resend-link')).toHaveAttribute(
      'href',
      new RegExp(`/verify-email\\?email=${encodeURIComponent(data.email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );

    // User is not logged in
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);

    // Verification email is visible through the test mail endpoint
    const res = await request.get('/api/test/emails');
    expect(res.ok()).toBeTruthy();
    expect(JSON.stringify(await res.json())).toContain(data.email);
  });
});
