// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { uniqueEmail, validData } from './helpers';

test.describe('Register - Negative and Validation', () => {
  test('API validation responses', async ({ request }) => {
    // 1. POST /api/auth/register with {}
    const empty = await request.post('/api/auth/register', { data: {} });
    expect(empty.status()).toBe(400);
    const emptyBody = await empty.json();
    expect(emptyBody.success).toBe(false);
    expect(emptyBody.errors).toEqual({
      name: 'Name is required',
      email: 'Email is required',
      password: 'Password is required',
      confirmPassword: 'Please confirm your password',
      acceptTerms: 'You must accept the terms and conditions',
    });

    // 2. POST valid body twice
    const body = validData({ email: uniqueEmail('api') });
    const payload = {
      name: body.name,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      acceptTerms: true,
    };
    const first = await request.post('/api/auth/register', { data: payload });
    expect(first.status()).toBe(201);
    const second = await request.post('/api/auth/register', { data: payload });
    expect(second.status()).toBe(409);
    const secondBody = await second.json();
    expect(secondBody.success).toBe(false);
    expect(secondBody.errors).toEqual({ email: 'Email already exists' });

    // 3. POST with acceptTerms as string 'true' (strict literal true)
    const strTerms = await request.post('/api/auth/register', {
      data: { ...payload, email: uniqueEmail('api'), acceptTerms: 'true' },
    });
    expect(strTerms.status()).toBe(400);
    const strBody = await strTerms.json();
    expect(strBody.errors.acceptTerms).toBe('You must accept the terms and conditions');
  });
});
