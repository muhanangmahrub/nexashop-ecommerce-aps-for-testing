import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '../fixtures';

/** Reset lockout state / failed-attempt counter (TEST_MODE only endpoint). */
export async function unlock(request: APIRequestContext, email: string) {
  const res = await request.post('/api/test/unlock', { data: { email } });
  expect(res.status(), `unlock ${email}`).toBe(200);
}

/** Fill the login form and click submit (does not wait for a result). */
export async function submitLogin(page: Page, email: string, password: string) {
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
}

/** Log in via the UI and wait for the redirect to home (first login after a cold start can be slow). */
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login');
  await submitLogin(page, email, password);
  await expect(page).toHaveURL(/^[^?#]*\/$/, { timeout: 30_000 });
  await expect(page.getByTestId('user-menu-button')).toBeVisible();
}

/** Count POST requests made to the login API. */
export function trackLoginRequests(page: Page) {
  const counter = { count: 0 };
  page.on('request', (req) => {
    if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/auth/login') counter.count++;
  });
  return counter;
}
