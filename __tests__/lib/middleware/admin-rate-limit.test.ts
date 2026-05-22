import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeMockRequest(ip: string) {
  return {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return ip;
        return null;
      },
    },
  };
}

describe('checkAdminRateLimit — DISABLE_ADMIN_RATE_LIMIT', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  it('retorna true immediatament en dev amb DISABLE_ADMIN_RATE_LIMIT=1', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DISABLE_ADMIN_RATE_LIMIT', '1');
    const { checkAdminRateLimit } = await import('@/lib/middleware/admin-rate-limit');
    const result = await checkAdminRateLimit(makeMockRequest('1.2.3.4') as never);
    expect(result).toBe(true);
  });

  it('NO bypass si NODE_ENV=production fins i tot amb DISABLE_ADMIN_RATE_LIMIT=1', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DISABLE_ADMIN_RATE_LIMIT', '1');
    const { checkAdminRateLimit, recordFailedAttempt } = await import('@/lib/middleware/admin-rate-limit');
    const req = makeMockRequest('2.3.4.5') as never;
    for (let i = 0; i < 5; i++) await recordFailedAttempt(req);
    const result = await checkAdminRateLimit(req);
    expect(result).toBe(false);
  });

  it('NO bypass si DISABLE_ADMIN_RATE_LIMIT no és "1" (valor "0")', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DISABLE_ADMIN_RATE_LIMIT', '0');
    const { checkAdminRateLimit, recordFailedAttempt } = await import('@/lib/middleware/admin-rate-limit');
    const req = makeMockRequest('3.4.5.6') as never;
    for (let i = 0; i < 5; i++) await recordFailedAttempt(req);
    const result = await checkAdminRateLimit(req);
    expect(result).toBe(false);
  });

  it('NO bypass si DISABLE_ADMIN_RATE_LIMIT no és "1" (valor buit)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DISABLE_ADMIN_RATE_LIMIT', '');
    const { checkAdminRateLimit, recordFailedAttempt } = await import('@/lib/middleware/admin-rate-limit');
    const req = makeMockRequest('4.5.6.7') as never;
    for (let i = 0; i < 5; i++) await recordFailedAttempt(req);
    const result = await checkAdminRateLimit(req);
    expect(result).toBe(false);
  });

  it('limita correctament (comportament base) sense bypass: OK fins al límit, FAIL en superar-lo', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DISABLE_ADMIN_RATE_LIMIT', '');
    const { checkAdminRateLimit, recordFailedAttempt } = await import('@/lib/middleware/admin-rate-limit');
    const req = makeMockRequest('10.0.0.1') as never;
    expect(await checkAdminRateLimit(req)).toBe(true);
    for (let i = 0; i < 5; i++) await recordFailedAttempt(req);
    expect(await checkAdminRateLimit(req)).toBe(false);
  });
});
