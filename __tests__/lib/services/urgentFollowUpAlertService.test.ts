import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// ── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockPrisma, mockSendEmail, mockSendWhatsApp, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    setting: { findMany: vi.fn(), upsert: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockSendWhatsApp: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/services/whatsappService', () => ({ sendWhatsAppText: mockSendWhatsApp }));
vi.mock('@/lib/services/cronRunStatusService', () => ({ saveCronRunStatus: mockSaveCronRunStatus }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { email: 'admin@test.com', phone: '600000000' },
  },
}));

import {
  filterNewUrgentAlerts,
  buildUrgentAlertEmail,
  buildUrgentAlertWhatsApp,
  runUrgentFollowUpAlerts,
} from '@/lib/services/urgentFollowUpAlertService';
import type { PendingFollowUp } from '@/lib/services/responseTrackingService';

// ── Helpers ────────────────────────────────────────────────────────────────
const now = new Date('2026-06-15T10:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

function makePendingFollowUp(overrides: Partial<PendingFollowUp> = {}): PendingFollowUp {
  return {
    leadId: 'l1',
    name: 'Test Lead',
    email: 'lead@test.com',
    phone: '600111222',
    eventType: 'WEDDING',
    status: 'CONTACTED',
    preferredLocale: 'ca',
    contactedAt: daysAgo(10),
    lastOutboundAt: daysAgo(6),
    daysSinceOutbound: 6,
    outboundCount: 2,
    hasInboundAfterOutbound: false,
    urgency: 'URGENT',
    suggestedAction: 'Trucar o enviar WhatsApp',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({});
  mockSendWhatsApp.mockResolvedValue({ ok: true });
  process.env.CONTACT_TO = 'admin@test.com';
  process.env.ADMIN_WHATSAPP = '600000000';
});

afterAll(() => {
  delete process.env.CONTACT_TO;
  delete process.env.ADMIN_WHATSAPP;
});

// ── Pure: filterNewUrgentAlerts ────────────────────────────────────────────

describe('filterNewUrgentAlerts', () => {
  it('retorna follow-ups URGENT que no han estat alertats', () => {
    const followUps = [
      makePendingFollowUp({ leadId: 'l1', urgency: 'URGENT' }),
      makePendingFollowUp({ leadId: 'l2', urgency: 'NORMAL' }),
      makePendingFollowUp({ leadId: 'l3', urgency: 'URGENT' }),
    ];

    const result = filterNewUrgentAlerts({
      followUps,
      alertedLeadIds: new Set(['l1']),
    });

    expect(result).toHaveLength(1);
    expect(result[0].leadId).toBe('l3');
  });

  it('retorna buit si tots ja alertats', () => {
    const followUps = [
      makePendingFollowUp({ leadId: 'l1', urgency: 'URGENT' }),
    ];

    const result = filterNewUrgentAlerts({
      followUps,
      alertedLeadIds: new Set(['l1']),
    });

    expect(result).toHaveLength(0);
  });

  it('exclou follow-ups no urgents', () => {
    const followUps = [
      makePendingFollowUp({ leadId: 'l1', urgency: 'NORMAL' }),
      makePendingFollowUp({ leadId: 'l2', urgency: 'LOW' }),
    ];

    const result = filterNewUrgentAlerts({
      followUps,
      alertedLeadIds: new Set(),
    });

    expect(result).toHaveLength(0);
  });

  it('retorna tots els URGENT si cap alertat', () => {
    const followUps = [
      makePendingFollowUp({ leadId: 'l1', urgency: 'URGENT' }),
      makePendingFollowUp({ leadId: 'l2', urgency: 'URGENT' }),
    ];

    const result = filterNewUrgentAlerts({
      followUps,
      alertedLeadIds: new Set(),
    });

    expect(result).toHaveLength(2);
  });
});

// ── Pure: buildUrgentAlertEmail ────────────────────────────────────────────

describe('buildUrgentAlertEmail', () => {
  it('genera subject amb comptador', () => {
    const items = [makePendingFollowUp()];
    const { subject } = buildUrgentAlertEmail(items);
    expect(subject).toContain('1 follow-up urgent');
  });

  it('genera subject plural per múltiples', () => {
    const items = [
      makePendingFollowUp({ leadId: 'l1' }),
      makePendingFollowUp({ leadId: 'l2' }),
    ];
    const { subject } = buildUrgentAlertEmail(items);
    expect(subject).toContain('2 follow-ups urgents');
  });

  it('conté el nom del lead al HTML', () => {
    const items = [makePendingFollowUp({ name: 'Maria Garcia' })];
    const { html } = buildUrgentAlertEmail(items);
    expect(html).toContain('Maria Garcia');
  });

  it('conté els dies sense resposta', () => {
    const items = [makePendingFollowUp({ daysSinceOutbound: 7 })];
    const { html } = buildUrgentAlertEmail(items);
    expect(html).toContain('7 dies');
  });

  it('mostra el tipus d\'event', () => {
    const items = [makePendingFollowUp({ eventType: 'CORPORATE' })];
    const { html } = buildUrgentAlertEmail(items);
    expect(html).toContain('CORPORATE');
  });
});

// ── Pure: buildUrgentAlertWhatsApp ─────────────────────────────────────────

describe('buildUrgentAlertWhatsApp', () => {
  it('genera text amb comptador i noms', () => {
    const items = [
      makePendingFollowUp({ leadId: 'l1', name: 'Anna', daysSinceOutbound: 6 }),
      makePendingFollowUp({ leadId: 'l2', name: 'Jordi', daysSinceOutbound: 8 }),
    ];
    const text = buildUrgentAlertWhatsApp(items);

    expect(text).toContain('2 follow-ups urgents');
    expect(text).toContain('Anna');
    expect(text).toContain('Jordi');
    expect(text).toContain('6d sense resposta');
    expect(text).toContain('8d sense resposta');
  });

  it('singular per un sol item', () => {
    const items = [makePendingFollowUp()];
    const text = buildUrgentAlertWhatsApp(items);
    expect(text).toContain('1 follow-up urgent');
    expect(text).not.toContain('urgents');
  });
});

// ── Wrapper: runUrgentFollowUpAlerts ───────────────────────────────────────

describe('runUrgentFollowUpAlerts', () => {
  it('retorna 0 alertes si no hi ha follow-ups urgents', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const result = await runUrgentFollowUpAlerts(now);

    expect(result.urgentDetected).toBe(0);
    expect(result.newAlerts).toBe(0);
    expect(result.emailSent).toBe(false);
    expect(result.whatsappSent).toBe(false);
  });

  it('envia email i WA per follow-ups urgents nous', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l1',
        name: 'Lead Urgent',
        email: 'lead@test.com',
        phone: '600111222',
        eventType: 'WEDDING',
        status: 'CONTACTED',
        preferredLocale: 'ca',
        contactedAt: daysAgo(10),
        activities: [
          { type: 'EMAIL', createdAt: daysAgo(6), metadata: { direction: 'outbound' } },
        ],
      },
    ]);
    mockPrisma.setting.findMany.mockResolvedValue([]); // no previous alerts

    const result = await runUrgentFollowUpAlerts(now);

    expect(result.urgentDetected).toBe(1);
    expect(result.newAlerts).toBe(1);
    expect(result.emailSent).toBe(true);
    expect(result.whatsappSent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendWhatsApp).toHaveBeenCalledOnce();
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });

  it('suprimeix alertes per leads ja alertats dins la finestra de 24h', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l1',
        name: 'Lead Urgent',
        email: 'lead@test.com',
        phone: '600111222',
        eventType: 'WEDDING',
        status: 'CONTACTED',
        preferredLocale: 'ca',
        contactedAt: daysAgo(10),
        activities: [
          { type: 'EMAIL', createdAt: daysAgo(6), metadata: { direction: 'outbound' } },
        ],
      },
    ]);
    // Already alerted 2h ago (within 24h window)
    mockPrisma.setting.findMany.mockResolvedValue([
      {
        key: 'alerts.urgentFollowUp.lastAlerted.l1',
        value: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const result = await runUrgentFollowUpAlerts(now);

    expect(result.urgentDetected).toBe(1);
    expect(result.newAlerts).toBe(0);
    expect(result.alreadyAlerted).toBe(1);
    expect(result.emailSent).toBe(false);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('permet re-alerta si la finestra de 24h ha expirat', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l1',
        name: 'Lead Urgent',
        email: 'lead@test.com',
        phone: '600111222',
        eventType: 'WEDDING',
        status: 'CONTACTED',
        preferredLocale: 'ca',
        contactedAt: daysAgo(10),
        activities: [
          { type: 'EMAIL', createdAt: daysAgo(6), metadata: { direction: 'outbound' } },
        ],
      },
    ]);
    // Alerted 25h ago (outside 24h window)
    mockPrisma.setting.findMany.mockResolvedValue([
      {
        key: 'alerts.urgentFollowUp.lastAlerted.l1',
        value: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const result = await runUrgentFollowUpAlerts(now);

    expect(result.newAlerts).toBe(1);
    expect(result.emailSent).toBe(true);
  });

  it('continua si email falla però WA funciona', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l1',
        name: 'Lead Urgent',
        email: 'lead@test.com',
        phone: '600111222',
        eventType: 'WEDDING',
        status: 'CONTACTED',
        preferredLocale: 'ca',
        contactedAt: daysAgo(10),
        activities: [
          { type: 'EMAIL', createdAt: daysAgo(6), metadata: { direction: 'outbound' } },
        ],
      },
    ]);
    mockPrisma.setting.findMany.mockResolvedValue([]);
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP fail'));

    const result = await runUrgentFollowUpAlerts(now);

    expect(result.emailSent).toBe(false);
    expect(result.whatsappSent).toBe(true);
    expect(result.newAlerts).toBe(1);
  });
});
