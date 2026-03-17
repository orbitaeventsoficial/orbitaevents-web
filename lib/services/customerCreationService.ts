import { LeadSource } from '@prisma/client';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { normalizeDni } from '@/lib/utils/normalize';
import { findDuplicates } from '@/lib/services/deduplicationService';

type CustomerCreateInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  instagram?: string | null;
  preferredLocale?: string;
  dni?: string | null;
  source?: string;
  notes?: string;
};

type CustomerCreationResult = {
  status: number;
  body: Record<string, unknown>;
  message?: string;
};

function normalizeCustomerSource(source?: string): LeadSource {
  const validSources: LeadSource[] = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALLAPOP', 'REFERRAL', 'GOOGLE', 'OTHER'];
  return validSources.includes(String(source) as LeadSource) ? (String(source) as LeadSource) : 'OTHER';
}

export async function createCustomerFromInput(body: CustomerCreateInput): Promise<CustomerCreationResult> {
  const { name, email, phone, instagram, preferredLocale, dni, source, notes } = body;

  if (!name || !email) {
    return { status: 400, body: { error: 'Nom i email són obligatoris' } };
  }

  const emailNormalized = email.toLowerCase().trim();
  const existing = await prisma.customer.findUnique({ where: { emailNormalized } });
  if (existing) {
    return { status: 409, body: { error: 'Ja existeix un client amb aquest email' } };
  }

  const dniNormalized = dni ? normalizeDni(dni) : null;
  if (dniNormalized) {
    const existingByDni = await prisma.customer.findUnique({ where: { dniNormalized } });
    if (existingByDni) {
      return { status: 409, body: { error: `Ja existeix un client amb aquest DNI/NIF: ${existingByDni.name}` } };
    }
  }

  const nameNormalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const phoneNormalized = phone ? phone.replace(/\D/g, '') : null;
  const instagramNormalized = instagram ? instagram.replace('@', '').toLowerCase().trim() : null;
  const customerSource = normalizeCustomerSource(source);
  const initialNotes = typeof notes === 'string' ? notes.trim() : '';

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        name: name.trim(),
        nameNormalized,
        email: emailNormalized,
        emailNormalized,
        phone: phone?.trim() || null,
        phoneNormalized,
        instagram: instagram?.trim() || null,
        instagramNormalized,
        dni: dni?.trim() || null,
        dniNormalized,
        preferredLocale: preferredLocale || 'es',
        source: customerSource,
        gdprConsent: true,
        gdprConsentDate: new Date(),
      },
    });

    await tx.customerActivity.create({
      data: {
        customerId: created.id,
        action: 'CUSTOMER_CREATED',
        details: {
          source: customerSource,
          preferredLocale: preferredLocale || 'es',
          hasInitialNotes: Boolean(initialNotes),
        },
      },
    });

    if (initialNotes) {
      await tx.customerActivity.create({
        data: {
          customerId: created.id,
          action: 'INITIAL_NOTES',
          details: { notes: initialNotes },
        },
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    await tx.task.create({
      data: {
        customerId: created.id,
        title: 'Validar fitxa inicial del client',
        description: initialNotes
          ? `Revisa les notes inicials i defineix el següent pas comercial.\n\nNotes:\n${initialNotes}`
          : 'Confirma dades de contacte, tipus d’esdeveniment i següent acció comercial.',
        dueDate,
        status: 'OPEN',
        priority: 'HIGH',
        createdBy: 'system:auto-customer-create',
      },
    });

    return created;
  });

  let duplicateWarnings: Awaited<ReturnType<typeof findDuplicates>> = [];
  try {
    duplicateWarnings = await findDuplicates(
      {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
        instagram: customer.instagram || undefined,
      },
      customer.id
    );

    if (duplicateWarnings.length > 0) {
      await prisma.customerActivity.create({
        data: {
          customerId: customer.id,
          action: 'DUPLICATE_WARNING',
          details: {
            count: duplicateWarnings.length,
            topScore: duplicateWarnings[0]?.matchScore || 0,
            topCandidates: duplicateWarnings.slice(0, 3).map((dup) => ({
              id: dup.customer.id,
              name: dup.customer.name,
              score: dup.matchScore,
            })),
          },
        },
      });
    }
  } catch (dupError) {
    log.warn('No s’ha pogut completar la detecció automàtica de duplicats', {
      error: dupError instanceof Error ? dupError.message : String(dupError),
    });
  }

  return {
    status: 201,
    message: 'Client creat correctament',
    body: {
      ...customer,
      duplicateWarnings: duplicateWarnings.slice(0, 5).map((dup) => ({
        id: dup.customer.id,
        name: dup.customer.name,
        email: dup.customer.email,
        score: dup.matchScore,
      })),
    },
  };
}
