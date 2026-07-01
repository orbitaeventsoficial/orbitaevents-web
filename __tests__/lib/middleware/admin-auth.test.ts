import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockCheckAdminRateLimit, mockRecordFailedAttempt } = vi.hoisted(() => ({
  mockCheckAdminRateLimit: vi.fn(),
  mockRecordFailedAttempt: vi.fn(),
}));

vi.mock('@/lib/middleware/admin-rate-limit', () => ({
  checkAdminRateLimit: mockCheckAdminRateLimit,
  recordFailedAttempt: mockRecordFailedAttempt,
}));

function makeRequest(path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  return new NextRequest(`https://orbitaevents.com${path}`, init);
}

function basic(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

describe('handleAdminAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASS', 'secret:with-colon');
    vi.stubEnv('ADMIN_KEY', 'api-key-123');
    mockCheckAdminRateLimit.mockResolvedValue(true);
  });

  it('emet cookie de sessió amb Basic correcte', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const res = await handleAdminAuth(makeRequest('/admin', {
      headers: { authorization: basic('admin', 'secret:with-colon') },
    }));

    expect(res?.status).toBe(200);
    expect(res?.headers.get('set-cookie')).toContain('admin-session=');
  });

  it('rebutja Basic incorrecte i registra intent fallit', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const res = await handleAdminAuth(makeRequest('/admin', {
      headers: { authorization: basic('admin', 'wrong') },
    }));

    expect(res?.status).toBe(401);
    expect(mockRecordFailedAttempt).toHaveBeenCalledOnce();
  });

  it('permet Bearer correcte sense cookie', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const res = await handleAdminAuth(makeRequest('/api/admin/bookings', {
      headers: { authorization: 'Bearer api-key-123' },
    }));

    expect(res).toBeNull();
  });

  it('accepta la cookie de sessió emesa prèviament', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const login = await handleAdminAuth(makeRequest('/admin', {
      headers: { authorization: basic('admin', 'secret:with-colon') },
    }));
    const cookie = login?.headers.get('set-cookie')?.match(/admin-session=([^;]+)/)?.[1];

    const res = await handleAdminAuth(makeRequest('/admin/bookings', {
      headers: cookie ? { cookie: `admin-session=${cookie}` } : {},
    }));

    expect(cookie).toBeTruthy();
    expect(res).toBeNull();
  });

  it('bloqueja mutacions API amb Basic correcte però sense CSRF', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const res = await handleAdminAuth(makeRequest('/api/admin/bookings', {
      method: 'POST',
      headers: { authorization: basic('admin', 'secret:with-colon') },
    }));

    expect(res?.status).toBe(403);
    expect(res?.headers.get('set-cookie')).toBeNull();
  });

  it('bloqueja mutacions API amb sessió persistent però sense CSRF', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const login = await handleAdminAuth(makeRequest('/admin', {
      headers: { authorization: basic('admin', 'secret:with-colon') },
    }));
    const cookie = login?.headers.get('set-cookie')?.match(/admin-session=([^;]+)/)?.[1];

    const res = await handleAdminAuth(makeRequest('/api/admin/bookings', {
      method: 'POST',
      headers: cookie ? { cookie: `admin-session=${cookie}` } : {},
    }));

    expect(cookie).toBeTruthy();
    expect(res?.status).toBe(403);
  });

  it('permet mutacions API amb sessió persistent i CSRF coincident', async () => {
    const { handleAdminAuth } = await import('@/lib/middleware/admin-auth');
    const login = await handleAdminAuth(makeRequest('/admin', {
      headers: { authorization: basic('admin', 'secret:with-colon') },
    }));
    const cookie = login?.headers.get('set-cookie')?.match(/admin-session=([^;]+)/)?.[1];

    const res = await handleAdminAuth(makeRequest('/api/admin/bookings', {
      method: 'POST',
      headers: cookie ? {
        cookie: `admin-session=${cookie}; csrf-token=csrf-123`,
        'x-csrf-token': 'csrf-123',
      } : {},
    }));

    expect(cookie).toBeTruthy();
    expect(res).toBeNull();
  });
});
