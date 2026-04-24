import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leadActivity: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { markLeadAsLost, buildLostActivityDescription } from '@/lib/services/leadLossService';

beforeEach(() => {
  mockPrisma.lead.findUnique.mockReset();
  mockPrisma.lead.update.mockReset();
  mockPrisma.leadActivity.create.mockReset();
});

describe('buildLostActivityDescription', () => {
  it('returns label only when note is empty', () => {
    expect(buildLostActivityDescription('PRICE_TOO_HIGH', null)).toBe('Preu massa alt');
    expect(buildLostActivityDescription('PRICE_TOO_HIGH', '')).toBe('Preu massa alt');
    expect(buildLostActivityDescription('PRICE_TOO_HIGH', '   ')).toBe('Preu massa alt');
  });

  it('appends trimmed note to label when provided', () => {
    expect(buildLostActivityDescription('COMPETITOR_CHOSEN', '  Go DJ era més barat  ')).toBe(
      'Va escollir un competidor — Go DJ era més barat',
    );
  });

  it('uses catalan labels from the canonical registry', () => {
    expect(buildLostActivityDescription('DATE_UNAVAILABLE', null)).toBe('Data no disponible');
    expect(buildLostActivityDescription('NO_RESPONSE', null)).toBe('Sense resposta');
    expect(buildLostActivityDescription('OTHER', null)).toBe('Altres');
  });
});

describe('markLeadAsLost', () => {
  it('rejects unknown reason with 400', async () => {
    const result = await markLeadAsLost({ leadId: 'l1', reason: 'BOGUS_REASON' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/invàlid/i);
    }
    expect(mockPrisma.lead.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when lead is not found', async () => {
    mockPrisma.lead.findUnique.mockResolvedValueOnce(null);

    const result = await markLeadAsLost({ leadId: 'missing', reason: 'PRICE_TOO_HIGH' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
    }
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).not.toHaveBeenCalled();
  });

  it('updates lead to LOST with reason and lostAt, and records leadActivity', async () => {
    const fixedNow = new Date('2026-04-24T10:00:00.000Z');
    mockPrisma.lead.findUnique.mockResolvedValueOnce({ id: 'l1', status: 'NEGOTIATING' });
    mockPrisma.lead.update.mockResolvedValueOnce({
      id: 'l1',
      status: 'LOST',
      lostReason: 'PRICE_TOO_HIGH',
      lostAt: fixedNow,
    });
    mockPrisma.leadActivity.create.mockResolvedValueOnce({ id: 'a1' });

    const result = await markLeadAsLost({
      leadId: 'l1',
      reason: 'PRICE_TOO_HIGH',
      note: 'Pressupost 2k sobre 1.5k',
      actor: 'admin@orbita',
      now: fixedNow,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lead).toEqual({
        id: 'l1',
        status: 'LOST',
        lostReason: 'PRICE_TOO_HIGH',
        lostAt: fixedNow,
      });
    }

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: {
        status: 'LOST',
        lostReason: 'PRICE_TOO_HIGH',
        lostAt: fixedNow,
      },
      select: { id: true, status: true, lostReason: true, lostAt: true },
    });

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: {
        leadId: 'l1',
        type: 'STATUS_CHANGE',
        title: 'Lead perdut',
        description: 'Preu massa alt — Pressupost 2k sobre 1.5k',
        metadata: {
          fromStatus: 'NEGOTIATING',
          toStatus: 'LOST',
          reason: 'PRICE_TOO_HIGH',
          note: 'Pressupost 2k sobre 1.5k',
        },
        createdBy: 'admin@orbita',
      },
    });
  });

  it('defaults actor to "Admin" and uses new Date() when now is not provided', async () => {
    mockPrisma.lead.findUnique.mockResolvedValueOnce({ id: 'l2', status: 'QUOTE_SENT' });
    mockPrisma.lead.update.mockResolvedValueOnce({
      id: 'l2',
      status: 'LOST',
      lostReason: 'NO_RESPONSE',
      lostAt: new Date(),
    });
    mockPrisma.leadActivity.create.mockResolvedValueOnce({ id: 'a2' });

    const before = Date.now();
    const result = await markLeadAsLost({ leadId: 'l2', reason: 'NO_RESPONSE' });
    const after = Date.now();

    expect(result.ok).toBe(true);
    const updateCall = mockPrisma.lead.update.mock.calls[0][0];
    const lostAt: Date = updateCall.data.lostAt;
    expect(lostAt).toBeInstanceOf(Date);
    expect(lostAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(lostAt.getTime()).toBeLessThanOrEqual(after);

    const activityCall = mockPrisma.leadActivity.create.mock.calls[0][0];
    expect(activityCall.data.createdBy).toBe('Admin');
    expect(activityCall.data.description).toBe('Sense resposta');
    expect(activityCall.data.metadata.note).toBeNull();
  });

  it('accepts all 8 canonical lost reasons', async () => {
    const reasons = [
      'PRICE_TOO_HIGH',
      'DATE_UNAVAILABLE',
      'COMPETITOR_CHOSEN',
      'EVENT_CANCELLED',
      'NO_RESPONSE',
      'NOT_QUALIFIED',
      'OUT_OF_AREA',
      'OTHER',
    ] as const;

    for (const reason of reasons) {
      mockPrisma.lead.findUnique.mockResolvedValueOnce({ id: 'l', status: 'NEW' });
      mockPrisma.lead.update.mockResolvedValueOnce({
        id: 'l',
        status: 'LOST',
        lostReason: reason,
        lostAt: new Date(),
      });
      mockPrisma.leadActivity.create.mockResolvedValueOnce({ id: 'a' });

      const result = await markLeadAsLost({ leadId: 'l', reason });
      expect(result.ok).toBe(true);
    }
  });
});
