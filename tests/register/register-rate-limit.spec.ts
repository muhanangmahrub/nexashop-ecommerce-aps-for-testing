// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Register - Negative and Validation', () => {
  test('Rate limit on register (when enabled)', async ({ request }) => {
    test.skip(
      process.env.RATE_LIMIT_ENABLED !== 'true',
      'Requires the app and this test run to have RATE_LIMIT_ENABLED=true',
    );

    // 1. Send 11 register POSTs in 60s
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request.post('/api/auth/register', { data: {} });
      statuses.push(res.status());
    }

    expect(statuses[10]).toBe(429);
  });
});
