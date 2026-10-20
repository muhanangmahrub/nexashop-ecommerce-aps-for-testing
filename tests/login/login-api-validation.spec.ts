// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Negative and Edge', () => {
  test('API validation payloads', async ({ request }) => {
    // 1. POST {} -> field-level errors
    const empty = await request.post('/api/auth/login', { data: {} });
    expect(empty.status()).toBe(400);
    const emptyBody = await empty.json();
    expect(emptyBody.success).toBe(false);
    expect(emptyBody.errors).toEqual({ email: 'Email is required', password: 'Password is required' });

    // POST {email:'abc',password:'x'} -> invalid email
    const badEmail = await request.post('/api/auth/login', { data: { email: 'abc', password: 'x' } });
    expect(badEmail.status()).toBe(400);
    const badBody = await badEmail.json();
    expect(badBody.errors).toEqual({ email: 'Please enter a valid email address' });

    // POST malformed JSON -> 400
    const malformed = await request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: '{bad json',
    });
    expect(malformed.status()).toBe(400);
    const malformedBody = await malformed.json();
    expect(malformedBody.success).toBe(false);
  });
});
