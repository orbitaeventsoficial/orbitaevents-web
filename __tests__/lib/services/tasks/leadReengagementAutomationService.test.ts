import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    task: { findMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  buildLeadReengagementProposals,
  runLeadReengagementAutomation,
} from '@/lib/services/tasks/leadReengagementAutomationService';
import type { ReengagementCandidate } from '@/lib/services/leadReengagementService';

const NOW = new Date('2026-05-21T10:00:00.000Z');

function makeCandidate(overrides: Partial<ReengagementCandidate> = {}): ReengagementCandidate {
  return {
    leadId: 'lead-1',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    phone: '+34600111222',
    status: 'QUOTE_SENT',
    priority: 'HIGH',
    eventType: 'WEDDING',
    eventDate: null,
    eventLocation: null,
    budget: null,
    preferredLocale: 'ca',
    daysSinceCreation: 12,
    daysSinceContact: 7,
    daysSinceActivity: 7,
    daysUntilEvent: null,
    reason: 'QUOTE_NO_REPLY',
    reasonLabel: 'Pressupost sense resposta',
    reengagementPriority: 'ALTA',
    score: 75,
    suggestedChannels: ['email', 'whatsapp'],
    suggestedSubject: 'Tens dubtes?',
    suggestedMessage: 'Hola Maria...',
    whatsappUrl: 'https://wa.me/34600111222',
    mailtoUrl: 'mailto:maria@example.com',
    ...overrides,
  };
}

describe('buildLeadReengagementProposals', () => {
  it('mapeja prioritat ALTA a HIGH amb dueDate avui', () => {
    const result = buildLeadReengagementProposals(
      [makeCandidate({ reengagementPriority: 'ALTA' })],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('HIGH');
    expect(result[0].dedupeKey).toBe('reengagement:lead-1');
    expect(result[0].title).toContain('Maria Garcia');
    expect(result[0].title).toContain('Pressupost sense resposta');
  });

  it('mapeja prioritat MITJANA a MEDIUM', () => {
    const result = buildLeadReengagementProposals(
      [makeCandidate({ reengagementPriority: 'MITJANA' })],
      NOW,
    );
    expect(result[0].priority).toBe('MEDIUM');
  });

  it('exclou BAIXA per defecte', () => {
    const result = buildLeadReengagementProposals(
      [makeCandidate({ reengagementPriority: 'BAIXA' })],
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it('inclou BAIXA si includeLow=true', () => {
    const result = buildLeadReengagementProposals(
      [makeCandidate({ reengagementPriority: 'BAIXA' })],
      NOW,
      { includeLow: true },
    );
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('LOW');
  });

  it('descripció inclou dies sense activitat i canals suggerits', () => {
    const result = buildLeadReengagementProposals(
      [makeCandidate({ daysSinceActivity: 9, suggestedChannels: ['email'] })],
      NOW,
    );
    expect(result[0].description).toContain('9 dies');
    expect(result[0].description).toContain('email');
    expect(result[0].description).toContain('/admin/leads/reengagement');
  });
});

describe('runLeadReengagementAutomation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no fa res si no hi ha candidats', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    const result = await runLeadReengagementAutomation(NOW);
    expect(result).toEqual({ candidates: 0, proposed: 0, created: 0, skipped: 0 });
    expect(mockPrisma.task.createMany).not.toHaveBeenCalled();
  });

  it('crea tasques per candidats no duplicats', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Maria',
        email: 'm@x.com',
        phone: '+34600',
        status: 'QUOTE_SENT',
        priority: 'HIGH',
        eventType: 'WEDDING',
        eventDate: null,
        eventLocation: null,
        budget: null,
        preferredLocale: 'ca',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        updatedAt: new Date('2026-05-10T00:00:00Z'),
        contactedAt: new Date('2026-05-10T00:00:00Z'),
        activities: [],
      },
    ]);
    mockPrisma.task.findMany.mockResolvedValue([]);
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    const result = await runLeadReengagementAutomation(NOW);

    expect(result.candidates).toBe(1);
    expect(result.proposed).toBe(1);
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockPrisma.task.createMany).toHaveBeenCalledOnce();
    const args = mockPrisma.task.createMany.mock.calls[0][0];
    expect(args.data[0].source).toBe('AUTOMATION');
    expect(args.data[0].autoRule).toBe('LEAD_REENGAGEMENT');
    expect(args.data[0].dedupeKey).toBe('reengagement:lead-1');
    expect(args.skipDuplicates).toBe(true);
  });

  it('saltja candidats amb dedupeKey ja obert', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Maria',
        email: 'm@x.com',
        phone: '+34600',
        status: 'QUOTE_SENT',
        priority: 'HIGH',
        eventType: 'WEDDING',
        eventDate: null,
        eventLocation: null,
        budget: null,
        preferredLocale: 'ca',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        updatedAt: new Date('2026-05-10T00:00:00Z'),
        contactedAt: new Date('2026-05-10T00:00:00Z'),
        activities: [],
      },
    ]);
    mockPrisma.task.findMany.mockResolvedValue([{ dedupeKey: 'reengagement:lead-1' }]);

    const result = await runLeadReengagementAutomation(NOW);

    expect(result.proposed).toBe(1);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockPrisma.task.createMany).not.toHaveBeenCalled();
  });
});
