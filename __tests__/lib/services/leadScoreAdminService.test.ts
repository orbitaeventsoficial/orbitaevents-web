import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockScoreLead, mockEstimateAmount } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
  mockScoreLead: vi.fn(),
  mockEstimateAmount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialScoring', () => ({
  scoreLead: mockScoreLead,
  estimateLeadAmount: mockEstimateAmount,
}));

import {
  getAdminLeadScore,
  createAdminLeadScoreSnapshot,
} from '@/lib/services/leadScoreAdminService';

const MOCK_LEAD = {
  id: 'lead-1',
  status: 'NEW',
  createdAt: new Date(),
  updatedAt: new Date(),
  eventDate: new Date('2026-06-15'),
  budget: '2000',
  phone: '+34612345678',
  eventLocation: 'Barcelona',
  guestCount: 150,
  interestedPackId: 'pack-1',
  source: 'web',
  eventType: 'WEDDING',
};

const MOCK_SCORING = {
  score: 75,
  band: 'HOT',
  probability: 0.65,
  reasons: ['Event proper', 'Pressupost alt'],
  riskFlags: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockScoreLead.mockReturnValue(MOCK_SCORING);
  mockEstimateAmount.mockReturnValue(2000);
});

describe('getAdminLeadScore', () => {
  it('retorna 404 si lead no existeix', async () => {
    const result = await getAdminLeadScore('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna scoring complet', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);

    const result = await getAdminLeadScore('lead-1');

    expect(result.status).toBe(200);
    expect(result.body.score).toBe(75);
    expect(result.body.band).toBe('HOT');
    expect(result.body.probability).toBe(0.65);
    expect(result.body.weightedAmount).toBe(1300); // 2000 * 0.65
  });
});

describe('createAdminLeadScoreSnapshot', () => {
  it('retorna 404 si lead no existeix', async () => {
    const result = await createAdminLeadScoreSnapshot('inexistent');
    expect(result.status).toBe(404);
  });

  it('crea activitat amb scoring', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);

    const result = await createAdminLeadScoreSnapshot('lead-1');

    expect(result.status).toBe(200);
    expect(result.body.score).toBe(75);
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Scoring snapshot',
        createdBy: 'Scoring Bot',
      }),
    });
  });
});

// Regressió: `getAdminLeadScore` i `createAdminLeadScoreSnapshot` han de
// propagar un `now?: Date` a `scoreLead` (i tenir un default de `new Date()`).
// Abans, cridaven `scoreLead(lead)` sense `now`, de manera que l'endpoint
// `/api/admin/leads/[id]/score` i la snapshot activity usaven el clock real
// del server i no eren testables deterministament, tot i que `computeLeadInsights`
// (Canvi #274) ja ho feia per al render del detall de lead.
describe('propagació de `now` a scoreLead', () => {
  it('getAdminLeadScore: passa el `now` injectat a scoreLead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);
    const injectedNow = new Date('2026-06-15T12:00:00Z');

    await getAdminLeadScore('lead-1', injectedNow);

    expect(mockScoreLead).toHaveBeenCalledWith(
      expect.objectContaining({ now: injectedNow }),
    );
  });

  it('createAdminLeadScoreSnapshot: passa el `now` injectat a scoreLead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);
    const injectedNow = new Date('2026-06-15T12:00:00Z');

    await createAdminLeadScoreSnapshot('lead-1', injectedNow);

    expect(mockScoreLead).toHaveBeenCalledWith(
      expect.objectContaining({ now: injectedNow }),
    );
  });

  it('getAdminLeadScore: sense `now` explícit, usa un default (Date) i no string/undefined', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(MOCK_LEAD);

    await getAdminLeadScore('lead-1');

    const passedInput = mockScoreLead.mock.calls[0][0] as Record<string, unknown>;
    expect(passedInput.now).toBeInstanceOf(Date);
  });
});
