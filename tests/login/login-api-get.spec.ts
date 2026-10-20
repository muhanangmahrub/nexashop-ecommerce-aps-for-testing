// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Negative and Edge', () => {
  test('GET on login API', async ({ request }) => {
    // 1. GET /api/auth/login
    const res = await request.get('/api/auth/login');

    // 400 'Use POST to log in'
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Use POST to log in');
  });
});
