// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, logoutViaUi, openUserMenu, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Boundary-valid name values', async ({ page }) => {
    // 1. Register separately with 2-char name 'Al', 50-char name, and "Mary-Jane O'Neil Jr."
    const names = ['Al', 'a'.repeat(50), "Mary-Jane O'Neil Jr."];

    for (const name of names) {
      await registerViaUi(page, validData({ name }));
      await expectRegistered(page);
      await openUserMenu(page);
      await expect(page.getByTestId('user-menu-name')).toHaveText(name);
      await logoutViaUi(page);
    }
  });
});
