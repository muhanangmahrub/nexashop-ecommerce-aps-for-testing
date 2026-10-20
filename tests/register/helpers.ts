import { expect, type Page } from '@playwright/test';

export const VALID_PASSWORD = 'Passw0rd!';

/** Unique, collision-free email for every created user. */
export function uniqueEmail(tag = 'user'): string {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export function validData(overrides: Partial<RegisterData> = {}): RegisterData {
  return {
    name: 'Test User',
    email: uniqueEmail(),
    password: VALID_PASSWORD,
    confirmPassword: overrides.password ?? VALID_PASSWORD,
    acceptTerms: true,
    ...overrides,
  };
}

export async function fillRegisterForm(page: Page, data: RegisterData) {
  await page.getByTestId('register-name-input').fill(data.name);
  await page.getByTestId('register-email-input').fill(data.email);
  await page.getByTestId('register-password-input').fill(data.password);
  await page.getByTestId('register-confirm-password-input').fill(data.confirmPassword);
  if (data.acceptTerms) {
    await page.getByTestId('register-terms-checkbox').check();
  }
}

export async function submitRegister(page: Page) {
  await page.getByTestId('register-submit-btn').click();
}

/** Opens /register, fills the form and submits it. */
export async function registerViaUi(page: Page, data: RegisterData, url = '/register') {
  await page.goto(url);
  await expect(page.getByTestId('register-form')).toBeVisible();
  await fillRegisterForm(page, data);
  await submitRegister(page);
}

export async function expectRegistered(page: Page) {
  await expect(page.getByTestId('user-menu-button')).toBeVisible();
  await expect(page).not.toHaveURL(/\/register/);
}

export async function openUserMenu(page: Page) {
  // The app's button toggles the menu (user-menu.tsx: setOpen(o => !o)), so clicking when it is
  // already open would close it. Only click when the dropdown is not shown (idempotent helper).
  const button = page.getByTestId('user-menu-button');
  const dropdown = page.getByTestId('user-menu-dropdown');
  await expect(button).toBeVisible();
  if (await dropdown.isVisible()) return;
  await expect(async () => {
    if (!(await dropdown.isVisible())) await button.click();
    await expect(dropdown).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

export async function logoutViaUi(page: Page) {
  await openUserMenu(page);
  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('header-login-link')).toBeVisible();
}

/** Field keys map to the data-testid prefix of the inline error element. */
export const FIELD = {
  name: 'register-name-input',
  email: 'register-email-input',
  password: 'register-password-input',
  confirm: 'register-confirm-password-input',
  terms: 'register-terms-checkbox',
} as const;

export function fieldError(page: Page, field: keyof typeof FIELD) {
  return page.getByTestId(`${FIELD[field]}-error`);
}

export async function expectOnlyFieldErrors(page: Page, expected: (keyof typeof FIELD)[]) {
  for (const key of Object.keys(FIELD) as (keyof typeof FIELD)[]) {
    if (expected.includes(key)) {
      await expect(fieldError(page, key)).toBeVisible();
    } else {
      await expect(fieldError(page, key)).toHaveCount(0);
    }
  }
}
