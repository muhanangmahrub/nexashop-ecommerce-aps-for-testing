// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import {
  expectRegistered,
  fieldError,
  fillRegisterForm,
  logoutViaUi,
  openUserMenu,
  registerViaUi,
  submitRegister,
  validData,
} from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Unicode and emoji in name', async ({ page }) => {
    // 1. Names 'José Álvarez' and 'Zoë' (valid, letters)
    for (const name of ['José Álvarez', 'Zoë']) {
      await registerViaUi(page, validData({ name }));
      await expectRegistered(page);
      await openUserMenu(page);
      await expect(page.getByTestId('user-menu-name')).toHaveText(name);
      await logoutViaUi(page);
    }

    // 2. 'John 😀' is rejected
    await page.goto('/register');
    await fillRegisterForm(page, validData({ name: 'John 😀' }));
    await submitRegister(page);
    await expect(fieldError(page, 'name')).toHaveText(
      'Name may only contain letters, spaces, apostrophes, periods and hyphens',
    );
    await expect(page).toHaveURL(/\/register/);
  });
});
