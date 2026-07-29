import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCountPendingTestimonials,
  mockListPendingTestimonialsForReminder,
  mockSendTrackedStandaloneEmail,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCountPendingTestimonials: vi.fn(),
  mockListPendingTestimonialsForReminder: vi.fn(),
  mockSendTrackedStandaloneEmail: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: () => 'https://test.orbita.events' }));
vi.mock('@/lib/email', () => ({ sendTrackedStandaloneEmail: mockSendTrackedStandaloneEmail }));
vi.mock('@/lib/services/testimonialAdminService', () => ({
  countPendingTestimonials: mockCountPendingTestimonials,
  listPendingTestimonialsForReminder: mockListPendingTestimonialsForReminder,
}));

import { POST } from '@/app/api/admin/emails/testimonials-reminder/route';

describe('POST /api/admin/emails/testimonials-reminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_TO = 'admin@example.com';
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCountPendingTestimonials.mockResolvedValue(5);
    mockListPendingTestimonialsForReminder.mockResolvedValue([
      {
        id: 'testimonial-1',
        name: 'Maria',
        email: 'maria@example.com',
        rating: 5,
        textPreview: 'Ens va encantar el bolo',
        createdAt: new Date('2026-07-10T10:00:00.000Z'),
      },
    ]);
    mockSendTrackedStandaloneEmail.mockResolvedValue({ emailSendId: 'email-send-1' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));

    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('envia recordatori traçat si hi ha testimonis pendents', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, pendingCount: 5, sent: true });
    expect(mockListPendingTestimonialsForReminder).toHaveBeenCalledWith();
    expect(mockSendTrackedStandaloneEmail).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'testimonials-reminder',
      to: 'admin@example.com',
      subject: "Testimonis pendents d'aprovació (5) - Òrbita Events",
      locale: 'ca',
      html: expect.stringContaining('Ens va encantar el bolo'),
      orbita: { kind: 'admin', origin: 'testimonials-reminder' },
    }));
    expect(mockSendTrackedStandaloneEmail.mock.calls[0][0].html).toContain('/admin/ressenyes#pendents');
  });

  it('no envia email si no hi ha testimonis pendents', async () => {
    mockCountPendingTestimonials.mockResolvedValueOnce(0);

    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, pendingCount: 0, sent: false });
    expect(mockListPendingTestimonialsForReminder).not.toHaveBeenCalled();
    expect(mockSendTrackedStandaloneEmail).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla', async () => {
    mockCountPendingTestimonials.mockRejectedValueOnce(new Error('DB'));

    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));

    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
