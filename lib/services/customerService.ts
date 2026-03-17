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


interface UpsertCustomerInput {
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

interface UpsertCustomerResult {
  customer: Customer;
  isNew: boolean;
}

async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const normalizedEmail = normalizeEmail(email);
  return prisma.customer.findUnique({
    where: { emailNormalized: normalizedEmail },
  });
}

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

