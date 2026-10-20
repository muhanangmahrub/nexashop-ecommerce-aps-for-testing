// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, openUserMenu, registerViaUi, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('HTML tags in name are stripped', async ({ page }) => {
    // 1. Register with name 'John <b>Doe</b>'
    // Observed: accepted and sanitized to 'John Doe' (tags stripped)
    await registerViaUi(page, validData({ name: 'John <b>Doe</b>' }));
    await expectRegistered(page);

    await openUserMenu(page);
    const name = page.getByTestId('user-menu-name');
    await expect(name).toHaveText('John Doe');
    await expect(name.locator('b')).toHaveCount(0);
    expect(await name.innerHTML()).not.toContain('<b>');
  });
});
