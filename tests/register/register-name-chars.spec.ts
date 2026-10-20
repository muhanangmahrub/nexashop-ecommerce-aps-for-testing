// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Name with invalid characters', async ({ page }) => {
    // 1. Try 'John123', 'John@Doe', 'J0hn', '!!'
    for (const name of ['John123', 'John@Doe', 'J0hn', '!!']) {
      await page.goto('/register');
      await fillRegisterForm(page, validData({ name }));
      await submitRegister(page);
      await expect(fieldError(page, 'name')).toHaveText(
        'Name may only contain letters, spaces, apostrophes, periods and hyphens',
      );
      await expect(page).toHaveURL(/\/register/);
    }
  });
});
