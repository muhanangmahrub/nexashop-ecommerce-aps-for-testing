// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Valid registration (TEST_MODE)', async ({ page }) => {
    // 1. Fill name 'Test User', unique email, 'Passw0rd!' for password and confirm, check terms, submit
    await registerViaUi(page, validData({ name: 'Test User' }));

    await expect(page.getByText('Account created successfully!')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expectRegistered(page);

    // Welcome notification created
    await expect(page.getByTestId('notification-count-badge')).toHaveText('1');
  });
});
