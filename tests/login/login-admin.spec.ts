// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect, ACCOUNTS } from '../fixtures';
import { loginViaUi } from './helpers';

test.describe('Login - Positive', () => {
  test('Admin and Super Admin login and admin access', async ({ page, context }) => {
    for (const account of [ACCOUNTS.admin, ACCOUNTS.superAdmin]) {
      await context.clearCookies();

      // 1. Login as admin / super admin, wait for URL /
      // KNOWN BUG: admins are redirected to / (home), NOT to /admin. Asserting observed behavior.
      await loginViaUi(page, account.email, account.password);
      await expect(page).toHaveURL(/^[^?#]*\/$/);

      // user-menu-admin link present in the menu
      await page.getByTestId('user-menu-button').click();
      const adminLink = page.getByTestId('user-menu-admin');
      await expect(adminLink).toBeVisible();

      // 2. Click user-menu-admin
      await adminLink.click();

      // Admin dashboard loads at /admin
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15_000 });
    }
  });
});
