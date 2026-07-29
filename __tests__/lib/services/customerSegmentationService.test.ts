import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  computeHealthScore,
  computeLifecycleStage,
  addCustomerTags,
  removeCustomerTags,
  setCustomerTags,
  updateCustomerPreferences,
  recalculateAllCustomers,
} from '@/lib/services/customerSegmentationService';

beforeEach(() => {
  vi.resetAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// computeHealthScore
// ═══════════════════════════════════════════════════════════════════════════

describe('computeHealthScore', () => {
  const base = {
    totalEvents: 0,
    totalSpent: 0,
    lastEventDate: null,
    createdAt: new Date('2025-01-01'),
    hasTestimonial: false,
    avgNps: null,
    hasReferrals: false,
  };

  it('retorna 0 per un client sense activitat antic', () => {
    const score = computeHealthScore(base);
    expect(score).toBe(0);
  });

  it('dóna punts per recurrència: 1 event = 10p base', () => {
    const score = computeHealthScore({ ...base, totalEvents: 1 });
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it('dóna punts per recurrència: 5 events = 30p base', () => {
    const score = computeHealthScore({ ...base, totalEvents: 5 });
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('dóna punts per valor econòmic', () => {
    const withSpend = computeHealthScore({ ...base, totalSpent: 3000 });
    const withoutSpend = computeHealthScore({ ...base, totalSpent: 0 });
    expect(withSpend).toBeGreaterThan(withoutSpend);
  });

  it('dóna punts per frescor (event recent)', () => {
    const recent = computeHealthScore({
      ...base,
      totalEvents: 1,
      lastEventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // fa 1 setmana
    });
    const old = computeHealthScore({
      ...base,
      totalEvents: 1,
      lastEventDate: new Date('2024-01-01'),
    });
    expect(recent).toBeGreaterThan(old);
  });

  it('dóna punts per NPS alt', () => {
    const highNps = computeHealthScore({ ...base, avgNps: 10 });
    const lowNps = computeHealthScore({ ...base, avgNps: 3 });
    expect(highNps).toBeGreaterThan(lowNps);
  });

  it('dóna punts per engagement (testimoni + referrals)', () => {
    const engaged = computeHealthScore({
      ...base,
      hasTestimonial: true,
      hasReferrals: true,
    });
    expect(engaged).toBeGreaterThanOrEqual(10);
  });

  it('un VIP ideal té score >80', () => {
    const vip = computeHealthScore({
      totalEvents: 5,
      totalSpent: 5000,
      lastEventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // fa 1 mes
      createdAt: new Date('2024-01-01'),
      hasTestimonial: true,
      avgNps: 10,
      hasReferrals: true,
    });
    expect(vip).toBeGreaterThanOrEqual(80);
  });

  it('no supera 100', () => {
    const max = computeHealthScore({
      totalEvents: 100,
      totalSpent: 100000,
      lastEventDate: new Date(),
      createdAt: new Date('2020-01-01'),
      hasTestimonial: true,
      avgNps: 10,
      hasReferrals: true,
    });
    expect(max).toBeLessThanOrEqual(100);
  });

  it('client nou recent té frescor mínima', () => {
    const newCustomer = computeHealthScore({
      ...base,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // fa 1 setmana
    });
    expect(newCustomer).toBeGreaterThan(0);
  });

  // Regressió: `computeHealthScore` usava `new Date()` intern, fent que el
  // mateix client amb els mateixos inputs canviés de score segons el rellotge
  // real. Amb `now` injectat el valor és determinista.
  it('determinisme: dos càlculs amb el mateix `now` lògic donen el mateix score', () => {
    const now = new Date('2026-04-19T10:00:00Z');
    const input = {
      ...base,
      totalEvents: 3,
      totalSpent: 4000,
      lastEventDate: new Date('2026-02-19T10:00:00Z'), // 2 mesos abans
      avgNps: 9,
      hasTestimonial: true,
      now,
    };
    const a = computeHealthScore(input);
    const b = computeHealthScore(input);
    expect(a).toBe(b);
    // Verifica que `now` s'està respectant: amb `now` fixat, el valor no
    // depèn del moment en què es crida la funció.
    const laterNow = new Date('2027-04-19T10:00:00Z'); // 1 any més tard
    const c = computeHealthScore({ ...input, now: laterNow });
    // 14 mesos des del lastEventDate → freshness molt més baixa
    expect(c).toBeLessThan(a);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeLifecycleStage
// ═══════════════════════════════════════════════════════════════════════════

describe('computeLifecycleStage', () => {
  const base = {
    totalEvents: 0,
    totalSpent: 0,
    lastEventDate: null,
    hasActiveLeads: false,
    createdAt: new Date('2025-01-01'),
    currentStage: 'NEW' as const,
  };

  it('retorna NEW per defecte', () => {
    expect(computeLifecycleStage(base)).toBe('NEW');
  });

  it('retorna PROSPECT si té leads actius', () => {
    expect(computeLifecycleStage({ ...base, hasActiveLeads: true })).toBe('PROSPECT');
  });

  it('retorna FIRST_TIME amb 1 event', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 1,
      lastEventDate: new Date(),
    })).toBe('FIRST_TIME');
  });

  it('retorna RETURNING amb 2 events', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 2,
      lastEventDate: new Date(),
    })).toBe('RETURNING');
  });

  it('retorna VIP amb 3+ events', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 3,
      lastEventDate: new Date(),
    })).toBe('VIP');
  });

  it('retorna VIP amb alt valor econòmic', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 1,
      totalSpent: 2500,
      lastEventDate: new Date(),
    })).toBe('VIP');
  });

  it('manté VIP si ja era VIP manualment', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 1,
      lastEventDate: new Date(),
      currentStage: 'VIP',
    })).toBe('VIP');
  });

  it('retorna DORMANT si >6 mesos sense activitat', () => {
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 2,
      lastEventDate: sevenMonthsAgo,
    })).toBe('DORMANT');
  });

  it('retorna CHURNED si >12 mesos sense activitat', () => {
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 2,
      lastEventDate: thirteenMonthsAgo,
    })).toBe('CHURNED');
  });

  it('no marca DORMANT si no té events previs', () => {
    expect(computeLifecycleStage({
      ...base,
      totalEvents: 0,
      lastEventDate: null,
    })).toBe('NEW');
  });

  // Regressió: `computeLifecycleStage` usava `new Date()` intern. El cron
  // diari podria marcar un client com a DORMANT/CHURNED un dia i no l'altre
  // si el lastEventDate queda a la frontera dels 6/12 mesos.
  it('determinisme: DORMANT/CHURNED respecten el `now` injectat', () => {
    // 2026-04-19 menys 7 mesos = 2025-09-19 → DORMANT
    const sevenMonthsBefore = new Date('2025-09-19T10:00:00Z');
    const result = computeLifecycleStage({
      ...base,
      totalEvents: 2,
      lastEventDate: sevenMonthsBefore,
      now: new Date('2026-04-19T10:00:00Z'),
    });
    expect(result).toBe('DORMANT');

    // Amb `now` un any més tard, el mateix lastEventDate queda a 19 mesos
    // enrere → CHURNED. Si el servei no respectés `now`, retornaria DORMANT.
    const laterResult = computeLifecycleStage({
      ...base,
      totalEvents: 2,
      lastEventDate: sevenMonthsBefore,
      now: new Date('2027-04-19T10:00:00Z'),
    });
    expect(laterResult).toBe('CHURNED');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tags CRUD
// ═══════════════════════════════════════════════════════════════════════════

describe('addCustomerTags', () => {
  it('afegeix tags nous sense duplicats', async () => {
    mockPrisma.customer.findUniqueOrThrow.mockResolvedValue({ tags: ['VIP'] });
    mockPrisma.customer.update.mockResolvedValue({ tags: ['VIP', 'Corporatiu'] });

    const result = await addCustomerTags('c1', ['Corporatiu', 'VIP']);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { tags: ['VIP', 'Corporatiu'] },
    });
    expect(result.tags).toEqual(['VIP', 'Corporatiu']);
  });
});

describe('removeCustomerTags', () => {
  it('elimina tags especificats', async () => {
    mockPrisma.customer.findUniqueOrThrow.mockResolvedValue({ tags: ['VIP', 'Corporatiu', 'Premium'] });
    mockPrisma.customer.update.mockResolvedValue({ tags: ['VIP', 'Premium'] });

    await removeCustomerTags('c1', ['Corporatiu']);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { tags: ['VIP', 'Premium'] },
    });
  });
});

describe('setCustomerTags', () => {
  it('substitueix tots els tags', async () => {
    mockPrisma.customer.update.mockResolvedValue({ tags: ['Nou'] });

    await setCustomerTags('c1', ['Nou']);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { tags: ['Nou'] },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Preferences
// ═══════════════════════════════════════════════════════════════════════════

describe('updateCustomerPreferences', () => {
  it('actualitza preferències com a JSON', async () => {
    const prefs = { musicStyles: ['reggaeton', 'house'], specialNeeds: 'Sense gluten' };
    mockPrisma.customer.update.mockResolvedValue({ preferences: prefs });

    const result = await updateCustomerPreferences('c1', prefs);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { preferences: prefs },
    });
    expect(result.preferences).toEqual(prefs);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// recalculateAllCustomers
// ═══════════════════════════════════════════════════════════════════════════

describe('recalculateAllCustomers', () => {
  it('processa un batch de clients i actualitza els que canvien', async () => {
    const mockCustomer = {
      id: 'c1',
      totalEvents: 3,
      totalSpent: 3000,
      lastEventDate: new Date(),
      createdAt: new Date('2024-01-01'),
      lifecycleStage: 'NEW',
      healthScore: null,
      _count: { testimonials: 0, referrals: 0 },
      leads: [],
      bookings: [],
    };

    // First call returns batch, second call returns empty (end of pagination)
    mockPrisma.customer.findMany
      .mockResolvedValueOnce([mockCustomer])
      .mockResolvedValueOnce([]);
    mockPrisma.customer.update.mockResolvedValue({});

    const result = await recalculateAllCustomers();

    expect(result.processed).toBe(1);
    expect(result.lifecycleChanges).toBe(1); // NEW → VIP
    expect(result.healthUpdates).toBe(1);
    expect(mockPrisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({
        lifecycleStage: 'VIP',
        healthScore: expect.any(Number),
      }),
    });
  });

  it('no actualitza clients que ja estan correctes', async () => {
    const now = new Date();
    const mockCustomer = {
      id: 'c2',
      totalEvents: 0,
      totalSpent: 0,
      lastEventDate: null,
      createdAt: new Date('2024-01-01'),
      lifecycleStage: 'NEW',
      healthScore: 0,
      _count: { testimonials: 0, referrals: 0 },
      leads: [],
      bookings: [],
    };

    mockPrisma.customer.findMany
      .mockResolvedValueOnce([mockCustomer])
      .mockResolvedValueOnce([]);

    const result = await recalculateAllCustomers();

    expect(result.processed).toBe(1);
    expect(result.lifecycleChanges).toBe(0);
    expect(mockPrisma.customer.update).not.toHaveBeenCalled();
  });

  it('retorna zeros si no hi ha clients', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([]);

    const result = await recalculateAllCustomers();
    expect(result).toEqual({ processed: 0, lifecycleChanges: 0, healthUpdates: 0 });
  });

  it('pagina amb cursor quan el batch arriba al límit', async () => {
    const makeCustomer = (id: string) => ({
      id,
      totalEvents: 0,
      totalSpent: 0,
      lastEventDate: null,
      createdAt: new Date('2024-01-01'),
      lifecycleStage: 'NEW',
      healthScore: 0,
      _count: { testimonials: 0, referrals: 0 },
      leads: [],
      bookings: [],
    });

    const firstBatch = Array.from({ length: 100 }, (_, index) => makeCustomer(`c${index + 1}`));
    mockPrisma.customer.findMany
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce([makeCustomer('c101')]);

    const result = await recalculateAllCustomers(new Date('2026-05-05T10:00:00Z'));

    expect(result.processed).toBe(101);
    expect(mockPrisma.customer.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        skip: 1,
        cursor: { id: 'c100' },
      }),
    );
  });
});
