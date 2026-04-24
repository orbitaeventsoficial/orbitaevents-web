import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockRunSequences,
  mockEnforceSla,
  mockFetchRecentCanonicalCommunicationMetrics,
  mockFetchRecentCommercialSequenceMetrics,
} = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: { create: vi.fn() },
  },
  mockRunSequences: vi.fn(),
  mockEnforceSla: vi.fn(),
  mockFetchRecentCanonicalCommunicationMetrics: vi.fn(),
  mockFetchRecentCommercialSequenceMetrics: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialSequenceService', () => ({
  runCommercialSequences: mockRunSequences,
}));
vi.mock('@/lib/services/slaAutomationService', () => ({
  enforceLeadSla: mockEnforceSla,
}));
vi.mock('@/lib/services/timelineQueryService', () => ({
  fetchRecentCanonicalCommunicationMetrics: mockFetchRecentCanonicalCommunicationMetrics,
  fetchRecentCommercialSequenceMetrics: mockFetchRecentCommercialSequenceMetrics,
}));

import {
  readCommercialSequenceMetrics,
  runCommercialSequencesAutomation,
  enforceSlaAutomation,
  runAllAdminAutomations,
} from '@/lib/services/adminAutomationService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockRunSequences.mockResolvedValue({ executed: 5, sentEmail: 3, sentWhatsapp: 2, exhausted: 1 });
  mockEnforceSla.mockResolvedValue({ createdTasks: 2, escalated: 1 });
  mockFetchRecentCanonicalCommunicationMetrics.mockResolvedValue({
    commSent: 0,
    commResponded: 0,
    responseRate: 0,
  });
  mockFetchRecentCommercialSequenceMetrics.mockResolvedValue({
    sequenceExec: 0,
  });
});

describe('readCommercialSequenceMetrics', () => {
  it('retorna mètriques', async () => {
    mockFetchRecentCanonicalCommunicationMetrics.mockResolvedValueOnce({
      commSent: 10,
      commResponded: 3,
      responseRate: 0.3,
    });
    mockFetchRecentCommercialSequenceMetrics.mockResolvedValueOnce({ sequenceExec: 5 });

    const result = await readCommercialSequenceMetrics();

    expect(result.commSent).toBe(10);
    expect(result.commResponded).toBe(3);
    expect(result.responseRate).toBeCloseTo(0.3);
    expect(result.sequenceExec).toBe(5);
  });

  it('retorna 0 responseRate si no hi ha enviaments', async () => {
    const result = await readCommercialSequenceMetrics();

    expect(result.responseRate).toBe(0);
  });
});

describe('runCommercialSequencesAutomation', () => {
  it('executa seqüències i crea log', async () => {
    const result = await runCommercialSequencesAutomation();

    expect(result.executed).toBe(5);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'COMM_SEQUENCE_BATCH' }),
      })
    );
  });
});

describe('enforceSlaAutomation', () => {
  it('aplica SLA i crea log', async () => {
    const result = await enforceSlaAutomation();

    expect(result.createdTasks).toBe(2);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'AUTOMATION_SLA_ENFORCED' }),
      })
    );
  });
});

describe('runAllAdminAutomations', () => {
  it('executa tot en paral·lel', async () => {
    const result = await runAllAdminAutomations();

    expect(result).toHaveProperty('sequences');
    expect(result).toHaveProperty('sla');
    expect(result).toHaveProperty('generatedAt');
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'AUTOMATION_RUN_ALL' }),
      })
    );
  });
});
