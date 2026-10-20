// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect, login } from '../fixtures';
import { expectRegistered, logoutViaUi, openUserMenu, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Email is stored lowercase and trimmed', async ({ page }) => {
    const lower = `new.user.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
    const messy = `  ${lower.replace('new.user', 'New.User').replace('@example.com', '@Example.COM')}  `;
    const data = validData({ email: messy });

    // 1. Register with '  New.User@Example.COM  ', then login with the lowercase form
    await registerViaUi(page, data);
    await expectRegistered(page);

    await openUserMenu(page);
    await expect(page.getByTestId('user-menu-email')).toHaveText(lower);

    await logoutViaUi(page);
    await login(page, { email: lower, password: data.password });
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
