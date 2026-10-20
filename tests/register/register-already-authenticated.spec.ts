// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect, login } from '../fixtures';

test.describe('Register - Navigation', () => {
  test('Logged-in user visiting /register', async ({ page }) => {
    // 1. Login (customer6) then goto /register
    await login(page, { email: 'customer6@nexashop.test', password: 'Customer@123' });
    await page.goto('/register');

    // Observed: a logged-in user is redirected to the home page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('register-form')).toHaveCount(0);
  });
});
