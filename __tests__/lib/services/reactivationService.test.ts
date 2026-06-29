import { beforeEach, describe, it, expect, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  generateReactivationCandidates,
  loadReactivationCandidates,
  type ReactivationInput,
} from '@/lib/services/reactivationService';

const NOW = new Date('2026-04-10T12:00:00Z');
const DAY = 1000 * 60 * 60 * 24;
const DORMANT_DAYS = 6 * 30;

type Customer = ReactivationInput['customers'][number];

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c1',
    name: 'Laura Prats',
    email: 'laura@example.com',
    phone: '+34600000000',
    phoneNormalized: '+34600000000',
    instagram: null,
    lifecycleStage: 'RETURNING',
    totalEvents: 2,
    totalSpent: 1500,
    healthScore: 70,
    lastEventDate: new Date(NOW.getTime() - (DORMANT_DAYS + 10) * DAY),
    lastContactedAt: null,
    preferredLocale: 'ca',
    marketingConsent: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findMany.mockResolvedValue([]);
});

describe('generateReactivationCandidates', () => {
  it('retorna array buit sense clients', () => {
    const result = generateReactivationCandidates({ customers: [], now: NOW });
    expect(result).toEqual([]);
  });

  it('classifica VIP dormant amb prioritat ALTA i score màxim', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ lifecycleStage: 'VIP', totalSpent: 5000 })],
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('DORMANT_VIP');
    expect(result[0].priority).toBe('ALTA');
    expect(result[0].score).toBe(95);
  });

  it('classifica alt valor dormant (>=2000€)', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ totalSpent: 3000, lifecycleStage: 'RETURNING' })],
      now: NOW,
    });
    expect(result[0].reason).toBe('DORMANT_HIGH_VALUE');
    expect(result[0].priority).toBe('ALTA');
  });

  it('classifica recurrent dormant (>=2 events, <2000€)', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ totalSpent: 800, totalEvents: 3 })],
      now: NOW,
    });
    expect(result[0].reason).toBe('DORMANT_RECURRING');
    expect(result[0].priority).toBe('MITJANA');
  });

  it('classifica primer event dormant', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ totalEvents: 1, totalSpent: 500, lifecycleStage: 'FIRST_TIME' })],
      now: NOW,
    });
    expect(result[0].reason).toBe('DORMANT_FIRST_TIME');
  });

  it('classifica at-risk per health score baix (no dormant)', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          healthScore: 30,
          lastEventDate: new Date(NOW.getTime() - 30 * DAY), // no dormant
          lifecycleStage: 'RETURNING',
        }),
      ],
      now: NOW,
    });
    expect(result[0].reason).toBe('AT_RISK_HEALTH');
  });

  it('classifica CHURNED recent com a recuperació', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          lifecycleStage: 'CHURNED',
          lastEventDate: new Date(NOW.getTime() - 15 * 30 * DAY),
        }),
      ],
      now: NOW,
    });
    expect(result[0].reason).toBe('CHURNED_RECOVERY');
    expect(result[0].priority).toBe('BAIXA');
  });

  it('exclou CHURNED molt antic (>24 mesos)', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          lifecycleStage: 'CHURNED',
          lastEventDate: new Date(NOW.getTime() - 30 * 30 * DAY),
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it('exclou clients actius recents sense health baix', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          lastEventDate: new Date(NOW.getTime() - 30 * DAY),
          healthScore: 80,
        }),
      ],
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it('ordena candidats per score descendent', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({ id: 'a', totalEvents: 1, totalSpent: 500, lifecycleStage: 'FIRST_TIME' }),
        makeCustomer({ id: 'b', lifecycleStage: 'VIP', totalSpent: 5000 }),
        makeCustomer({ id: 'c', totalSpent: 3000 }),
      ],
      now: NOW,
    });
    expect(result.map((c) => c.customerId)).toEqual(['b', 'c', 'a']);
  });

  it('usa plantilla catalana per locale ca', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ preferredLocale: 'ca', lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].suggestedSubject).toContain('trobem a faltar');
    expect(result[0].suggestedMessage).toContain('Laura');
  });

  it('usa plantilla castellana per locale es', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ preferredLocale: 'es', lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].suggestedSubject).toContain('echamos de menos');
    expect(result[0].suggestedMessage).toContain('Laura');
  });

  it('fa servir només primer nom a la plantilla', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({ name: 'Laura Prats Vidal', lifecycleStage: 'VIP' }),
      ],
      now: NOW,
    });
    expect(result[0].suggestedMessage).toContain('Laura');
    expect(result[0].suggestedMessage).not.toContain('Prats Vidal');
  });

  it('genera whatsappUrl amb telèfon normalitzat', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ phoneNormalized: '+34600123456', lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].whatsappUrl).toMatch(/^https:\/\/wa\.me\/34600123456\?text=/);
  });

  it('no genera whatsappUrl sense telèfon', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({ phone: null, phoneNormalized: null, lifecycleStage: 'VIP' }),
      ],
      now: NOW,
    });
    expect(result[0].whatsappUrl).toBeNull();
    expect(result[0].mailtoUrl).toContain('mailto:');
  });

  it('canals suggerits inclou whatsapp si hi ha phone', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].suggestedChannels).toContain('whatsapp');
  });

  it('canals suggerits omet email sense consent (tret d\'alta prioritat)', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          marketingConsent: false,
          totalSpent: 800,
          totalEvents: 3,
          lifecycleStage: 'RETURNING',
        }),
      ],
      now: NOW,
    });
    // Prioritat MITJANA + sense consent → no email
    expect(result[0].priority).toBe('MITJANA');
    expect(result[0].suggestedChannels).not.toContain('email');
  });

  it('canals suggerits inclou email sense consent si alta prioritat (VIP)', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ marketingConsent: false, lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].priority).toBe('ALTA');
    expect(result[0].suggestedChannels).toContain('email');
  });

  it('inclou instagram als canals si disponible', () => {
    const result = generateReactivationCandidates({
      customers: [makeCustomer({ instagram: 'lauraprats', lifecycleStage: 'VIP' })],
      now: NOW,
    });
    expect(result[0].suggestedChannels).toContain('instagram');
  });

  it('calcula daysSinceLastEvent correctament', () => {
    const result = generateReactivationCandidates({
      customers: [
        makeCustomer({
          lastEventDate: new Date(NOW.getTime() - 200 * DAY),
          lifecycleStage: 'VIP',
        }),
      ],
      now: NOW,
    });
    expect(result[0].daysSinceLastEvent).toBe(200);
  });
});

describe('loadReactivationCandidates', () => {
  it('exclou clients fusionats del pipeline de reactivació', async () => {
    await loadReactivationCandidates(NOW);

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          mergedIntoId: null,
        }),
      })
    );
  });
});
