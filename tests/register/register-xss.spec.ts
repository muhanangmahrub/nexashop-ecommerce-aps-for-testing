// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('XSS script payload in name', async ({ page }) => {
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.goto('/register');

    // 1. Name '<script>alert(1)</script>'
    await fillRegisterForm(page, validData({ name: '<script>alert(1)</script>' }));
    await submitRegister(page);

    await expect(fieldError(page, 'name')).toHaveText(
      'Name may only contain letters, spaces, apostrophes, periods and hyphens',
    );
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('user-menu-button')).toHaveCount(0);
    expect(dialogSeen).toBe(false);
  });
});
