import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import crypto from 'crypto';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  verifyGoogleOAuthState,
  exchangeGoogleOAuthCode,
  upsertIntegrationSetting,
  upsertIntegrationSettings,
} from '@/lib/services/googleOAuthService';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.upsert.mockResolvedValue({});
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

// ═══════════ verifyGoogleOAuthState ═══════════

describe('verifyGoogleOAuthState', () => {
  const secret = 'test-secret-key';

  function createValidState(secret: string, ageSeconds = 0): string {
    const ts = Math.floor(Date.now() / 1000) - ageSeconds;
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${ts}:${nonce}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  it('verifica estat vàlid', () => {
    const state = createValidState(secret);
    expect(verifyGoogleOAuthState(state, secret)).toBe(true);
  });

  it('rebutja estat expirat (>10 min)', () => {
    const state = createValidState(secret, 601); // 10min + 1s
    expect(verifyGoogleOAuthState(state, secret)).toBe(false);
  });

  it('rebutja estat amb signatura incorrecta', () => {
    const state = createValidState(secret);
    const tampered = state.slice(0, -3) + 'abc';
    expect(verifyGoogleOAuthState(tampered, 'wrong-secret')).toBe(false);
  });

  it('rebutja estat amb format incorrecte', () => {
    expect(verifyGoogleOAuthState('invalid', secret)).toBe(false);
    expect(verifyGoogleOAuthState('', secret)).toBe(false);
    expect(verifyGoogleOAuthState('a.b.c', secret)).toBe(false);
  });

  it('rebutja estat amb timestamp futur', () => {
    const futureTs = Math.floor(Date.now() / 1000) + 100;
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${futureTs}:${nonce}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    expect(verifyGoogleOAuthState(`${payload}.${sig}`, secret)).toBe(false);
  });
});

// ═══════════ exchangeGoogleOAuthCode ═══════════

describe('exchangeGoogleOAuthCode', () => {
  it('retorna tokens en cas d\'èxit', async () => {
    const mockTokens = { access_token: 'at', refresh_token: 'rt', expires_in: 3600 };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTokens),
    });

    const result = await exchangeGoogleOAuthCode({
      code: 'auth-code',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost/callback',
    });

    expect(result).toEqual(mockTokens);
  });

  it('llança error si resposta no és ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('invalid_grant'),
    });

    await expect(
      exchangeGoogleOAuthCode({
        code: 'bad-code',
        clientId: 'ci',
        clientSecret: 'cs',
        redirectUri: 'http://localhost/cb',
      }),
    ).rejects.toThrow('Token exchange failed');
  });
});

// ═══════════ upsertIntegrationSetting(s) ═══════════

describe('upsertIntegrationSetting', () => {
  it('fa upsert d\'un setting', async () => {
    await upsertIntegrationSetting('google.token', 'value', 'Google Token');

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
      where: { key: 'google.token' },
      update: { value: 'value', type: 'STRING', category: 'integrations', label: 'Google Token' },
      create: { key: 'google.token', value: 'value', type: 'STRING', category: 'integrations', label: 'Google Token' },
    });
  });
});

describe('upsertIntegrationSettings', () => {
  it('fa upsert de múltiples settings', async () => {
    await upsertIntegrationSettings([
      { key: 'a', value: '1', label: 'A' },
      { key: 'b', value: '2', label: 'B' },
    ]);

    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(2);
  });
});
