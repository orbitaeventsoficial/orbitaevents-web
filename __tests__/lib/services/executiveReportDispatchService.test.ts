import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockBuildReport, mockGetRecipientsAsString } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockBuildReport: vi.fn(),
  mockGetRecipientsAsString: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({ log: { warn: vi.fn() } }));
vi.mock('@/lib/services/executiveReportService', () => ({
  buildExecutiveReport: mockBuildReport,
}));
vi.mock('@/lib/services/notificationRecipientsService', () => ({
  getRecipientsAsString: mockGetRecipientsAsString,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { email: 'info@test.com', phone: '+34600000000' } },
}));

import { sendExecutiveReport } from '@/lib/services/executiveReportDispatchService';

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildReport.mockResolvedValue({
    generatedAt: new Date().toISOString(),
    headline: {
      customers: 50,
      openLeads: 10,
      revenueClosed: 5000,
      pipelineRaw: 10000,
      forecastWeighted: 7000,
      slaBroken: 2,
    },
    funnel: { NEW: 5, CONTACTED: 3, QUOTE_SENT: 1, NEGOTIATING: 1, WON: 0, LOST: 0 },
  });
  mockSendEmail.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGetRecipientsAsString.mockResolvedValue('reports@test.com');
});

describe('sendExecutiveReport', () => {
  it('envia email i crea adminLog', async () => {
    const result = await sendExecutiveReport();

    expect(result.ok).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Executive Report') })
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXEC_REPORT_SENT' }),
      })
    );
  });

  it('retorna report', async () => {
    const result = await sendExecutiveReport();

    expect(result.report.headline.openLeads).toBe(10);
  });
});
