// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, openUserMenu, registerViaUi, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Name leading/trailing whitespace is trimmed', async ({ page }) => {
    // 1. Register with name '   Jane Doe   '
    await registerViaUi(page, validData({ name: '   Jane Doe   ' }));
    await expectRegistered(page);

    await openUserMenu(page);
    await expect(page.getByTestId('user-menu-name')).toHaveText('Jane Doe');
  });
});
