import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    lead: { updateMany: vi.fn() },
    customerTestimonial: { updateMany: vi.fn() },
    customerDiscountCode: { updateMany: vi.fn() },
    customerActivity: { updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/utils/normalize', () => ({
  normalizeEmail: (e: string) => e.toLowerCase().trim(),
  normalizePhone: (p: string) => p.replace(/\D/g, ''),
  normalizeName: (n: string) => n.toLowerCase().trim(),
  normalizeInstagram: (i: string) => i.toLowerCase().replace(/[^a-z0-9._]/g, ''),
}));

import { findDuplicates, mergeCustomers } from '@/lib/services/deduplicationService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCustomer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cust-1',
    name: 'Joan Garcia',
    email: 'joan@example.com',
    phone: '+34612345678',
    instagram: '@joangarcia',
    emailNormalized: 'joan@example.com',
    phoneNormalized: '34612345678',
    nameNormalized: 'joan garcia',
    instagramNormalized: 'joangarcia',
    mergedIntoId: null,
    gdprConsent: false,
    marketingConsent: false,
    totalEvents: 2,
    totalSpent: 3000,
    lastEventDate: new Date('2025-06-01'),
    ...overrides,
  };
}

// ─── findDuplicates ──────────────────────────────────────────────────────────

describe('findDuplicates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna buit si no hi ha clients', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([]);
    const result = await findDuplicates({ email: 'test@example.com' });
    expect(result).toEqual([]);
  });

  it('match per email exacte = 100 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({ emailNormalized: 'joan@example.com' }),
    ]);

    const result = await findDuplicates({ email: 'joan@example.com' });
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(100);
    expect(result[0].matchReasons[0].field).toBe('email');
    expect(result[0].matchReasons[0].type).toBe('exact');
    expect(result[0].matchReasons[0].score).toBe(100);
  });

  it('match per telèfon exacte = 90 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({ emailNormalized: 'other@x.com', phoneNormalized: '34612345678' }),
    ]);

    const result = await findDuplicates({ phone: '+34612345678' });
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(90);
    expect(result[0].matchReasons[0].field).toBe('phone');
  });

  it('match per telèfon parcial (últims 6) = 50 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'other@x.com',
        phoneNormalized: '34999345678', // últims 6 = 345678
      }),
    ]);

    const result = await findDuplicates({ phone: '+34612345678' }); // últims 6 = 345678
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(50);
    expect(result[0].matchReasons[0].type).toBe('partial');
  });

  it('no match parcial si ja hi ha exacte de telèfon', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({ emailNormalized: 'other@x.com', phoneNormalized: '34612345678' }),
    ]);

    const result = await findDuplicates({ phone: '+34612345678' });
    // Hauria de tenir 90 (exacte), no 90+50
    expect(result[0].matchScore).toBe(90);
    expect(result[0].matchReasons).toHaveLength(1);
  });

  it('match per Instagram exacte = 60 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'other@x.com',
        phoneNormalized: '34000000000',
        instagramNormalized: 'joangarcia',
      }),
    ]);

    const result = await findDuplicates({ instagram: '@joangarcia' });
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(60);
    expect(result[0].matchReasons[0].field).toBe('instagram');
  });

  it('match per nom molt similar (>90% Levenshtein) = 70 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'other@x.com',
        phoneNormalized: '34000000000',
        instagramNormalized: '',
        nameNormalized: 'joan garcia',
      }),
    ]);

    // "joan garcia" vs "joan garcai" — 1 transposició, alta similitud
    const result = await findDuplicates({ name: 'Joan Garcia' });
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(70);
  });

  it('match per nom similar (70-90% Levenshtein) = 40 punts', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'other@x.com',
        phoneNormalized: '34000000000',
        instagramNormalized: '',
        nameNormalized: 'joan garciaaaa', // ~78% similar a "joan garcia"
      }),
    ]);

    const result = await findDuplicates({ name: 'Joan Garcia' });
    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(40);
    expect(result[0].matchReasons[0].type).toBe('similar');
  });

  it('ignora match amb score < 40', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'other@x.com',
        phoneNormalized: '34000000000',
        instagramNormalized: '',
        nameNormalized: 'maria lopez fernandez', // molt diferent
      }),
    ]);

    const result = await findDuplicates({ name: 'Joan Garcia' });
    expect(result).toHaveLength(0);
  });

  it('acumula scores de múltiples camps (max 100)', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        emailNormalized: 'joan@example.com',
        nameNormalized: 'joan garcia',
        instagramNormalized: 'joangarcia',
      }),
    ]);

    const result = await findDuplicates({
      email: 'joan@example.com',
      name: 'Joan Garcia',
      instagram: '@joangarcia',
    });

    // email(100) + name(70) + instagram(60) = 230, cap a 100
    expect(result[0].matchScore).toBe(100);
    expect(result[0].matchReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('ordena resultats per score descendent', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({
        id: 'cust-low',
        emailNormalized: 'other@x.com',
        phoneNormalized: '34000000000',
        instagramNormalized: 'joangarcia',
      }),
      makeCustomer({
        id: 'cust-high',
        emailNormalized: 'joan@example.com',
        phoneNormalized: '34000000000',
      }),
    ]);

    const result = await findDuplicates({ email: 'joan@example.com', instagram: '@joangarcia' });
    expect(result[0].customer.id).toBe('cust-high');
    expect(result[1].customer.id).toBe('cust-low');
  });

  it('exclou client per excludeId', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([]);
    await findDuplicates({ email: 'test@test.com' }, 'cust-self');

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'cust-self' },
          mergedIntoId: null,
          OR: expect.any(Array),
        }),
        take: 100,
      })
    );
  });
});

// ─── mergeCustomers ──────────────────────────────────────────────────────────

describe('mergeCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fusiona estadístiques (suma totalEvents i totalSpent)', async () => {
    const primary = makeCustomer({ id: 'p', totalEvents: 3, totalSpent: 5000 });
    const dup1 = makeCustomer({ id: 'd1', totalEvents: 2, totalSpent: 2000 });

    mockPrisma.customer.findMany.mockResolvedValue([
      { ...primary, leads: [], testimonials: [], discountCodes: [] },
      { ...dup1, leads: [], testimonials: [], discountCodes: [] },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.customerActivity.create.mockResolvedValue({});
    mockPrisma.customer.findUnique.mockResolvedValue({ ...primary, totalEvents: 5, totalSpent: 7000 });

    const result = await mergeCustomers('p', ['d1']);

    expect(result.mergedCustomer.totalEvents).toBe(5);
    expect(result.mergedCustomer.totalSpent).toBe(7000);
    expect(result.deletedIds).toEqual(['d1']);
  });

  it('llança error si client principal no trobat', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([
      makeCustomer({ id: 'd1', leads: [], testimonials: [], discountCodes: [] }),
    ]);

    await expect(mergeCustomers('p-missing', ['d1'])).rejects.toThrow('principal no trobat');
  });

  it('fusiona consentiments amb OR', async () => {
    const primary = makeCustomer({ id: 'p', gdprConsent: false, marketingConsent: false });
    const dup1 = makeCustomer({ id: 'd1', gdprConsent: true, marketingConsent: true });

    mockPrisma.customer.findMany.mockResolvedValue([
      { ...primary, leads: [], testimonials: [], discountCodes: [] },
      { ...dup1, leads: [], testimonials: [], discountCodes: [] },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.customerActivity.create.mockResolvedValue({});
    mockPrisma.customer.findUnique.mockResolvedValue({ ...primary, gdprConsent: true, marketingConsent: true });

    const result = await mergeCustomers('p', ['d1']);
    expect(result.fieldsUpdated).toContain('gdprConsent');
    expect(result.fieldsUpdated).toContain('marketingConsent');
  });

  it('omple camps buits del primary amb dades dels duplicats', async () => {
    const primary = makeCustomer({ id: 'p', phone: null, instagram: null });
    const dup1 = makeCustomer({ id: 'd1', phone: '+34699999999', instagram: '@joan_insta' });

    mockPrisma.customer.findMany.mockResolvedValue([
      { ...primary, leads: [], testimonials: [], discountCodes: [] },
      { ...dup1, leads: [], testimonials: [], discountCodes: [] },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.customerActivity.create.mockResolvedValue({});
    mockPrisma.customer.findUnique.mockResolvedValue({ ...primary, phone: '+34699999999', instagram: '@joan_insta' });

    const result = await mergeCustomers('p', ['d1']);
    expect(result.fieldsUpdated).toContain('phone');
    expect(result.fieldsUpdated).toContain('instagram');
  });

  it('crea activity log CUSTOMERS_MERGED', async () => {
    const primary = makeCustomer({ id: 'p' });
    const dup = makeCustomer({ id: 'd1' });

    mockPrisma.customer.findMany.mockResolvedValue([
      { ...primary, leads: [], testimonials: [], discountCodes: [] },
      { ...dup, leads: [], testimonials: [], discountCodes: [] },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.customerActivity.create.mockResolvedValue({});
    mockPrisma.customer.findUnique.mockResolvedValue(primary);

    await mergeCustomers('p', ['d1']);

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'p',
        action: 'CUSTOMERS_MERGED',
        details: expect.objectContaining({
          mergedIds: ['d1'],
        }),
      }),
    });
  });
});
