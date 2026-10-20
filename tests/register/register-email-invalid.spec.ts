// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { fieldError, fillRegisterForm, submitRegister, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Invalid email formats', async ({ page }) => {
    // 1. Try 'bad@', 'bad', '@x.com', 'a@b', 'a b@x.com', 'a@@x.com'
    for (const email of ['bad@', 'bad', '@x.com', 'a@b', 'a b@x.com', 'a@@x.com']) {
      await page.goto('/register');
      await fillRegisterForm(page, validData({ email }));
      await submitRegister(page);
      await expect(fieldError(page, 'email'), `email: ${email}`).toHaveText('Please enter a valid email address');
      await expect(page).toHaveURL(/\/register/);
    }
  });
});
