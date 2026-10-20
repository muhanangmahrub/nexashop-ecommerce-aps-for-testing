// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Register - Positive', () => {
  test('Password strength indicator and rules checklist', async ({ page }) => {
    await page.goto('/register');
    const password = page.getByTestId('register-password-input');
    const label = page.getByTestId('password-strength-label');
    const rule = (i: number) => page.getByTestId(`password-rule-${i}`);

    // 1. Type 'aaaaaaaa'
    await password.fill('aaaaaaaa');
    await expect(label).toHaveText('Weak');
    // rule 0 = length, 1 = uppercase, 2 = lowercase, 3 = number, 4 = special
    await expect(rule(0)).toHaveAttribute('data-met', 'true');
    await expect(rule(1)).toHaveAttribute('data-met', 'false');
    await expect(rule(2)).toHaveAttribute('data-met', 'true');
    await expect(rule(3)).toHaveAttribute('data-met', 'false');
    await expect(rule(4)).toHaveAttribute('data-met', 'false');

    // 2. Type 'Passw0rd!'
    await password.fill('Passw0rd!');
    await expect(label).toHaveText('Good');
    for (let i = 0; i < 5; i++) {
      await expect(rule(i)).toHaveAttribute('data-met', 'true');
    }

    // 3. Type 'Passw0rd!Passw0rd!'
    await password.fill('Passw0rd!Passw0rd!');
    await expect(label).toHaveText('Strong');
  });
});
