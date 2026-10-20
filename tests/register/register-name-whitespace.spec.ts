// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Whitespace-only name', async ({ page }) => {
    await page.goto('/register');

    // 1. Name '     '
    await fillRegisterForm(page, validData({ name: '     ' }));
    await submitRegister(page);

    // The name is trimmed first, so it counts as empty
    await expect(fieldError(page, 'name')).toHaveText('Name is required');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
  });
});
