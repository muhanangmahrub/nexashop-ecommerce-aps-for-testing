import { test as base, expect, type Page } from '@playwright/test';

export const ACCOUNTS = {
  superAdmin: { email: 'superadmin@nexashop.test', password: 'SuperAdmin@123' },
  admin: { email: 'admin1@nexashop.test', password: 'Admin@123' },
  customer: { email: 'customer1@nexashop.test', password: 'Customer@123' },
  banned: { email: 'banned@nexashop.test', password: 'Customer@123' },
  lockout: { email: 'lockout@nexashop.test', password: 'Customer@123' },
};

export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(account.email);
  await page.getByTestId('login-password-input').fill(account.password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('user-menu-button')).toBeVisible();
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Pre-dismiss the cookie banner so it never overlaps interactive elements.
    await page.addInitScript(() => localStorage.setItem('nexashop-cookie-consent', 'accepted'));
    await use(page);
  },
});

export { expect };
