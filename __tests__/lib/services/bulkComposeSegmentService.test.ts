import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockLoadPendingFollowUps, mockSendAdminEmail } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findMany: vi.fn(),
    },
  },
  mockLoadPendingFollowUps: vi.fn(),
  mockSendAdminEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/responseTrackingService', () => ({
  loadPendingFollowUps: mockLoadPendingFollowUps,
}));
vi.mock('@/lib/services/adminEmailSendService', () => ({
  sendAdminEmail: mockSendAdminEmail,
}));

import {
  loadBulkComposeAudience,
  sendBulkComposeSegment,
} from '@/lib/services/bulkComposeSegmentService';

describe('bulkComposeSegmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.customer.findMany.mockResolvedValue([
      { id: 'c1', name: 'Maria', email: 'maria@test.com', preferredLocale: 'ca' },
    ]);
    mockLoadPendingFollowUps.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      total: 2,
      urgent: 1,
      normal: 1,
      low: 0,
      items: [
        {
          leadId: 'l1',
          customerId: null,
          name: 'Joan',
          email: 'joan@test.com',
          phone: null,
          eventType: 'WEDDING',
          status: 'CONTACTED',
          preferredLocale: 'ca',
          contactedAt: new Date('2026-04-01T00:00:00.000Z'),
          lastOutboundAt: new Date('2026-04-10T00:00:00.000Z'),
          daysSinceOutbound: 8,
          outboundCount: 2,
          hasInboundAfterOutbound: false,
          urgency: 'URGENT',
          suggestedAction: 'Trucar',
        },
        {
          leadId: 'l2',
          customerId: null,
          name: 'Pau',
          email: 'pau@test.com',
          phone: null,
          eventType: 'WEDDING',
          status: 'CONTACTED',
          preferredLocale: 'ca',
          contactedAt: new Date('2026-04-01T00:00:00.000Z'),
          lastOutboundAt: new Date('2026-04-15T00:00:00.000Z'),
          daysSinceOutbound: 4,
          outboundCount: 1,
          hasInboundAfterOutbound: false,
          urgency: 'NORMAL',
          suggestedAction: 'Email',
        },
      ],
    });
    mockSendAdminEmail.mockResolvedValue({ ok: true, status: 200, body: { ok: true } });
  });

  it('carrega el segment de clients de bodes 2025', async () => {
    const audience = await loadBulkComposeAudience('customers-weddings-2025');

    expect(audience).toEqual(expect.objectContaining({
      key: 'customers-weddings-2025',
      recipients: [
        expect.objectContaining({
          id: 'c1',
          entityType: 'customer',
          email: 'maria@test.com',
        }),
      ],
    }));
  });

  it('carrega el segment de leads sense resposta 7d des del servei canònic de follow-ups', async () => {
    const audience = await loadBulkComposeAudience('leads-no-response-7d');

    expect(audience?.recipients).toHaveLength(1);
    expect(audience?.recipients[0]).toEqual(expect.objectContaining({
      id: 'l1',
      entityType: 'lead',
      email: 'joan@test.com',
    }));
  });

  it('envia la campanya en bulk personalitzant {nom}', async () => {
    const result = await sendBulkComposeSegment({
      segmentKey: 'customers-weddings-2025',
      subject: 'Hola {nom}',
      body: 'Missatge per a {nom}',
      templateKey: 'bulk-test',
    });

    expect(result).toEqual({
      ok: true,
      segmentKey: 'customers-weddings-2025',
      audienceSize: 1,
      sent: 1,
      failed: 0,
    });
    expect(mockSendAdminEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'maria@test.com',
      subject: 'Hola Maria',
      body: 'Missatge per a Maria',
      customerId: 'c1',
      templateKey: 'bulk-test',
    }));
  });
});
