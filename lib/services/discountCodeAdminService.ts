import { prisma } from '@/lib/prisma';

type DiscountCodeCreateInput = {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  description?: string;
  validFrom?: string;
  validUntil: string;
  maxUses?: number;
  minOrderValue?: number;
  applicablePacks?: string[];
  isAccumulative: boolean;
  sourceType?: string;
};

export async function listAdminDiscountCodes() {
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: codes.length,
    active: codes.filter((code) => code.isActive).length,
    expired: codes.filter((code) => code.validUntil < new Date()).length,
    totalUses: codes.reduce((sum, code) => sum + code.currentUses, 0),
  };

  return { ok: true, codes, stats };
}

export async function createAdminDiscountCode(data: DiscountCodeCreateInput) {
  const normalizedCode = data.code.trim().toUpperCase();

  const existing = await prisma.discountCode.findUnique({
    where: { code: normalizedCode },
  });
  if (existing) {
    return { status: 409, body: { error: `El codi "${normalizedCode}" ja existeix` } };
  }

  const code = await prisma.discountCode.create({
    data: {
      code: normalizedCode,
      type: data.type,
      value: data.value,
      description: data.description,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: new Date(data.validUntil),
      maxUses: data.maxUses,
      minOrderValue: data.minOrderValue,
      applicablePacks: data.applicablePacks || [],
      isAccumulative: data.isAccumulative,
      sourceType: data.sourceType || 'MANUAL',
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'CREATE',
      entity: 'discountCode',
      entityId: code.id,
      details: { code: normalizedCode, type: data.type, value: data.value },
    },
  });

  return { status: 200, body: { ok: true, code } };
}
