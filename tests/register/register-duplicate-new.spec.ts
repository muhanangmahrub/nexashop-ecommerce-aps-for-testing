// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { expectRegistered, fieldError, logoutViaUi, registerViaUi, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('Duplicate of a just-registered email', async ({ page }) => {
    const data = validData();

    // 1. Register a new unique email, logout, register same email again
    await registerViaUi(page, data);
    await expectRegistered(page);
    await logoutViaUi(page);

    await registerViaUi(page, data);
    await expect(fieldError(page, 'email')).toHaveText('Email already exists');
    await expect(page.getByTestId('register-error')).toHaveText('Email already exists');
    await expect(page).toHaveURL(/\/register/);
  });
});
