// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, registerViaUi, validData } from './helpers';

test.describe('Register - Positive', () => {
  test('Registration with redirect param', async ({ page }) => {
    // 1. Open /register?redirect=%2Fcart and register
    await registerViaUi(page, validData(), '/register?redirect=%2Fcart');

    await expect(page).toHaveURL(/\/cart$/);
    await expectRegistered(page);
  });
});
