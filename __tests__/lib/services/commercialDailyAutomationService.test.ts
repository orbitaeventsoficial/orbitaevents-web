import { beforeEach, describe, expect, it, vi } from 'vitest';

const activeLeads = Array.from({ length: 51 }, (_, index) => ({
  id: `lead-${index + 1}`,
  status: 'NEW',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  eventDate: new Date('2026-02-01T00:00:00Z'),
  budget: '500',
  phone: null,
  eventLocation: 'Barcelona',
  guestCount: 100,
  interestedPackId: null,
  source: 'WEB',
}));

const {
  mockPrisma,
  mockRunCommercialSequences,
  mockEnforceLeadSla,
  mockSendPaymentReminders,
  mockScoreLead,
  mockSendEmail,
  mockSendWhatsAppText,
  mockSaveCronRunStatus,
  mockLoadDailyBrief,
  mockLoadCapacityConflicts,
} = vi.hoisted(() => ({
  mockPrisma: {
    $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    lead: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    adminLog: {
      count: vi.fn(),
      create: vi.fn(),
    },
    task: {
      count: vi.fn(),
    },
  },
  mockRunCommercialSequences: vi.fn(),
  mockEnforceLeadSla: vi.fn(),
  mockSendPaymentReminders: vi.fn(),
  mockScoreLead: vi.fn(),
  mockSendEmail: vi.fn(),
  mockSendWhatsAppText: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
  mockLoadDailyBrief: vi.fn(),
  mockLoadCapacityConflicts: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialSequenceService', () => ({
  runCommercialSequences: mockRunCommercialSequences,
}));
vi.mock('@/lib/services/slaAutomationService', () => ({
  enforceLeadSla: mockEnforceLeadSla,
}));
vi.mock('@/lib/services/paymentReminderService', () => ({
  sendPaymentReminders: mockSendPaymentReminders,
}));
vi.mock('@/lib/services/commercialScoring', () => ({
  scoreLead: mockScoreLead,
}));
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));
vi.mock('@/lib/services/whatsappService', () => ({
  sendWhatsAppText: mockSendWhatsAppText,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));
vi.mock('@/lib/services/dailyBriefService', () => ({
  loadDailyBrief: mockLoadDailyBrief,
}));
vi.mock('@/lib/services/capacityConflictService', () => ({
  loadCapacityConflicts: mockLoadCapacityConflicts,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: {
      email: 'admin@orbitaevents.test',
      phone: '+34 600 000 000',
    },
    web: {
      url: 'https://orbitaevents.test',
    },
  },
}));

import { runCommercialDailyAutomation } from '@/lib/services/commercialDailyAutomationService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue(activeLeads);
  mockPrisma.lead.update.mockImplementation(({ where, data }: { where: { id: string }; data: { cachedScore: number } }) =>
    Promise.resolve({ id: where.id, cachedScore: data.cachedScore })
  );
  mockPrisma.lead.count.mockResolvedValue(51);
  mockPrisma.adminLog.count
    .mockResolvedValueOnce(20)
    .mockResolvedValueOnce(5);
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.task.count.mockResolvedValue(7);
  mockRunCommercialSequences.mockResolvedValue({ executed: 4, sentEmail: 3, sentWhatsapp: 1, exhausted: 1 });
  mockEnforceLeadSla.mockResolvedValue({ createdTasks: 2, escalated: 0 });
  mockSendPaymentReminders.mockResolvedValue({ checked: 3, sent: 2, skipped: 1, errors: 0 });
  mockScoreLead.mockImplementation((lead: { id: string }) => ({ score: Number(lead.id.split('-')[1]) }));
  mockSendEmail.mockResolvedValue({ ok: true });
  mockSendWhatsAppText.mockResolvedValue({ ok: true });
  mockSaveCronRunStatus.mockResolvedValue({});
  mockLoadDailyBrief.mockResolvedValue({
    date: '2026-04-10',
    greeting: 'Bon dia',
    summary: 'Mock summary',
    kpis: {
      newLeadsToday: 0,
      openLeads: 0,
      overdueTasksCount: 0,
      upcomingBookings7d: 0,
      pendingPaymentsCount: 0,
      forecastWeighted: 0,
    },
    alerts: [],
    actions: [],
    topCampaigns: [],
  });
  mockLoadCapacityConflicts.mockResolvedValue({
    generatedAt: new Date().toISOString(),
    windowDays: 14,
    conflicts: [],
    verdict: 'Cap conflicte de capacitat en els pròxims 14 dies.',
  });
});

describe('runCommercialDailyAutomation', () => {
  it('actualitza scores en lots i guarda resum', async () => {
    const result = await runCommercialDailyAutomation();

    expect(result.scoringUpdated).toBe(51);
    expect(mockScoreLead).toHaveBeenCalledTimes(51);
    expect(mockPrisma.lead.update).toHaveBeenCalledTimes(51);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendWhatsAppText).toHaveBeenCalledTimes(1);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'automation.commercial',
        status: 'ok',
        category: 'config',
      })
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'AUTOMATION_DAILY_SUMMARY_SENT' }),
      })
    );
  });

  it("inclou alertes CRITICAL del Daily Brief al resum guardat i a l'email", async () => {
    mockLoadDailyBrief.mockResolvedValue({
      date: '2026-04-10',
      greeting: 'Bon dia',
      summary: 'Mock summary',
      kpis: {
        newLeadsToday: 0,
        openLeads: 0,
        overdueTasksCount: 0,
        upcomingBookings7d: 0,
        pendingPaymentsCount: 0,
        forecastWeighted: 0,
      },
      alerts: [
        {
          level: 'CRITICAL',
          icon: '🚨',
          title: '3 entrades sense resposta (+24h)',
          detail: 'Contacta-les avui o es perdran.',
          href: '/admin/leads?status=NEW',
        },
      ],
      actions: [],
      topCampaigns: [],
    });

    const result = await runCommercialDailyAutomation();

    expect(result.dailyBrief.criticalCount).toBe(1);
    expect(result.dailyBrief.criticalAlerts[0]?.title).toContain('3 entrades sense resposta');
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Alertes crítiques del matí (1)'),
    }));
  });

  it('inclou col·lisions d\'inventari a l\'email del resum', async () => {
    const verdict = '1 conflicte en 1 dia. Revisa l\'inventari.';
    mockLoadCapacityConflicts.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      windowDays: 14,
      conflicts: [
        {
          date: '2026-04-20',
          itemId: 'item-1',
          itemName: 'Altaveu JBL',
          itemCode: 'SPK-JBL-01',
          stockAvailable: 2,
          totalDemanded: 4,
          deficit: 2,
          bookings: [
            { bookingId: 'b1', clientName: 'Joan', quantity: 2 },
            { bookingId: 'b2', clientName: 'Maria', quantity: 2 },
          ],
        },
      ],
      verdict,
    });

    const result = await runCommercialDailyAutomation();

    expect(result.capacityConflicts.count).toBe(1);
    expect(result.capacityConflicts.verdict).toBe(verdict);
    expect(result.capacityConflicts.conflicts[0]?.itemName).toBe('Altaveu JBL');
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Col·lisions d\'inventari (1)'),
    }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Altaveu JBL'),
    }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining(verdict),
    }));
  });

  it('inclou col·lisions d\'inventari al WhatsApp del resum', async () => {
    const verdict = '1 conflicte en 1 dia. Revisa l\'inventari.';
    mockLoadCapacityConflicts.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      windowDays: 14,
      conflicts: [
        {
          date: '2026-04-22',
          itemId: 'item-2',
          itemName: 'Focus LED',
          itemCode: 'LGT-LED-03',
          stockAvailable: 4,
          totalDemanded: 7,
          deficit: 3,
          bookings: [
            { bookingId: 'b3', clientName: 'Pere', quantity: 4 },
            { bookingId: 'b4', clientName: 'Anna', quantity: 3 },
          ],
        },
      ],
      verdict,
    });

    await runCommercialDailyAutomation();

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Col·lisions d\'inventari: 1'),
    }));
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining(verdict),
    }));
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Focus LED (2026-04-22): falten 3 ud.'),
    }));
  });

  it('inclou alertes CRITICAL del Daily Brief al WhatsApp del resum', async () => {
    mockLoadDailyBrief.mockResolvedValue({
      date: '2026-04-10',
      greeting: 'Bon dia',
      summary: 'Mock summary',
      kpis: {
        newLeadsToday: 0,
        openLeads: 0,
        overdueTasksCount: 0,
        upcomingBookings7d: 0,
        pendingPaymentsCount: 0,
        forecastWeighted: 0,
      },
      alerts: [
        {
          level: 'CRITICAL',
          icon: '📩',
          title: '2 seguiments urgents',
          detail: 'Leads esperant resposta fa +5 dies.',
          href: '/admin/inbox',
        },
      ],
      actions: [],
      topCampaigns: [],
    });

    await runCommercialDailyAutomation();

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('🚨 Alertes crítiques del matí: 1'),
    }));
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('• 2 seguiments urgents'),
    }));
  });
});
