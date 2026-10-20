// spec: specs/login-register.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Login - Negative and Edge', () => {
  test('Rate limit response (when enabled)', async ({ request }) => {
    // Environment default is RATE_LIMIT_ENABLED=false. Set RATE_LIMIT_ENABLED=true (app and runner env) to run.
    test.skip(process.env.RATE_LIMIT_ENABLED !== 'true', 'Requires RATE_LIMIT_ENABLED=true');

    // 1. With RATE_LIMIT_ENABLED=true send 21 login POSTs in 60s
    // An unknown email is used so that no real account is locked out.
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      const res = await request.post('/api/auth/login', {
        data: { email: 'ratelimit-nobody@nexashop.test', password: 'Wrong@123' },
      });
      statuses.push(res.status());
    }

    // 21st returns 429
    expect(statuses[0]).toBe(401);
    expect(statuses[20]).toBe(429);
  });
});
