import { prisma } from '@/lib/prisma';

export type PublicDiscountValidation =
  | {
      valid: true;
      code: string;
      source: 'customer' | 'global' | 'feedback';
      type: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value: number;
      expiresAt: string;
      isAccumulative?: boolean;
    }
  | {
      valid: false;
      reason: string;
    };

function now() {
  return new Date();
}

export async function validatePublicDiscountCode(rawCode: string): Promise<PublicDiscountValidation> {
  const trimmed = rawCode.trim();
  if (!trimmed) {
    return { valid: false, reason: 'EMPTY_CODE' };
  }

  const code = trimmed.toUpperCase();
  const current = now();

  const customerCode = await prisma.customerDiscountCode.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: {
      code: true,
      isActive: true,
      validFrom: true,
      validUntil: true,
      maxUses: true,
      currentUses: true,
      discountPercent: true,
    },
  });

  if (customerCode) {
    if (!customerCode.isActive) {
      return { valid: false, reason: 'INACTIVE' };
    }
    if (customerCode.validFrom > current || customerCode.validUntil < current) {
      return { valid: false, reason: 'EXPIRED' };
    }
    if (customerCode.currentUses >= customerCode.maxUses) {
      return { valid: false, reason: 'MAX_USES_REACHED' };
    }

    return {
      valid: true,
      code: customerCode.code,
      source: 'customer',
      type: 'PERCENTAGE',
      value: Number(customerCode.discountPercent || 0),
      expiresAt: customerCode.validUntil.toISOString(),
      isAccumulative: false,
    };
  }

  const globalCode = await prisma.discountCode.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: {
      code: true,
      type: true,
      value: true,
      isActive: true,
      validFrom: true,
      validUntil: true,
      maxUses: true,
      currentUses: true,
      isAccumulative: true,
    },
  });

  if (globalCode) {
    if (!globalCode.isActive) {
      return { valid: false, reason: 'INACTIVE' };
    }
    if (globalCode.validFrom > current || globalCode.validUntil < current) {
      return { valid: false, reason: 'EXPIRED' };
    }
    if (typeof globalCode.maxUses === 'number' && globalCode.currentUses >= globalCode.maxUses) {
      return { valid: false, reason: 'MAX_USES_REACHED' };
    }

    return {
      valid: true,
      code: globalCode.code,
      source: 'global',
      type: globalCode.type,
      value: Number(globalCode.value || 0),
      expiresAt: globalCode.validUntil.toISOString(),
      isAccumulative: Boolean(globalCode.isAccumulative),
    };
  }

  const feedbackCode = await prisma.clientFeedback.findFirst({
    where: { discountCode: { equals: code, mode: 'insensitive' } },
    select: {
      discountCode: true,
      discountPercent: true,
      discountValidUntil: true,
      discountUsed: true,
    },
  });

  if (feedbackCode) {
    if (feedbackCode.discountUsed) {
      return { valid: false, reason: 'ALREADY_USED' };
    }
    if (feedbackCode.discountValidUntil < current) {
      return { valid: false, reason: 'EXPIRED' };
    }

    return {
      valid: true,
      code: feedbackCode.discountCode,
      source: 'feedback',
      type: 'PERCENTAGE',
      value: Number(feedbackCode.discountPercent || 0),
      expiresAt: feedbackCode.discountValidUntil.toISOString(),
      isAccumulative: false,
    };
  }

  return { valid: false, reason: 'NOT_FOUND' };
}
