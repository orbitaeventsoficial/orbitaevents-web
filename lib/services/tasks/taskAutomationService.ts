// lib/services/tasks/taskAutomationService.ts
// ═══════════════════════════════════════════════════════════════════════════
// TASK AUTOMATION SERVICE
// Genera tasques intel·ligents vinculades a entitats concretes basant-se
// en condicions operatives detectades. Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { OPEN_TASK_STATUSES, TASK_DEDUPE_KEY } from '@/lib/constants';
import { TASK_AUTOMATION_THRESHOLDS } from '@/lib/constants/automationThresholds';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type AutoTaskRule = 'SLA_BROKEN' | 'STALE_LEAD' | 'BOOKING_PREP' | 'PAYMENT_OVERDUE' | 'POST_EVENT' | 'AT_RISK_CLIENT' | 'QUOTE_FOLLOWUP';

export type AutoTaskProposal = {
  rule: AutoTaskRule;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: Date;
  leadId: string | null;
  customerId: string | null;
  bookingId: string | null;
  entityName: string;
  dedupeKey: string;
};

export type AutoTaskResult = {
  proposed: number;
  created: number;
  skipped: number;
  proposals: AutoTaskProposal[];
};

export type AutoTaskEntity = {
  id: string;
  name: string;
  leadId?: string | null;
  customerId?: string | null;
  bookingId?: string | null;
};

export type AutoTaskInput = {
  slaLeads: AutoTaskEntity[];
  staleLeads: AutoTaskEntity[];
  bookingsToPrep: AutoTaskEntity[];
  overduePayments: AutoTaskEntity[];
  postEventPending: AutoTaskEntity[];
  atRiskClients: AutoTaskEntity[];
  quoteFollowups: AutoTaskEntity[];
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateAutoTasks(input: AutoTaskInput): AutoTaskProposal[] {
  const { now } = input;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0, 0);
  const proposals: AutoTaskProposal[] = [];

  // SLA broken: leads sense resposta >24h
  for (const e of input.slaLeads) {
    proposals.push({
      rule: 'SLA_BROKEN',
      title: `Contactar urgentment: ${e.name}`,
      description: `Lead sense resposta +24h. Contactar avui per no perdre l'oportunitat.`,
      priority: 'URGENT',
      dueDate: today,
      leadId: e.id,
      customerId: null,
      bookingId: null,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.sla(e.id),
    });
  }

  // Stale leads: sense moviment >7d
  for (const e of input.staleLeads) {
    proposals.push({
      rule: 'STALE_LEAD',
      title: `Decidir lead estancat: ${e.name}`,
      description: `Lead sense moviment >7 dies. Avançar, reactivar o tancar.`,
      priority: 'MEDIUM',
      dueDate: tomorrow,
      leadId: e.id,
      customerId: null,
      bookingId: null,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.stale(e.id),
    });
  }

  // Booking prep: reserves en 3 dies sense preparació
  for (const e of input.bookingsToPrep) {
    proposals.push({
      rule: 'BOOKING_PREP',
      title: `Preparar reserva: ${e.name}`,
      description: `Reserva en 3 dies o menys. Verificar logística, inventari i confirmació.`,
      priority: 'HIGH',
      dueDate: today,
      leadId: null,
      customerId: e.customerId ?? null,
      bookingId: e.id,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.prep(e.id),
    });
  }

  // Overdue payments
  for (const e of input.overduePayments) {
    proposals.push({
      rule: 'PAYMENT_OVERDUE',
      title: `Cobrar pagament: ${e.name}`,
      description: `Pagament pendent vençut. Enviar recordatori o gestionar cobrament.`,
      priority: 'HIGH',
      dueDate: today,
      leadId: null,
      customerId: e.customerId ?? null,
      bookingId: e.id,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.payment(e.id),
    });
  }

  // Post-event pending
  for (const e of input.postEventPending) {
    proposals.push({
      rule: 'POST_EVENT',
      title: `Post-event: ${e.name}`,
      description: `Enviar seguiment post-event, demanar feedback i tancar el cicle.`,
      priority: 'MEDIUM',
      dueDate: tomorrow,
      leadId: null,
      customerId: e.customerId ?? null,
      bookingId: e.id,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.postEvent(e.id),
    });
  }

  // At-risk clients
  for (const e of input.atRiskClients) {
    proposals.push({
      rule: 'AT_RISK_CLIENT',
      title: `Atenció client en risc: ${e.name}`,
      description: `Health score baix. Contactar per retenir i millorar la relació.`,
      priority: 'MEDIUM',
      dueDate: tomorrow,
      leadId: null,
      customerId: e.id,
      bookingId: null,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.atRisk(e.id),
    });
  }

  // Quote followup
  for (const e of input.quoteFollowups) {
    proposals.push({
      rule: 'QUOTE_FOLLOWUP',
      title: `Seguiment pressupost: ${e.name}`,
      description: `Pressupost enviat fa >3 dies sense resposta. Fer seguiment actiu.`,
      priority: 'HIGH',
      dueDate: today,
      leadId: e.id,
      customerId: null,
      bookingId: null,
      entityName: e.name,
      dedupeKey: TASK_DEDUPE_KEY.quote(e.id),
    });
  }

  return proposals;
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function runTaskAutomation(now: Date = new Date()): Promise<AutoTaskResult> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysAhead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TASK_AUTOMATION_THRESHOLDS.bookingPrepDaysAhead);
  const slaThreshold = new Date(now.getTime() - TASK_AUTOMATION_THRESHOLDS.slaBrokenMs);
  const staleThreshold = new Date(now.getTime() - TASK_AUTOMATION_THRESHOLDS.staleLeadMs);
  const quoteFollowupThreshold = new Date(now.getTime() - TASK_AUTOMATION_THRESHOLDS.quoteFollowupMs);

  const [slaLeads, staleLeads, bookingsToPrep, overduePayments, postEventPending, atRiskClients, quoteFollowups] = await Promise.all([
    prisma.lead.findMany({
      where: { status: 'NEW', createdAt: { lte: slaThreshold } },
      select: { id: true, name: true },
      take: 20,
    }),
    prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED'] }, updatedAt: { lt: staleThreshold } },
      select: { id: true, name: true },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'PREPARING'] }, eventDate: { gte: todayStart, lt: threeDaysAhead } },
      select: { id: true, eventLocation: true, customerId: true },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, remainingPaid: false, eventDate: { lt: todayStart } },
      select: { id: true, eventLocation: true, customerId: true },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { status: 'COMPLETED', postEventEmailSent: false, eventDate: { lt: todayStart } },
      select: { id: true, eventLocation: true, customerId: true },
      take: 20,
    }),
    prisma.customer.findMany({
      where: { healthScore: { lte: TASK_AUTOMATION_THRESHOLDS.atRiskHealthScoreMax } },
      select: { id: true, name: true },
      take: 20,
    }),
    prisma.lead.findMany({
      where: { status: 'QUOTE_SENT', updatedAt: { lt: quoteFollowupThreshold } },
      select: { id: true, name: true },
      take: 20,
    }),
  ]);

  const proposals = generateAutoTasks({
    slaLeads: slaLeads.map((l) => ({ id: l.id, name: l.name })),
    staleLeads: staleLeads.map((l) => ({ id: l.id, name: l.name })),
    bookingsToPrep: bookingsToPrep.map((b) => ({ id: b.id, name: b.eventLocation ?? 'Reserva', customerId: b.customerId })),
    overduePayments: overduePayments.map((b) => ({ id: b.id, name: b.eventLocation ?? 'Reserva', customerId: b.customerId })),
    postEventPending: postEventPending.map((b) => ({ id: b.id, name: b.eventLocation ?? 'Reserva', customerId: b.customerId })),
    atRiskClients: atRiskClients.map((c) => ({ id: c.id, name: c.name })),
    quoteFollowups: quoteFollowups.map((l) => ({ id: l.id, name: l.name })),
    now,
  });

  // Dedup against existing open tasks by canonical dedupeKey column
  const existingTasks = await prisma.task.findMany({
    where: {
      source: 'AUTOMATION',
      status: { in: [...OPEN_TASK_STATUSES] },
      dedupeKey: { in: proposals.map((p) => p.dedupeKey) },
    },
    select: { dedupeKey: true },
  });
  const existingKeys = new Set(
    existingTasks.map((t) => t.dedupeKey).filter((k): k is string => Boolean(k))
  );

  const toCreate = proposals.filter((p) => !existingKeys.has(p.dedupeKey));
  const skipped = proposals.length - toCreate.length;

  if (toCreate.length > 0) {
    await prisma.task.createMany({
      data: toCreate.map((p) => ({
        title: p.title,
        description: p.description,
        priority: p.priority,
        dueDate: p.dueDate,
        leadId: p.leadId,
        customerId: p.customerId,
        bookingId: p.bookingId,
        status: 'OPEN',
        createdBy: 'system:auto',
        source: 'AUTOMATION',
        autoRule: p.rule,
        dedupeKey: p.dedupeKey,
      })),
      skipDuplicates: true,
    });
  }

  return {
    proposed: proposals.length,
    created: toCreate.length,
    skipped,
    proposals,
  };
}
