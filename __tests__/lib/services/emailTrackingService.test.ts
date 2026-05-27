// __tests__/lib/services/emailTrackingService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    emailSend: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    leadActivity: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  computeTemplatePerformance,
  generateEmailTrackingReport,
  recordEmailSend,
  recordEmailOpen,
  recordEmailClick,
  wrapLinksForTracking,
  loadEmailTrackingReport,
  TRACKING_PIXEL_GIF,
  type EmailSendInput,
  type InboundReply,
} from '@/lib/services/emailTrackingService';

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeSend(overrides: Partial<EmailSendInput> = {}): EmailSendInput {
  return {
    id: 'send-1',
    templateKey: 'primer-contacte',
    leadId: 'lead-1',
    sentAt: new Date('2026-04-01'),
    openedAt: null,
    openCount: 0,
    clickedAt: null,
    clickCount: 0,
    ...overrides,
  };
}

function makeReply(overrides: Partial<InboundReply> = {}): InboundReply {
  return {
    leadId: 'lead-1',
    repliedAt: new Date('2026-04-02'),
    ...overrides,
  };
}

// ─── computeTemplatePerformance ───────────────────────────────────────────

describe('computeTemplatePerformance', () => {
  it('returns empty array for no sends', () => {
    expect(computeTemplatePerformance([], [])).toEqual([]);
  });

  it('groups by templateKey and computes rates', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: 'primer-contacte', openedAt: new Date() }),
      makeSend({ id: 's2', templateKey: 'primer-contacte', openedAt: null }),
      makeSend({ id: 's3', templateKey: 'seguiment', openedAt: new Date() }),
    ];
    const result = computeTemplatePerformance(sends, []);

    const primerContacte = result.find((r) => r.templateKey === 'primer-contacte');
    expect(primerContacte).toBeDefined();
    expect(primerContacte!.totalSent).toBe(2);
    expect(primerContacte!.opened).toBe(1);
    expect(primerContacte!.openRate).toBe(50);

    const seguiment = result.find((r) => r.templateKey === 'seguiment');
    expect(seguiment).toBeDefined();
    expect(seguiment!.totalSent).toBe(1);
    expect(seguiment!.opened).toBe(1);
    expect(seguiment!.openRate).toBe(100);
  });

  it('matches replies to sends by leadId and time', () => {
    const sends = [
      makeSend({ id: 's1', leadId: 'lead-1', sentAt: new Date('2026-04-01') }),
      makeSend({ id: 's2', leadId: 'lead-2', sentAt: new Date('2026-04-01') }),
    ];
    const replies = [
      makeReply({ leadId: 'lead-1', repliedAt: new Date('2026-04-02') }),
    ];

    const result = computeTemplatePerformance(sends, replies);
    const perf = result[0];
    expect(perf.replied).toBe(1);
    expect(perf.replyRate).toBe(50);
  });

  it('does not match reply before sentAt', () => {
    const sends = [
      makeSend({ id: 's1', leadId: 'lead-1', sentAt: new Date('2026-04-05') }),
    ];
    const replies = [
      makeReply({ leadId: 'lead-1', repliedAt: new Date('2026-04-01') }),
    ];

    const result = computeTemplatePerformance(sends, replies);
    expect(result[0].replied).toBe(0);
  });

  it('groups manual sends under _manual key', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: null }),
      makeSend({ id: 's2', templateKey: null, openedAt: new Date() }),
    ];

    const result = computeTemplatePerformance(sends, []);
    expect(result[0].templateKey).toBe('_manual');
    expect(result[0].label).toBe('Enviat manualment');
    expect(result[0].totalSent).toBe(2);
    expect(result[0].opened).toBe(1);
  });

  it('uses known labels for template keys', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: 'reactivacio' }),
    ];
    const result = computeTemplatePerformance(sends, []);
    expect(result[0].label).toBe('Reactivació');
  });

  it('sorts by totalSent descending', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: 'seguiment' }),
      makeSend({ id: 's2', templateKey: 'primer-contacte' }),
      makeSend({ id: 's3', templateKey: 'primer-contacte' }),
      makeSend({ id: 's4', templateKey: 'primer-contacte' }),
    ];
    const result = computeTemplatePerformance(sends, []);
    expect(result[0].templateKey).toBe('primer-contacte');
    expect(result[1].templateKey).toBe('seguiment');
  });

  it('ignores replies without matching leadId', () => {
    const sends = [
      makeSend({ id: 's1', leadId: 'lead-1' }),
    ];
    const replies = [
      makeReply({ leadId: 'lead-999', repliedAt: new Date('2026-04-10') }),
    ];
    const result = computeTemplatePerformance(sends, replies);
    expect(result[0].replied).toBe(0);
  });

  it('does not match replies for sends without leadId', () => {
    const sends = [
      makeSend({ id: 's1', leadId: null }),
    ];
    const replies = [
      makeReply({ leadId: 'lead-1', repliedAt: new Date('2026-04-10') }),
    ];
    const result = computeTemplatePerformance(sends, replies);
    expect(result[0].replied).toBe(0);
  });

  it('tracks click stats per template', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: 'primer-contacte', clickedAt: new Date() }),
      makeSend({ id: 's2', templateKey: 'primer-contacte', clickedAt: null }),
    ];
    const result = computeTemplatePerformance(sends, []);
    expect(result[0].clicked).toBe(1);
    expect(result[0].clickRate).toBe(50);
  });
});

// ─── generateEmailTrackingReport ──────────────────────────────────────────

describe('generateEmailTrackingReport', () => {
  it('generates complete report with globals and per-template', () => {
    const now = new Date('2026-04-15');
    const sends = [
      makeSend({ id: 's1', templateKey: 'primer-contacte', openedAt: new Date(), leadId: null }),
      makeSend({ id: 's2', templateKey: 'primer-contacte', leadId: 'lead-1' }),
      makeSend({ id: 's3', templateKey: 'seguiment', openedAt: new Date(), leadId: 'lead-2' }),
    ];
    const replies = [
      makeReply({ leadId: 'lead-1', repliedAt: new Date('2026-04-05') }),
    ];

    const report = generateEmailTrackingReport(sends, replies, 90, now);

    expect(report.generatedAt).toBe(now.toISOString());
    expect(report.windowDays).toBe(90);
    expect(report.totalSent).toBe(3);
    expect(report.totalOpened).toBe(2);
    expect(report.totalReplied).toBe(1);
    expect(report.globalOpenRate).toBe(67);
    expect(report.globalReplyRate).toBe(33);
    expect(report.byTemplate).toHaveLength(2);
  });

  it('handles empty sends', () => {
    const report = generateEmailTrackingReport([], [], 30);
    expect(report.totalSent).toBe(0);
    expect(report.globalOpenRate).toBe(0);
    expect(report.globalClickRate).toBe(0);
    expect(report.globalReplyRate).toBe(0);
    expect(report.byTemplate).toEqual([]);
    expect(report.bestPerformer).toBeNull();
    expect(report.worstPerformer).toBeNull();
  });

  it('computes totalClicked and globalClickRate', () => {
    const sends = [
      makeSend({ id: 's1', clickedAt: new Date() }),
      makeSend({ id: 's2', clickedAt: null }),
      makeSend({ id: 's3', clickedAt: new Date() }),
    ];
    const report = generateEmailTrackingReport(sends, [], 90);
    expect(report.totalClicked).toBe(2);
    expect(report.globalClickRate).toBe(67);
  });

  it('identifies best and worst performer with enough data', () => {
    const sends = [
      // 3 primer-contacte: 2 replied
      makeSend({ id: 's1', templateKey: 'primer-contacte', leadId: 'l1' }),
      makeSend({ id: 's2', templateKey: 'primer-contacte', leadId: 'l2' }),
      makeSend({ id: 's3', templateKey: 'primer-contacte', leadId: 'l3' }),
      // 3 seguiment: 0 replied
      makeSend({ id: 's4', templateKey: 'seguiment', leadId: 'l4' }),
      makeSend({ id: 's5', templateKey: 'seguiment', leadId: 'l5' }),
      makeSend({ id: 's6', templateKey: 'seguiment', leadId: 'l6' }),
    ];
    const replies = [
      makeReply({ leadId: 'l1', repliedAt: new Date('2026-04-05') }),
      makeReply({ leadId: 'l2', repliedAt: new Date('2026-04-05') }),
    ];

    const report = generateEmailTrackingReport(sends, replies, 90);
    expect(report.bestPerformer).toBe('primer-contacte');
    expect(report.worstPerformer).toBe('seguiment');
  });

  it('does not set worstPerformer when only one eligible template', () => {
    const sends = [
      makeSend({ id: 's1', templateKey: 'primer-contacte' }),
      makeSend({ id: 's2', templateKey: 'primer-contacte' }),
      makeSend({ id: 's3', templateKey: 'primer-contacte' }),
      makeSend({ id: 's4', templateKey: 'seguiment' }), // only 1, not eligible
    ];
    const report = generateEmailTrackingReport(sends, [], 90);
    expect(report.bestPerformer).toBe('primer-contacte');
    expect(report.worstPerformer).toBeNull();
  });
});

// ─── TRACKING_PIXEL_GIF ──────────────────────────────────────────────────

describe('TRACKING_PIXEL_GIF', () => {
  it('is a valid GIF buffer', () => {
    expect(TRACKING_PIXEL_GIF).toBeInstanceOf(Buffer);
    expect(TRACKING_PIXEL_GIF.length).toBeGreaterThan(0);
    // GIF magic bytes: GIF89a
    expect(TRACKING_PIXEL_GIF.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  });
});

// ─── recordEmailSend (wrapper) ────────────────────────────────────────────

describe('recordEmailSend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a record and returns id + trackingToken', async () => {
    mockPrisma.emailSend.create.mockResolvedValue({ id: 'es-1', trackingToken: 'tok-abc' });

    const result = await recordEmailSend({
      templateKey: 'seguiment',
      to: 'client@test.com',
      subject: 'Seguiment',
      leadId: 'lead-1',
    });

    expect(result).toEqual({ id: 'es-1', trackingToken: 'tok-abc' });
    expect(mockPrisma.emailSend.create).toHaveBeenCalledWith({
      data: {
        templateKey: 'seguiment',
        to: 'client@test.com',
        subject: 'Seguiment',
        leadId: 'lead-1',
        customerId: null,
        locale: null,
        htmlBody: null,
        orbitaKind: null,
        orbitaId: null,
        orbitaOrigin: null,
      },
      select: { id: true, trackingToken: true },
    });
  });

  it('normalizes null values for optional fields', async () => {
    mockPrisma.emailSend.create.mockResolvedValue({ id: 'es-2', trackingToken: 'tok-def' });

    await recordEmailSend({ to: 'a@b.com', subject: 'Test' });

    expect(mockPrisma.emailSend.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateKey: null,
        leadId: null,
        customerId: null,
        locale: null,
      }),
      select: { id: true, trackingToken: true },
    });
  });
});

// ─── recordEmailOpen (wrapper) ────────────────────────────────────────────

describe('recordEmailOpen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets openedAt on first open and increments openCount', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ id: 'es-1', openedAt: null, openCount: 0 });
    mockPrisma.emailSend.update.mockResolvedValue({});

    const result = await recordEmailOpen('tok-abc');

    expect(result).toBe(true);
    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { trackingToken: 'tok-abc' },
      data: { openedAt: expect.any(Date), openCount: 1 },
    });
  });

  it('preserves original openedAt on subsequent opens', async () => {
    const originalDate = new Date('2026-04-01');
    mockPrisma.emailSend.findUnique.mockResolvedValue({ id: 'es-1', openedAt: originalDate, openCount: 3 });
    mockPrisma.emailSend.update.mockResolvedValue({});

    await recordEmailOpen('tok-abc');

    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { trackingToken: 'tok-abc' },
      data: { openedAt: originalDate, openCount: 4 },
    });
  });

  it('returns false for unknown token', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue(null);

    const result = await recordEmailOpen('tok-unknown');
    expect(result).toBe(false);
    expect(mockPrisma.emailSend.update).not.toHaveBeenCalled();
  });

  it('returns false and logs on error', async () => {
    mockPrisma.emailSend.findUnique.mockRejectedValue(new Error('DB down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await recordEmailOpen('tok-err');
    expect(result).toBe(false);

    spy.mockRestore();
  });
});

// ─── loadEmailTrackingReport (wrapper) ────────────────────────────────────

describe('loadEmailTrackingReport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches sends and inbound activities, returns report', async () => {
    mockPrisma.emailSend.findMany.mockResolvedValue([
      { id: 's1', templateKey: 'primer-contacte', leadId: 'l1', sentAt: new Date('2026-04-01'), openedAt: new Date('2026-04-02'), openCount: 1, clickedAt: null, clickCount: 0 },
      { id: 's2', templateKey: 'seguiment', leadId: 'l2', sentAt: new Date('2026-04-03'), openedAt: null, openCount: 0, clickedAt: null, clickCount: 0 },
    ]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { leadId: 'l1', createdAt: new Date('2026-04-02'), metadata: { direction: 'inbound' } },
      { leadId: 'l2', createdAt: new Date('2026-04-01'), metadata: { direction: 'outbound' } },
    ]);

    const report = await loadEmailTrackingReport(90, new Date('2026-04-15'));

    expect(report.totalSent).toBe(2);
    expect(report.totalOpened).toBe(1);
    expect(report.totalReplied).toBe(1);
    expect(report.byTemplate).toHaveLength(2);
  });

  it('handles empty database', async () => {
    mockPrisma.emailSend.findMany.mockResolvedValue([]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([]);

    const report = await loadEmailTrackingReport();

    expect(report.totalSent).toBe(0);
    expect(report.globalOpenRate).toBe(0);
    expect(report.byTemplate).toEqual([]);
  });

  it('filters only inbound activities as replies', async () => {
    mockPrisma.emailSend.findMany.mockResolvedValue([
      { id: 's1', templateKey: 'seguiment', leadId: 'l1', sentAt: new Date('2026-04-01'), openedAt: null, openCount: 0, clickedAt: null, clickCount: 0 },
    ]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { leadId: 'l1', createdAt: new Date('2026-04-02'), metadata: { direction: 'outbound' } },
      { leadId: 'l1', createdAt: new Date('2026-04-03'), metadata: null },
    ]);

    const report = await loadEmailTrackingReport(90, new Date('2026-04-15'));
    expect(report.totalReplied).toBe(0);
  });
});

// ─── recordEmailClick (wrapper) ───────────────────────────────────────────

describe('recordEmailClick', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets clickedAt on first click and increments clickCount', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue({ id: 'es-1', clickedAt: null, clickCount: 0 });
    mockPrisma.emailSend.update.mockResolvedValue({});

    const result = await recordEmailClick('tok-abc');

    expect(result).toBe(true);
    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { trackingToken: 'tok-abc' },
      data: { clickedAt: expect.any(Date), clickCount: 1 },
    });
  });

  it('preserves original clickedAt on subsequent clicks', async () => {
    const originalDate = new Date('2026-04-01');
    mockPrisma.emailSend.findUnique.mockResolvedValue({ id: 'es-1', clickedAt: originalDate, clickCount: 2 });
    mockPrisma.emailSend.update.mockResolvedValue({});

    await recordEmailClick('tok-abc');

    expect(mockPrisma.emailSend.update).toHaveBeenCalledWith({
      where: { trackingToken: 'tok-abc' },
      data: { clickedAt: originalDate, clickCount: 3 },
    });
  });

  it('returns false for unknown token', async () => {
    mockPrisma.emailSend.findUnique.mockResolvedValue(null);
    const result = await recordEmailClick('tok-nope');
    expect(result).toBe(false);
  });
});

// ─── wrapLinksForTracking ───────────────────────────────────��─────────────

describe('wrapLinksForTracking', () => {
  it('wraps http/https links with tracking redirect', () => {
    const html = '<a href="https://orbitaevents.com/contact">Contact</a>';
    const result = wrapLinksForTracking(html, 'tok-123', 'https://app.orbita.com');
    expect(result).toContain('/api/tracking/click/tok-123?url=');
    expect(result).toContain(encodeURIComponent('https://orbitaevents.com/contact'));
  });

  it('does not wrap mailto links', () => {
    const html = '<a href="mailto:info@test.com">Email</a>';
    const result = wrapLinksForTracking(html, 'tok-123', 'https://app.com');
    expect(result).toBe(html);
  });

  it('does not wrap tel links', () => {
    const html = '<a href="tel:+34623152860">Call</a>';
    const result = wrapLinksForTracking(html, 'tok-123', 'https://app.com');
    expect(result).toBe(html);
  });

  it('handles multiple links', () => {
    const html = '<a href="https://a.com">A</a> text <a href="https://b.com">B</a>';
    const result = wrapLinksForTracking(html, 'tok-x', 'https://base.com');
    expect(result).toContain(encodeURIComponent('https://a.com'));
    expect(result).toContain(encodeURIComponent('https://b.com'));
  });

  it('preserves other attributes', () => {
    const html = '<a class="btn" href="https://x.com" target="_blank">X</a>';
    const result = wrapLinksForTracking(html, 'tok-y', 'https://base.com');
    expect(result).toContain('class="btn"');
    expect(result).toContain('target="_blank"');
  });
});
