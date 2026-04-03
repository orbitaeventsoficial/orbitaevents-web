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
});

