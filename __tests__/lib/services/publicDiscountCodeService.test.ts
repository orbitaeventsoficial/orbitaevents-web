import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customerDiscountCode: { findFirst: vi.fn() },
    discountCode: { findFirst: vi.fn() },
    clientFeedback: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { validatePublicDiscountCode } from '@/lib/services/publicDiscountCodeService';

const FUTURE = new Date('2027-12-31');
const PAST = new Date('2020-01-01');
const NOW = new Date();

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customerDiscountCode.findFirst.mockResolvedValue(null);
  mockPrisma.discountCode.findFirst.mockResolvedValue(null);
  mockPrisma.clientFeedback.findFirst.mockResolvedValue(null);
});

describe('validatePublicDiscountCode', () => {
  it('retorna EMPTY_CODE per codi buit', async () => {
    const result = await validatePublicDiscountCode('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('EMPTY_CODE');
  });

  it('retorna EMPTY_CODE per espais en blanc', async () => {
    const result = await validatePublicDiscountCode('   ');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('EMPTY_CODE');
  });

  it('retorna NOT_FOUND si cap codi coincideix', async () => {
    const result = await validatePublicDiscountCode('NOEXIST');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('NOT_FOUND');
  });

  // ── Customer discount codes ──
  it('valida codi customer actiu', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'OE-ABC123',
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 1,
      currentUses: 0,
      discountPercent: 10,
    });

    const result = await validatePublicDiscountCode('OE-ABC123');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.source).toBe('customer');
      expect(result.type).toBe('PERCENTAGE');
      expect(result.value).toBe(10);
    }
  });

  it('retorna INACTIVE per codi customer desactivat', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'OE-ABC123',
      isActive: false,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 1,
      currentUses: 0,
      discountPercent: 10,
    });

    const result = await validatePublicDiscountCode('OE-ABC123');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('INACTIVE');
  });

  it('retorna EXPIRED per codi customer caducat', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'OE-ABC123',
      isActive: true,
      validFrom: PAST,
      validUntil: PAST,
      maxUses: 1,
      currentUses: 0,
      discountPercent: 10,
    });

    const result = await validatePublicDiscountCode('OE-ABC123');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('EXPIRED');
  });

  it('retorna MAX_USES_REACHED per codi customer esgotat', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'OE-ABC123',
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 1,
      currentUses: 1,
      discountPercent: 10,
    });

    const result = await validatePublicDiscountCode('OE-ABC123');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('MAX_USES_REACHED');
  });

  // ── Global discount codes ──
  it('valida codi global actiu', async () => {
    mockPrisma.discountCode.findFirst.mockResolvedValue({
      code: 'SUMMER2026',
      type: 'FIXED_AMOUNT',
      value: 50,
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 100,
      currentUses: 10,
      isAccumulative: true,
    });

    const result = await validatePublicDiscountCode('SUMMER2026');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.source).toBe('global');
      expect(result.type).toBe('FIXED_AMOUNT');
      expect(result.value).toBe(50);
      expect(result.isAccumulative).toBe(true);
    }
  });

  it('retorna EXPIRED per codi global caducat', async () => {
    mockPrisma.discountCode.findFirst.mockResolvedValue({
      code: 'OLD',
      type: 'PERCENTAGE',
      value: 15,
      isActive: true,
      validFrom: PAST,
      validUntil: PAST,
      maxUses: null,
      currentUses: 0,
      isAccumulative: false,
    });

    const result = await validatePublicDiscountCode('OLD');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('EXPIRED');
  });

  // ── Feedback discount codes ──
  it('valida codi feedback actiu', async () => {
    mockPrisma.clientFeedback.findFirst.mockResolvedValue({
      discountCode: 'FB-XYZ',
      discountPercent: 15,
      discountValidUntil: FUTURE,
      discountUsed: false,
    });

    const result = await validatePublicDiscountCode('FB-XYZ');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.source).toBe('feedback');
      expect(result.type).toBe('PERCENTAGE');
      expect(result.value).toBe(15);
    }
  });

  it('retorna ALREADY_USED per codi feedback usat', async () => {
    mockPrisma.clientFeedback.findFirst.mockResolvedValue({
      discountCode: 'FB-XYZ',
      discountPercent: 15,
      discountValidUntil: FUTURE,
      discountUsed: true,
    });

    const result = await validatePublicDiscountCode('FB-XYZ');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('ALREADY_USED');
  });

  it('retorna EXPIRED per codi feedback caducat', async () => {
    mockPrisma.clientFeedback.findFirst.mockResolvedValue({
      discountCode: 'FB-XYZ',
      discountPercent: 15,
      discountValidUntil: PAST,
      discountUsed: false,
    });

    const result = await validatePublicDiscountCode('FB-XYZ');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('EXPIRED');
  });

  // ── Prioritat ──
  it('prioritza customer sobre global', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'DUAL',
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 1,
      currentUses: 0,
      discountPercent: 10,
    });
    mockPrisma.discountCode.findFirst.mockResolvedValue({
      code: 'DUAL',
      type: 'PERCENTAGE',
      value: 20,
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: null,
      currentUses: 0,
      isAccumulative: false,
    });

    const result = await validatePublicDiscountCode('DUAL');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.source).toBe('customer');
      expect(result.value).toBe(10);
    }
  });

  it('normalitza codi a majúscules', async () => {
    mockPrisma.customerDiscountCode.findFirst.mockResolvedValue({
      code: 'OE-TEST',
      isActive: true,
      validFrom: PAST,
      validUntil: FUTURE,
      maxUses: 1,
      currentUses: 0,
      discountPercent: 5,
    });

    const result = await validatePublicDiscountCode('oe-test');
    expect(result.valid).toBe(true);
  });
});
