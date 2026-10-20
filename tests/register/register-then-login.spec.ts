// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect, login } from '../fixtures';
import { expectRegistered, logoutViaUi, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Registered user can log in again', async ({ page }) => {
    const data = validData();

    // 1. Register, logout, login with the same credentials
    await registerViaUi(page, data);
    await expectRegistered(page);

    await logoutViaUi(page);

    await login(page, { email: data.email, password: data.password });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
  });
});
