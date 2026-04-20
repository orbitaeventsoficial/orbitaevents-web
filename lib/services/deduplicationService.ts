/**
 * DEDUPLICATION SERVICE
 * Òrbita Events - Ecosistema CRM
 *
 * Detecta i fusiona clients duplicats intel·ligentment basant-se en:
 * - Email exacte (100% match)
 * - Telèfon exacte (90% match)
 * - Telèfon parcial - últims 6 dígits (50% match)
 * - Nom similar amb Levenshtein (40-70% match)
 * - Instagram exacte (60% match)
 * - Mateixa ciutat (bonus +20%)
 */

import { prisma } from '@/lib/prisma';
import { CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants';
import {
  normalizeEmail,
  normalizePhone,
  normalizeName,
  normalizeInstagram,
} from '@/lib/utils/normalize';
import type { Customer, Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

interface MatchReason {
  field: string;
  type: 'exact' | 'similar' | 'partial';
  value1: string;
  value2: string;
  score: number;
}

interface DuplicateMatch {
  customer: Customer;
  matchScore: number;
  matchReasons: MatchReason[];
}

interface MergeResult {
  mergedCustomer: Customer;
  deletedIds: string[];
  fieldsUpdated: string[];
}

interface CustomerInput {
  email?: string;
  name?: string;
  phone?: string;
  instagram?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS PRINCIPALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Busca possibles duplicats d'un client
 */
export async function findDuplicates(
  input: CustomerInput,
  excludeId?: string
): Promise<DuplicateMatch[]> {
  // Normalitzar input
  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;
  const normalizedName = input.name ? normalizeName(input.name) : null;
  const normalizedInstagram = input.instagram ? normalizeInstagram(input.instagram) : null;

  // Construir OR conditions per trobar candidats a la BD (en lloc de carregar-los tots)
  const orConditions: Prisma.CustomerWhereInput[] = [];

  if (normalizedEmail) {
    orConditions.push({ emailNormalized: normalizedEmail });
  }
  if (normalizedPhone) {
    orConditions.push({ phoneNormalized: normalizedPhone });
    // Telèfon parcial: últims 6 dígits
    if (normalizedPhone.length >= 6) {
      orConditions.push({ phoneNormalized: { endsWith: normalizedPhone.slice(-6) } });
    }
  }
  if (normalizedInstagram) {
    orConditions.push({ instagramNormalized: normalizedInstagram });
  }
  if (normalizedName) {
    // Buscar per prefix del nom normalitzat (cobreix >70% similitud en la majoria de casos)
    const namePrefix = normalizedName.slice(0, Math.max(3, Math.floor(normalizedName.length * 0.6)));
    orConditions.push({ nameNormalized: { startsWith: namePrefix } });
  }

  // Si no tenim cap condició de cerca, no hi ha candidats
  if (orConditions.length === 0) return [];

  const baseWhere: Prisma.CustomerWhereInput = {
    mergedIntoId: null,
    ...(excludeId ? { id: { not: excludeId } } : {}),
  };

  const candidates = await prisma.customer.findMany({
    where: { ...baseWhere, OR: orConditions },
    take: 100, // Límit raonable per evitar problemes de memòria
  });

  const matches: DuplicateMatch[] = [];

  for (const customer of candidates) {
    const reasons: MatchReason[] = [];
    let totalScore = 0;

    // 1. EMAIL EXACTE (100 punts)
    if (normalizedEmail && customer.emailNormalized === normalizedEmail) {
      reasons.push({
        field: 'email',
        type: 'exact',
        value1: input.email || '',
        value2: customer.email,
        score: 100,
      });
      totalScore += 100;
    }

    // 2. TELÈFON EXACTE (90 punts)
    if (normalizedPhone && customer.phoneNormalized === normalizedPhone) {
      reasons.push({
        field: 'phone',
        type: 'exact',
        value1: input.phone || '',
        value2: customer.phone || '',
        score: 90,
      });
      totalScore += 90;
    }

    // 3. TELÈFON PARCIAL - últims 6 dígits (50 punts)
    if (normalizedPhone && customer.phoneNormalized && totalScore < 90) {
      const last6Input = normalizedPhone.slice(-6);
      const last6Customer = customer.phoneNormalized.slice(-6);
      if (last6Input === last6Customer && last6Input.length === 6) {
        reasons.push({
          field: 'phone',
          type: 'partial',
          value1: input.phone || '',
          value2: customer.phone || '',
          score: 50,
        });
        totalScore += 50;
      }
    }

    // 4. NOM SIMILAR (fuzzy matching amb Levenshtein)
    if (normalizedName && customer.nameNormalized) {
      const similarity = calculateSimilarity(normalizedName, customer.nameNormalized);

      if (similarity >= 0.9) {
        reasons.push({
          field: 'name',
          type: 'exact',
          value1: input.name || '',
          value2: customer.name,
          score: 70,
        });
        totalScore += 70;
      } else if (similarity >= 0.7) {
        reasons.push({
          field: 'name',
          type: 'similar',
          value1: input.name || '',
          value2: customer.name,
          score: 40,
        });
        totalScore += 40;
      }
    }

    // 5. INSTAGRAM IGUAL (60 punts)
    if (
      normalizedInstagram &&
      customer.instagramNormalized &&
      normalizedInstagram === customer.instagramNormalized
    ) {
      reasons.push({
        field: 'instagram',
        type: 'exact',
        value1: input.instagram || '',
        value2: customer.instagram || '',
        score: 60,
      });
      totalScore += 60;
    }

    if (reasons.length > 0 && totalScore >= 40) {
      matches.push({
        customer,
        matchScore: Math.min(totalScore, 100),
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}


/**
 * Fusionar dos o més clients en un
 */
export async function mergeCustomers(
  primaryId: string,
  duplicateIds: string[],
  fieldPreferences?: Record<string, string>
): Promise<MergeResult> {
  // 1. Obtenir tots els clients a fusionar
  const allCustomers = await prisma.customer.findMany({
    where: { id: { in: [primaryId, ...duplicateIds] } },
    include: {
      leads: true,
      testimonials: true,
      discountCodes: true,
    },
  });

  const primary = allCustomers.find(c => c.id === primaryId);
  const duplicates = allCustomers.filter(c => c.id !== primaryId);

  if (!primary) throw new Error('Client principal no trobat');

  // 2. Crear dades fusionades
  const fieldsUpdated: string[] = [];
  const updateData: Prisma.CustomerUpdateInput = {};

  // Camps a fusionar (preferir valors no buits)
  type MergeableField = 'phone' | 'instagram';
  const fieldsToMerge: MergeableField[] = ['phone', 'instagram'];

  for (const field of fieldsToMerge) {
    // Si hi ha preferència específica
    if (fieldPreferences?.[field]) {
      const preferredCustomer = allCustomers.find(c => c.id === fieldPreferences[field]);
      if (preferredCustomer?.[field] && preferredCustomer[field] !== primary[field]) {
        if (field === 'phone') {
          updateData.phone = preferredCustomer.phone;
        } else if (field === 'instagram') {
          updateData.instagram = preferredCustomer.instagram;
        }
        fieldsUpdated.push(field);
      }
    }
    // Si el primary no té valor, buscar en duplicats
    else if (!primary[field]) {
      for (const dup of duplicates) {
        if (dup[field]) {
          if (field === 'phone') {
            updateData.phone = dup.phone;
          } else if (field === 'instagram') {
            updateData.instagram = dup.instagram;
          }
          fieldsUpdated.push(field);
          break;
        }
      }
    }
  }

  // Fusionar consentiments (OR - si algun va dir sí, es manté)
  const anyGdprConsent = allCustomers.some(c => c.gdprConsent);
  const anyMarketingConsent = allCustomers.some(c => c.marketingConsent);

  if (anyGdprConsent && !primary.gdprConsent) {
    updateData.gdprConsent = true;
    updateData.gdprConsentDate = new Date();
    fieldsUpdated.push('gdprConsent');
  }

  if (anyMarketingConsent && !primary.marketingConsent) {
    updateData.marketingConsent = true;
    updateData.marketingConsentDate = new Date();
    fieldsUpdated.push('marketingConsent');
  }

  // Fusionar estadístiques (sumar)
  const totalEvents = allCustomers.reduce((sum, c) => sum + c.totalEvents, 0);
  const totalSpent = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  updateData.totalEvents = totalEvents;
  updateData.totalSpent = totalSpent;

  // Data més recent d'últim event
  const lastEventDates = allCustomers
    .filter(c => c.lastEventDate)
    .map(c => c.lastEventDate!);
  if (lastEventDates.length > 0) {
    updateData.lastEventDate = new Date(Math.max(...lastEventDates.map(d => d.getTime())));
  }

  // Normalitzar si s'ha actualitzat phone o instagram
  if (updateData.phone) {
    updateData.phoneNormalized = normalizePhone(updateData.phone as string);
  }
  if (updateData.instagram) {
    updateData.instagramNormalized = normalizeInstagram(updateData.instagram as string);
  }

  // 3. Executar transacció
  await prisma.$transaction([
    // Actualitzar client principal
    prisma.customer.update({
      where: { id: primaryId },
      data: updateData,
    }),

    // Moure leads dels duplicats al principal
    prisma.lead.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryId },
    }),

    // Moure testimonials dels duplicats al principal
    prisma.customerTestimonial.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryId },
    }),

    // Moure discount codes dels duplicats al principal
    prisma.customerDiscountCode.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryId },
    }),

    // Moure activity logs dels duplicats al principal
    prisma.customerActivity.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryId },
    }),

    // Marcar duplicats com fusionats (soft delete)
    prisma.customer.updateMany({
      where: { id: { in: duplicateIds } },
      data: { mergedIntoId: primaryId },
    }),
  ]);

  // 4. Log de l'activitat
  await prisma.customerActivity.create({
    data: {
      customerId: primaryId,
      action: CUSTOMER_ACTIVITY_ACTIONS.CUSTOMERS_MERGED,
      details: {
        mergedIds: duplicateIds,
        fieldsUpdated,
        totalEventsAfterMerge: totalEvents,
        totalSpentAfterMerge: totalSpent,
      } as Prisma.InputJsonValue,
    },
  });

  // 5. Retornar resultat
  const mergedCustomer = await prisma.customer.findUnique({
    where: { id: primaryId },
  });

  return {
    mergedCustomer: mergedCustomer!,
    deletedIds: duplicateIds,
    fieldsUpdated,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS AUXILIARS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcular similitud entre dos strings (Levenshtein normalitzat)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Matriu per Levenshtein
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}


