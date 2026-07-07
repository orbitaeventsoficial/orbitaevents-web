import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCheckRateLimit,
  mockVerifyTurnstileToken,
  mockPersistContactLead,
  mockSendEmailWithTimeout,
  mockGetRecipientsAsString,
} = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockVerifyTurnstileToken: vi.fn(),
  mockPersistContactLead: vi.fn(),
  mockSendEmailWithTimeout: vi.fn(),
  mockGetRecipientsAsString: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: { contact: { windowMs: 60_000, max: 5 } },
}));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: mockVerifyTurnstileToken }));
vi.mock('@/lib/services/contactLeadCaptureService', () => ({ persistContactLead: mockPersistContactLead }));
vi.mock('@/lib/email', () => ({ sendEmailWithTimeout: mockSendEmailWithTimeout }));
vi.mock('@/lib/services/notificationRecipientsService', () => ({ getRecipientsAsString: mockGetRecipientsAsString }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

import { POST } from '@/app/api/contact/route';

const VALID_BODY = {
  name: 'Laia Soler',
  contact: '+34699111222',
  phone: '+34699111222',
  event: 'wedding',
  location: 'Barcelona',
  message: 'Vull informació per una festa.',
  locale: 'ca',
  turnstileToken: 'turnstile-ok',
};

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'accept-language': 'ca',
    },
  });
}

describe('/api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockPersistContactLead.mockResolvedValue({ leadId: 'lead-real-1' });
    mockSendEmailWithTimeout.mockResolvedValue(undefined);
    mockGetRecipientsAsString.mockResolvedValue('admin@example.com');
  });

  it('retorna el leadId real guardat, no una referència efímera', async () => {
    const res = await POST(makePostReq(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.leadId).toBe('lead-real-1');
    expect(body.leadId).not.toMatch(/^OE-/);
    expect(mockPersistContactLead).toHaveBeenCalledWith(expect.objectContaining({
      eventLocation: 'Barcelona',
      preferredLocale: 'ca',
    }));
    expect(mockSendEmailWithTimeout).toHaveBeenCalledOnce();
  });

  it('no retorna ok ni envia emails si la persistència no crea cap Lead', async () => {
    mockPersistContactLead.mockResolvedValueOnce({ leadId: null });

    const res = await POST(makePostReq(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.ok).not.toBe(true);
    expect(body.error).toBeTruthy();
    expect(mockSendEmailWithTimeout).not.toHaveBeenCalled();
  });
});
