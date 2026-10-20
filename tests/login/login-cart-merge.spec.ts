// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { submitLogin } from './helpers';

const account = { email: 'empty@nexashop.test', password: 'Customer@123' };

test.describe('Login - Positive', () => {
  test('Guest cart merges on login', async ({ page, request }) => {
    // Precondition: make sure the empty@ account really has an empty server-side cart (separate cookie jar)
    const clearServerCart = async () => {
      const res = await request.post('/api/auth/login', { data: account });
      expect(res.ok()).toBeTruthy();
      const del = await request.delete('/api/cart');
      expect(del.ok()).toBeTruthy();
    };
    await clearServerCart();

    try {
      // 1. As guest add a product to cart
      await page.goto('/');
      await page.getByTestId('product-card-add-to-cart-btn').first().click();
      await expect(page.getByTestId('cart-count-badge')).toHaveText('1');

      // ...then login as empty@nexashop.test
      await page.goto('/login');
      await submitLogin(page, account.email, account.password);

      // Toast 'Welcome back!' and the cart badge reflects the guest item after login
      await expect(page.getByText('Welcome back!').first()).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
      await expect(page.getByTestId('user-menu-button')).toBeVisible();
      await expect(page.getByTestId('cart-count-badge')).toHaveText('1');
    } finally {
      await clearServerCart();
    }
  });
});
