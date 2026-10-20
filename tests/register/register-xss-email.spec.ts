// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('XSS in email field', async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.goto('/register');

    // 1. Email '<img src=x onerror=alert(1)>@x.com'
    await fillRegisterForm(page, validData({ email: '<img src=x onerror=alert(1)>@x.com' }));
    await submitRegister(page);

    await expect(fieldError(page, 'email')).toHaveText('Please enter a valid email address');
    await expect(page).toHaveURL(/\/register/);
    expect(dialogSeen).toBe(false);
  });
});
