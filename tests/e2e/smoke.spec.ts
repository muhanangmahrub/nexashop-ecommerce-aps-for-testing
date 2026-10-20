import { ACCOUNTS, expect, login, test } from '../fixtures';

test('health endpoint reports ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe('ok');
});

test('customer can log in and see the user menu', async ({ page }) => {
  await login(page, ACCOUNTS.customer);
  await page.getByTestId('user-menu-button').click();
  await expect(page.getByTestId('user-menu-email')).toHaveText(ACCOUNTS.customer.email);
});

test('invalid login shows an error', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(ACCOUNTS.customer.email);
  await page.getByTestId('login-password-input').fill('WrongPass@1');
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
});

test('product listing shows 20 items per page', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByTestId('product-card')).toHaveCount(20);
});
