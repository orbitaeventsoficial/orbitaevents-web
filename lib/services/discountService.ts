/**
 * DISCOUNT SERVICE
 * Òrbita Events - Ecosistema CRM
 *
 * Gestió de codis de descompte amb:
 * - Generació automàtica
 * - Validació
 * - Seguiment d'ús
 */

import { prisma } from '@/app/lib/prisma';
import { generateDiscountCode, generatePersonalizedCode } from '@/lib/utils/normalize';
import type { CustomerDiscountCode } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateDiscountCodeInput {
  customerId: string;
  discountPercent?: number;
  validMonths?: number;
  maxUses?: number;
  sourceType: 'POST_EVENT' | 'TESTIMONIAL' | 'REFERRAL' | 'MANUAL';
  sourceId?: string;
  customCode?: string; // Si es vol un codi específic
}

export interface ValidateDiscountResult {
  isValid: boolean;
  code?: CustomerDiscountCode;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS PRINCIPALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un codi de descompte per a un client
 */
export async function createDiscountCode(
  input: CreateDiscountCodeInput
): Promise<CustomerDiscountCode> {
  const {
    customerId,
    discountPercent = 10,
    validMonths = 6,
    maxUses = 1,
    sourceType,
    sourceId,
    customCode,
  } = input;

  // Obtenir el client per generar codi personalitzat
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error('Client no trobat');
  }

  // Generar o usar codi personalitzat
  let code = customCode || generatePersonalizedCode(customer.name, discountPercent);

  // Verificar unicitat
  const existing = await prisma.customerDiscountCode.findUnique({
    where: { code },
  });

  if (existing) {
    // Si ja existeix, generar un aleatori
    code = generateDiscountCode('ORBITA');
  }

  // Calcular data de validesa
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + validMonths);

  return prisma.customerDiscountCode.create({
    data: {
      customerId,
      code,
      discountPercent,
      validUntil,
      maxUses,
      sourceType,
      sourceId,
    },
  });
}

/**
 * Valida un codi de descompte
 */
export async function validateDiscountCode(
  code: string
): Promise<ValidateDiscountResult> {
  const discountCode = await prisma.customerDiscountCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { customer: true },
  });

  if (!discountCode) {
    return { isValid: false, error: 'Codi no vàlid' };
  }

  if (!discountCode.isActive) {
    return { isValid: false, error: 'Codi desactivat' };
  }

  if (new Date() > discountCode.validUntil) {
    return { isValid: false, error: 'Codi caducat' };
  }

  if (discountCode.currentUses >= discountCode.maxUses) {
    return { isValid: false, error: 'Codi ja utilitzat' };
  }

  return { isValid: true, code: discountCode };
}

/**
 * Marca un codi com a utilitzat
 */
export async function useDiscountCode(code: string): Promise<CustomerDiscountCode> {
  const validation = await validateDiscountCode(code);

  if (!validation.isValid || !validation.code) {
    throw new Error(validation.error || 'Codi no vàlid');
  }

  return prisma.customerDiscountCode.update({
    where: { id: validation.code.id },
    data: {
      currentUses: { increment: 1 },
      usedAt: new Date(),
    },
  });
}

/**
 * Obtenir tots els codis d'un client
 */
export async function getCustomerDiscountCodes(
  customerId: string
): Promise<CustomerDiscountCode[]> {
  return prisma.customerDiscountCode.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtenir codis actius d'un client
 */
export async function getActiveDiscountCodes(
  customerId: string
): Promise<CustomerDiscountCode[]> {
  // Obtenir tots els codis actius i filtrar els que encara tenen usos disponibles
  const codes = await prisma.customerDiscountCode.findMany({
    where: {
      customerId,
      isActive: true,
      validUntil: { gt: new Date() },
    },
    orderBy: { validUntil: 'asc' },
  });

  // Filtrar els que encara tenen usos disponibles
  return codes.filter(code => code.currentUses < code.maxUses);
}

/**
 * Desactivar un codi
 */
export async function deactivateDiscountCode(
  id: string
): Promise<CustomerDiscountCode> {
  return prisma.customerDiscountCode.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Obtenir estadístiques de codis de descompte
 */
export async function getDiscountCodeStats() {
  const [total, active, used, totalDiscount] = await Promise.all([
    prisma.customerDiscountCode.count(),
    prisma.customerDiscountCode.count({
      where: {
        isActive: true,
        validUntil: { gt: new Date() },
      },
    }),
    prisma.customerDiscountCode.count({
      where: { currentUses: { gt: 0 } },
    }),
    prisma.customerDiscountCode.aggregate({
      where: { currentUses: { gt: 0 } },
      _sum: { discountPercent: true },
    }),
  ]);

  return {
    total,
    active,
    used,
    totalDiscountGiven: totalDiscount._sum.discountPercent || 0,
  };
}

/**
 * Generar codi post-event per a un booking
 */
export async function createPostEventDiscountCode(
  customerId: string,
  bookingId: string,
  discountPercent = 10
): Promise<CustomerDiscountCode> {
  return createDiscountCode({
    customerId,
    discountPercent,
    validMonths: 12, // 1 any per post-event
    maxUses: 1,
    sourceType: 'POST_EVENT',
    sourceId: bookingId,
  });
}

/**
 * Generar codi de referit
 */
export async function createReferralDiscountCode(
  referrerId: string,
  discountPercent = 15
): Promise<CustomerDiscountCode> {
  return createDiscountCode({
    customerId: referrerId,
    discountPercent,
    validMonths: 3, // 3 mesos per referits
    maxUses: 1,
    sourceType: 'REFERRAL',
  });
}

/**
 * Cercar codis
 */
export async function searchDiscountCodes(
  query: string,
  limit = 20
): Promise<CustomerDiscountCode[]> {
  return prisma.customerDiscountCode.findMany({
    where: {
      code: { contains: query.toUpperCase() },
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
