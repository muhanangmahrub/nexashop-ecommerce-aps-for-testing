// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Register - Positive', () => {
  test('Register page renders all elements', async ({ page }) => {
    // 1. Open /register
    await page.goto('/register');

    await expect(page.getByTestId('register-page')).toBeVisible();
    await expect(page.getByTestId('register-form')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByTestId('register-name-input')).toBeVisible();
    await expect(page.getByTestId('register-email-input')).toBeVisible();
    await expect(page.getByTestId('register-password-input')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('register-terms-checkbox')).not.toBeChecked();
    await expect(page.getByTestId('register-submit-btn')).toBeVisible();
    await expect(page.getByTestId('register-login-link')).toBeVisible();

    // Password strength indicator appears once a password is typed
    await page.getByTestId('register-password-input').fill('a');
    await expect(page.getByTestId('password-strength-label')).toBeVisible();

    // Name input maxlength matches the 50-char server limit
    await expect(page.getByTestId('register-name-input')).toHaveAttribute('maxlength', '50');
  });
});
