/**
 * CUSTOMER SERVICE - Prisma Version
 * ==================================
 * Gestió de clients amb Prisma
 */

import { prisma } from '@/lib/prisma';
import type { Customer } from '@prisma/client';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeInstagram,
  capitalizeName,
} from '@/lib/utils/normalize';

export type { Customer };

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface UpsertCustomerInput {
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  instagram?: string;
  howFoundUs?: string;
  consentMarketing?: boolean;
  consentDataProcessing?: boolean;
  source?: string;
}

export interface UpsertCustomerResult {
  customer: Customer;
  isNew: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Buscar client per email
 */
export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const normalizedEmail = normalizeEmail(email);
  return prisma.customer.findUnique({
    where: { emailNormalized: normalizedEmail },
  });
}

/**
 * Crear o actualitzar client
 */
export async function upsertCustomer(input: UpsertCustomerInput): Promise<UpsertCustomerResult> {
  const normalizedEmail = normalizeEmail(input.email);
  const existing = await findCustomerByEmail(normalizedEmail);

  if (existing) {
    const updateData: Record<string, unknown> = {};

    if (input.name && !existing.name) {
      updateData.name = capitalizeName(input.name);
      updateData.nameNormalized = normalizeName(input.name);
    }
    if (input.phone && !existing.phone) {
      updateData.phone = input.phone;
      updateData.phoneNormalized = normalizePhone(input.phone);
    }
    if (input.city) {
      updateData.preferredLocale = existing.preferredLocale;
    }
    if (input.instagram && !existing.instagram) {
      updateData.instagram = normalizeInstagram(input.instagram);
    }
    if (input.consentMarketing && !existing.marketingConsent) {
      updateData.marketingConsent = true;
      updateData.marketingConsentDate = new Date();
    }
    if (input.consentDataProcessing && !existing.gdprConsent) {
      updateData.gdprConsent = true;
      updateData.gdprConsentDate = new Date();
    }

    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: updateData,
    });

    return { customer: updated, isNew: false };
  }

  // Crear nou client
  const customer = await prisma.customer.create({
    data: {
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      name: input.name ? capitalizeName(input.name) : 'Sense nom',
      nameNormalized: input.name ? normalizeName(input.name) : 'sense nom',
      phone: input.phone || null,
      phoneNormalized: input.phone ? normalizePhone(input.phone) : null,
      instagram: input.instagram ? normalizeInstagram(input.instagram) : null,
      gdprConsent: input.consentDataProcessing || false,
      gdprConsentDate: input.consentDataProcessing ? new Date() : null,
      marketingConsent: input.consentMarketing || false,
      marketingConsentDate: input.consentMarketing ? new Date() : null,
    },
  });

  return { customer, isNew: true };
}

/**
 * Obtenir client per ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  return prisma.customer.findUnique({ where: { id } });
}

/**
 * Buscar clients
 */
export async function searchCustomers(query: string, limit = 20): Promise<Customer[]> {
  const q = query.toLowerCase().trim();
  return prisma.customer.findMany({
    where: {
      OR: [
        { emailNormalized: { contains: q } },
        { nameNormalized: { contains: q } },
        { phoneNormalized: { contains: q } },
      ],
    },
    take: limit,
  });
}

/**
 * Obtenir tots els clients
 */
export async function getAllCustomers(limit = 100): Promise<Customer[]> {
  return prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Actualitzar client
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  return prisma.customer.update({
    where: { id },
    data: updates,
  });
}

/**
 * Log activitat del client
 */
export async function logCustomerActivity(
  customerId: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await prisma.customerActivity.create({
    data: {
      customerId,
      action,
      details: (details as any) || undefined,
    },
  });
}

/**
 * Registrar consentiment
 */
export async function recordConsent(
  customerId: string,
  consentType: string,
  granted: boolean,
  source: string,
  legalTextVersion: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Map string to ConsentType enum
  const consentTypeMap: Record<string, string> = {
    'gdpr': 'GDPR_BASIC',
    'marketing': 'MARKETING_EMAIL',
    'marketing_email': 'MARKETING_EMAIL',
    'marketing_sms': 'MARKETING_SMS',
    'marketing_whatsapp': 'MARKETING_WHATSAPP',
  };

  const mappedType = consentTypeMap[consentType.toLowerCase()] || 'GDPR_BASIC';

  await prisma.consentRecord.create({
    data: {
      customerId,
      consentType: mappedType as any,
      granted,
      grantedAt: granted ? new Date() : null,
      source,
      consentVersion: legalTextVersion,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
}

/**
 * Obtenir estadístiques de clients
 */
export async function getCustomerStats() {
  const [total, marketing, withEvents] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { marketingConsent: true } }),
    prisma.customer.count({ where: { totalEvents: { gt: 0 } } }),
  ]);

  return { total, vip: 0, marketing, withEvents };
}
