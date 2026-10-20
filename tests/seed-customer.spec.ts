import { test, ACCOUNTS, login } from './fixtures';

// Seed for Playwright agents: logged-in customer (customer1@nexashop.test).
test.describe('Seed (customer)', () => {
  test('seed', async ({ page }) => {
    await login(page, ACCOUNTS.customer);
  });
});
