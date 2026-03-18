/**
 * Tests per el middleware de Next.js.
 * Cobreix: bloqueig bots, redirect www, redirects legacy, protecció admin, i18n.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ─── Mocks (vi.hoisted per evitar TDZ) ─────────────────────────────────────

const { mockHandleAdminAuth } = vi.hoisted(() => ({
  mockHandleAdminAuth: vi.fn(),
}));

vi.mock('@/lib/middleware/admin-auth', () => ({
  handleAdminAuth: mockHandleAdminAuth,
}));

// Mock next-intl/middleware — retorna un passthrough
vi.mock('next-intl/middleware', () => ({
  default: () => () => NextResponse.next(),
}));

import { middleware } from '@/middleware';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createRequest(
  url: string,
  options: { userAgent?: string; host?: string; locale?: string; acceptLanguage?: string } = {},
): NextRequest {
  const fullUrl = url.startsWith('http') ? url : `https://orbitaevents.com${url}`;
  const req = new NextRequest(fullUrl, {
    headers: {
      'user-agent': options.userAgent || 'Mozilla/5.0 Chrome/120',
      host: options.host || 'orbitaevents.com',
      ...(options.acceptLanguage ? { 'accept-language': options.acceptLanguage } : {}),
    },
  });

  // Set cookie if locale specified
  if (options.locale) {
    req.cookies.set('NEXT_LOCALE', options.locale);
  }

  return req;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Bot blocking ──────────────────────────────────────────────────────

  describe('bloqueig de bots', () => {
    const abusiveBots = [
      'AhrefsBot/7.0',
      'SemrushBot/7.0',
      'DotBot/1.0',
      'MJ12bot/v1.4',
      'BLEXBot/1.0',
      'DataForSeoBot/1.0',
      'serpstatbot/1.0',
      'Bytespider',
      'PetalBot/2.0',
      'YandexBot/3.0',
    ];

    for (const bot of abusiveBots) {
      it(`bloqueja ${bot.split('/')[0]}`, async () => {
        const req = createRequest('/', { userAgent: bot });
        const response = await middleware(req);
        expect(response.status).toBe(403);
      });
    }

    it('permet navegadors reals', async () => {
      const req = createRequest('/');
      const response = await middleware(req);
      expect(response.status).not.toBe(403);
    });

    it('permet Googlebot', async () => {
      const req = createRequest('/', { userAgent: 'Googlebot/2.1' });
      const response = await middleware(req);
      expect(response.status).not.toBe(403);
    });
  });

  // ── www redirect ──────────────────────────────────────────────────────

  describe('redirect www', () => {
    it('redirigeix www a no-www amb 301', async () => {
      const req = createRequest('/test-page', { host: 'www.orbitaevents.com' });
      const response = await middleware(req);
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toContain('orbitaevents.com');
      expect(response.headers.get('location')).not.toContain('www.');
    });
  });

  // ── Legacy redirects ──────────────────────────────────────────────────

  describe('redirects legacy', () => {
    it('redirigeix /contacte a /ca/contacto', async () => {
      const req = createRequest('/contacte');
      const response = await middleware(req);
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toContain('/ca/contacto');
    });

    it('redirigeix /sobre-nosaltres a /ca/about', async () => {
      const req = createRequest('/sobre-nosaltres');
      const response = await middleware(req);
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toContain('/ca/about');
    });
  });

  // ── Admin auth ────────────────────────────────────────────────────────

  describe('protecció admin', () => {
    it('delega /admin a handleAdminAuth', async () => {
      mockHandleAdminAuth.mockResolvedValue(null);
      const req = createRequest('/admin');
      await middleware(req);
      expect(mockHandleAdminAuth).toHaveBeenCalledOnce();
    });

    it('delega /admin/bookings a handleAdminAuth', async () => {
      mockHandleAdminAuth.mockResolvedValue(null);
      const req = createRequest('/admin/bookings');
      await middleware(req);
      expect(mockHandleAdminAuth).toHaveBeenCalledOnce();
    });

    it('delega /api/admin a handleAdminAuth', async () => {
      mockHandleAdminAuth.mockResolvedValue(null);
      const req = createRequest('/api/admin/leads');
      await middleware(req);
      expect(mockHandleAdminAuth).toHaveBeenCalledOnce();
    });

    it('no aplica auth a rutes públiques', async () => {
      const req = createRequest('/ca/about');
      await middleware(req);
      expect(mockHandleAdminAuth).not.toHaveBeenCalled();
    });
  });

  // ── Skip i18n ─────────────────────────────────────────────────────────

  describe('skip i18n per rutes no-page', () => {
    it('passa directament les rutes /api', async () => {
      const req = createRequest('/api/health');
      const response = await middleware(req);
      expect(response.status).toBe(200);
    });

    it('passa directament fitxers estàtics (amb .)', async () => {
      const req = createRequest('/favicon.ico');
      const response = await middleware(req);
      expect(response.status).toBe(200);
    });
  });

  // ── i18n routing ──────────────────────────────────────────────────────

  describe('i18n routing', () => {
    it('processa rutes amb locale prefix', async () => {
      const req = createRequest('/ca/about');
      const response = await middleware(req);
      expect(response.status).toBe(200);
    });

    it('processa rutes amb locale es', async () => {
      const req = createRequest('/es/about');
      const response = await middleware(req);
      expect(response.status).toBe(200);
    });

    it('redirigeix si cookie NEXT_LOCALE diferent del default', async () => {
      const req = createRequest('/about', { locale: 'es' });
      const response = await middleware(req);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/es/about');
    });
  });
});
