import { CustomerLifecycle, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CUSTOMER_DORMANT_MONTHS,
  CUSTOMER_CHURNED_MONTHS,
  VIP_SPEND_THRESHOLD,
} from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH SCORE — 0-100, calculat a partir de múltiples factors
// ═══════════════════════════════════════════════════════════════════════════

interface HealthInput {
  totalEvents: number;
  totalSpent: number;
  lastEventDate: Date | null;
  createdAt: Date;
  hasTestimonial: boolean;
  avgNps: number | null;
  hasReferrals: boolean;
  now?: Date;
}

/**
 * Calcula el health score d'un client (0-100).
 *
 * Components:
 * - Recurrència (30p): quants events ha fet
 * - Valor econòmic (20p): total gastat
 * - Frescor (25p): temps des de l'últim event
 * - Satisfacció (15p): NPS mitjà
 * - Engagement (10p): testimoni + referrals
 */
export function computeHealthScore(input: HealthInput): number {
  const now = input.now ?? new Date();

  // Recurrència: 0 events=0, 1=10, 2=18, 3+=24, 5+=30
  let recurrence = 0;
  if (input.totalEvents >= 5) recurrence = 30;
  else if (input.totalEvents >= 3) recurrence = 24;
  else if (input.totalEvents >= 2) recurrence = 18;
  else if (input.totalEvents >= 1) recurrence = 10;

  // Valor econòmic: escala logarítmica fins a 20p (2000€=15p, 5000€+=20p)
  let value = 0;
  if (input.totalSpent > 0) {
    value = Math.min(20, Math.round((Math.log10(input.totalSpent + 1) / Math.log10(5001)) * 20));
  }

  // Frescor: 25p si event últim mes, decau linealment fins a 0 a 18 mesos
  let freshness = 0;
  if (input.lastEventDate) {
    const monthsAgo = (now.getTime() - input.lastEventDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    freshness = Math.max(0, Math.round(25 * (1 - monthsAgo / 18)));
  } else {
    // Sense events: mínim de frescor si el client és recent (<3 mesos)
    const monthsSinceCreation = (now.getTime() - input.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    freshness = monthsSinceCreation < 3 ? 8 : 0;
  }

  // Satisfacció: NPS 9-10=15p, 7-8=10p, 5-6=5p, <5=0
  let satisfaction = 0;
  if (input.avgNps != null) {
    if (input.avgNps >= 9) satisfaction = 15;
    else if (input.avgNps >= 7) satisfaction = 10;
    else if (input.avgNps >= 5) satisfaction = 5;
  }

  // Engagement: testimoni +5, referrals +5
  let engagement = 0;
  if (input.hasTestimonial) engagement += 5;
  if (input.hasReferrals) engagement += 5;

  return Math.min(100, recurrence + value + freshness + satisfaction + engagement);
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE STAGE — transicions automàtiques
// ═══════════════════════════════════════════════════════════════════════════

interface LifecycleInput {
  totalEvents: number;
  totalSpent: number;
  lastEventDate: Date | null;
  hasActiveLeads: boolean;
  createdAt: Date;
  currentStage: CustomerLifecycle;
  now?: Date;
}

/**
 * Determina el lifecycle stage correcte basat en les dades del client.
 * No fa downgrade de VIP manualment assignat.
 */
export function computeLifecycleStage(input: LifecycleInput): CustomerLifecycle {
  const now = input.now ?? new Date();
  const monthsSinceLastEvent = input.lastEventDate
    ? (now.getTime() - input.lastEventDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    : null;

  // Churned: >12 mesos sense activitat i té events previs
  if (monthsSinceLastEvent != null && monthsSinceLastEvent > CUSTOMER_CHURNED_MONTHS && input.totalEvents > 0) {
    return 'CHURNED';
  }

  // Dormant: >6 mesos sense activitat i té events previs
  if (monthsSinceLastEvent != null && monthsSinceLastEvent > CUSTOMER_DORMANT_MONTHS && input.totalEvents > 0) {
    return 'DORMANT';
  }

  // VIP: alta recurrència o alt valor — mantenir si ja era VIP manualment
  if (input.totalEvents >= 3 || input.totalSpent >= VIP_SPEND_THRESHOLD || input.currentStage === 'VIP') {
    return 'VIP';
  }

  // Returning: 2+ events
  if (input.totalEvents >= 2) return 'RETURNING';

  // First time: 1 event
  if (input.totalEvents === 1) return 'FIRST_TIME';

  // Prospect: sense events però amb leads actius
  if (input.hasActiveLeads) return 'PROSPECT';

  // New: default
  return 'NEW';
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH: recalcular tots els clients
// ═══════════════════════════════════════════════════════════════════════════

interface UpdateResult {
  processed: number;
  lifecycleChanges: number;
  healthUpdates: number;
}

/**
 * Recalcula healthScore i lifecycleStage de tots els clients.
 * Dissenyat per executar-se al cron diari.
 */
export async function recalculateAllCustomers(now: Date = new Date()): Promise<UpdateResult> {
  const batchSize = 100;
  let cursor: string | undefined;
  let processed = 0;
  let lifecycleChanges = 0;
  let healthUpdates = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const customers = await prisma.customer.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        totalEvents: true,
        totalSpent: true,
        lastEventDate: true,
        createdAt: true,
        lifecycleStage: true,
        healthScore: true,
        _count: {
          select: {
            testimonials: { where: { isApproved: true } },
            referrals: true,
          },
        },
        leads: {
          where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
          select: { id: true },
          take: 1,
        },
        bookings: {
          where: { clientSurvey: { isNot: null } },
          select: {
            clientSurvey: { select: { npsScore: true } },
          },
        },
      },
    });

    if (customers.length === 0) break;

    for (const c of customers) {
      // NPS mitjà
      const npsScores = c.bookings
        .map((b) => b.clientSurvey?.npsScore)
        .filter((n): n is number => n != null);
      const avgNps = npsScores.length > 0
        ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length
        : null;

      const health = computeHealthScore({
        totalEvents: c.totalEvents,
        totalSpent: c.totalSpent,
        lastEventDate: c.lastEventDate,
        createdAt: c.createdAt,
        hasTestimonial: c._count.testimonials > 0,
        avgNps,
        hasReferrals: c._count.referrals > 0,
        now,
      });

      const lifecycle = computeLifecycleStage({
        totalEvents: c.totalEvents,
        totalSpent: c.totalSpent,
        lastEventDate: c.lastEventDate,
        hasActiveLeads: c.leads.length > 0,
        createdAt: c.createdAt,
        currentStage: c.lifecycleStage,
        now,
      });

      const needsUpdate = health !== c.healthScore || lifecycle !== c.lifecycleStage;
      if (needsUpdate) {
        await prisma.customer.update({
          where: { id: c.id },
          data: {
            healthScore: health,
            lifecycleStage: lifecycle,
          },
        });
        if (lifecycle !== c.lifecycleStage) lifecycleChanges++;
        if (health !== c.healthScore) healthUpdates++;
      }

      processed++;
    }

    cursor = customers[customers.length - 1].id;
    if (customers.length < batchSize) break;
  }

  return { processed, lifecycleChanges, healthUpdates };
}

// ═══════════════════════════════════════════════════════════════════════════
// TAGS — afegir, treure, llistar tags d'un client
// ═══════════════════════════════════════════════════════════════════════════

export async function addCustomerTags(customerId: string, newTags: string[]) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: { tags: true },
  });

  const existing = new Set(customer.tags);
  const merged = [...existing, ...newTags.filter((t) => !existing.has(t))];

  return prisma.customer.update({
    where: { id: customerId },
    data: { tags: merged },
  });
}

export async function removeCustomerTags(customerId: string, removeTags: string[]) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: { tags: true },
  });

  const toRemove = new Set(removeTags);
  const filtered = customer.tags.filter((t) => !toRemove.has(t));

  return prisma.customer.update({
    where: { id: customerId },
    data: { tags: filtered },
  });
}

export async function setCustomerTags(customerId: string, tags: string[]) {
  return prisma.customer.update({
    where: { id: customerId },
    data: { tags },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PREFERENCES — actualitzar preferències del client
// ═══════════════════════════════════════════════════════════════════════════

export interface CustomerPreferences {
  musicStyles?: string[];
  preferredVenues?: string[];
  specialNeeds?: string;
  dietaryRestrictions?: string;
  notes?: string;
}

export async function updateCustomerPreferences(
  customerId: string,
  preferences: CustomerPreferences,
) {
  return prisma.customer.update({
    where: { id: customerId },
    data: { preferences: preferences as Prisma.JsonObject },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTS — consultes predefinides
// ═══════════════════════════════════════════════════════════════════════════

interface SegmentFilter {
  lifecycleStage?: CustomerLifecycle;
  tag?: string;
  healthScoreMax?: number;
  healthScoreMin?: number;
  minSpent?: number;
  maxSpent?: number;
  createdAfter?: Date;
}

export async function querySegment(filter: SegmentFilter, page = 1, limit = 50) {
  const where: Prisma.CustomerWhereInput = {};

  if (filter.lifecycleStage) where.lifecycleStage = filter.lifecycleStage;
  if (filter.tag) where.tags = { has: filter.tag };
  if (filter.healthScoreMin != null || filter.healthScoreMax != null) {
    where.healthScore = {};
    if (filter.healthScoreMin != null) where.healthScore.gte = filter.healthScoreMin;
    if (filter.healthScoreMax != null) where.healthScore.lte = filter.healthScoreMax;
  }
  if (filter.minSpent != null) where.totalSpent = { gte: filter.minSpent };
  if (filter.maxSpent != null) {
    where.totalSpent = { ...(where.totalSpent as Record<string, number> || {}), lte: filter.maxSpent };
  }
  if (filter.createdAfter) where.createdAt = { gte: filter.createdAfter };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { totalSpent: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tags: true,
        lifecycleStage: true,
        healthScore: true,
        totalEvents: true,
        totalSpent: true,
        lastEventDate: true,
        createdAt: true,
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Retorna comptadors per cada lifecycle stage (per KPIs).
 */
export async function getLifecycleDistribution() {
  const result = await prisma.customer.groupBy({
    by: ['lifecycleStage'],
    _count: { id: true },
  });

  const distribution: Record<string, number> = {};
  for (const row of result) {
    distribution[row.lifecycleStage] = row._count.id;
  }
  return distribution;
}

/**
 * Retorna els tags més usats amb comptadors.
 */
export async function getTopTags(limit = 20): Promise<Array<{ tag: string; count: number }>> {
  // Prisma no suporta unnest natiu, fem servir raw SQL
  const result = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
    SELECT unnest(tags) as tag, COUNT(*) as count
    FROM customers
    WHERE array_length(tags, 1) > 0
    GROUP BY tag
    ORDER BY count DESC
    LIMIT ${limit}
  `;

  return result.map((r) => ({ tag: r.tag, count: Number(r.count) }));
}

/**
 * Retorna el resum de health score distribution (per gràfica).
 */
export async function getHealthDistribution() {
  const result = await prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
    SELECT
      CASE
        WHEN "healthScore" >= 80 THEN 'EXCELLENT'
        WHEN "healthScore" >= 60 THEN 'GOOD'
        WHEN "healthScore" >= 40 THEN 'FAIR'
        WHEN "healthScore" >= 20 THEN 'AT_RISK'
        WHEN "healthScore" IS NOT NULL THEN 'CRITICAL'
        ELSE 'NO_DATA'
      END as bucket,
      COUNT(*) as count
    FROM customers
    GROUP BY bucket
    ORDER BY
      CASE bucket
        WHEN 'EXCELLENT' THEN 1
        WHEN 'GOOD' THEN 2
        WHEN 'FAIR' THEN 3
        WHEN 'AT_RISK' THEN 4
        WHEN 'CRITICAL' THEN 5
        ELSE 6
      END
  `;

  return result.map((r) => ({ bucket: r.bucket, count: Number(r.count) }));
}
