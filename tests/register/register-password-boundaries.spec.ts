// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test } from '../fixtures';
import { expectRegistered, logoutViaUi, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Boundary-valid password values', async ({ page }) => {
    // 1. Register with exactly 8-char 'Passw0r!' and with 128-char valid password
    const passwords = ['Passw0r!', 'Passw0rd!'.padEnd(128, 'a')];

    for (const password of passwords) {
      await registerViaUi(page, validData({ password, confirmPassword: password }));
      await expectRegistered(page);
      await logoutViaUi(page);
    }
  });
});
