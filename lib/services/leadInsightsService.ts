import { formatCurrencyExact } from '@/lib/constants';
import { scoreLead, estimateLeadAmount } from '@/lib/services/commercialScoring';

// ─── Types ──────────────────────────────────────────────────────────────

type LeadInput = {
  id: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  contactedAt: Date | null;
  convertedAt: Date | null;
  eventDate: Date | null;
  eventType: string;
  budget: string | null;
  phone: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  interestedPackId: string | null;
  source: string | null;
};

type TaskLite = {
  status: string;
  dueDate: Date | null;
  title: string;
};

type ActivityLite = {
  createdAt: Date;
  type: string;
};

type BookingLite = {
  status: string;
  total: number | null;
  depositPaid: boolean | null;
  remainingPaid: boolean | null;
  depositAmount: number | null;
} | null;

type RelatedLeadLite = {
  status: string;
  booking: { total: number | null } | null;
};

export type LeadNextAction = {
  type: 'CONTACT_NOW' | 'FOLLOW_UP' | 'SEND_QUOTE' | 'CLOSE_DEAL' | 'COLLECT_PAYMENT' | 'COMPLETE_TASK' | 'RE_ENGAGE' | 'NONE';
  label: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  context?: string;
};

export type LossRisk = {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  reasons: string[];
};

export type CommercialContext = {
  isRecurringClient: boolean;
  previousEventsCount: number;
  previousTotalSpent: number;
  estimatedDealValue: number;
  daysSinceCreation: number;
  daysSinceLastActivity: number | null;
  daysSinceContact: number | null;
  daysUntilEvent: number | null;
};

export type LeadInsights = {
  score: number;
  scoreBand: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  scoreReasons: string[];
  nextAction: LeadNextAction;
  lossRisk: LossRisk;
  commercial: CommercialContext;
};

// ─── Helpers ────────────────────────────────────────────────────────────

function daysBetween(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Next Action ────────────────────────────────────────────────────────

function deriveNextAction(input: {
  lead: LeadInput;
  tasks: TaskLite[];
  booking: BookingLite;
  daysSinceContact: number | null;
  daysSinceLastActivity: number | null;
  now: Date;
}): LeadNextAction {
  const { lead, tasks, booking, daysSinceContact, daysSinceLastActivity } = input;

  if (lead.status === 'WON' || lead.status === 'LOST') {
    return { type: 'NONE', label: 'Entrada tancada', urgency: 'LOW' };
  }

  // 1. Overdue tasks
  const overdue = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED' && t.dueDate && t.dueDate < input.now);
  if (overdue.length > 0) {
    return {
      type: 'COMPLETE_TASK',
      label: `${overdue.length} ${overdue.length === 1 ? 'tasca vençuda' : 'tasques vençudes'}`,
      urgency: 'HIGH',
      context: overdue[0].title,
    };
  }

  // 2. New lead not contacted
  if (lead.status === 'NEW') {
    const hoursOld = (input.now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60);
    return {
      type: 'CONTACT_NOW',
      label: hoursOld > 4 ? 'Contactar urgentment' : 'Primer contacte',
      urgency: hoursOld > 4 ? 'HIGH' : 'MEDIUM',
    };
  }

  // 3. Payment pending on booking
  if (booking && !['CANCELLED', 'COMPLETED'].includes(booking.status)) {
    const total = booking.total || 0;
    const deposit = booking.depositAmount || 0;
    let paid = 0;
    if (booking.depositPaid) paid += deposit;
    if (booking.remainingPaid) paid += total - deposit;
    const pending = Math.max(0, total - paid);
    if (pending > 0) {
      return {
        type: 'COLLECT_PAYMENT',
        label: `Cobrament pendent: ${formatCurrencyExact(pending)}`,
        urgency: 'HIGH',
      };
    }
  }

  // 4. Contacted but no quote sent
  if (lead.status === 'CONTACTED' || lead.status === 'NEGOTIATING') {
    return {
      type: 'SEND_QUOTE',
      label: 'Enviar pressupost',
      urgency: 'MEDIUM',
    };
  }

  // 5. Quote sent — follow up
  if (lead.status === 'QUOTE_SENT') {
    const stale = daysSinceLastActivity !== null && daysSinceLastActivity > 3;
    return {
      type: 'FOLLOW_UP',
      label: stale ? 'Seguiment urgent del pressupost' : 'Seguiment del pressupost',
      urgency: stale ? 'HIGH' : 'MEDIUM',
    };
  }

  // 6. Visited/qualified — close deal
  if (lead.status === 'VISIT_DONE' || lead.status === 'QUALIFIED') {
    return {
      type: 'CLOSE_DEAL',
      label: 'Tancar acord',
      urgency: 'MEDIUM',
    };
  }

  // 7. No activity for a while
  if (daysSinceLastActivity !== null && daysSinceLastActivity > 7) {
    return {
      type: 'RE_ENGAGE',
      label: `Sense activitat fa ${daysSinceLastActivity} dies`,
      urgency: daysSinceLastActivity > 14 ? 'HIGH' : 'MEDIUM',
    };
  }

  return { type: 'NONE', label: 'Cap acció pendent', urgency: 'LOW' };
}

// ─── Loss Risk ──────────────────────────────────────────────────────────

function deriveLossRisk(input: {
  lead: LeadInput;
  scoreRiskFlags: string[];
  daysSinceLastActivity: number | null;
  daysSinceContact: number | null;
  daysUntilEvent: number | null;
  now: Date;
}): LossRisk {
  const { lead, scoreRiskFlags, daysSinceLastActivity, daysSinceContact, daysUntilEvent, now } = input;
  const reasons: string[] = [...scoreRiskFlags];

  if (['WON', 'LOST'].includes(lead.status)) {
    return { level: 'NONE', reasons: [] };
  }

  // Stale lead
  if (daysSinceLastActivity !== null && daysSinceLastActivity > 7) {
    reasons.push(`Sense activitat fa ${daysSinceLastActivity} dies`);
  }

  // Never contacted
  if (!lead.contactedAt && lead.status === 'NEW') {
    const hoursOld = (now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) reasons.push('Més de 24h sense contactar');
  }

  // Event approaching without confirmation
  if (daysUntilEvent !== null && daysUntilEvent >= 0 && daysUntilEvent <= 14 && !['WON'].includes(lead.status)) {
    reasons.push(`Esdeveniment en ${daysUntilEvent} dies sense confirmar`);
  }

  // Event already past
  if (daysUntilEvent !== null && daysUntilEvent < 0) {
    reasons.push('Esdeveniment ja passat');
  }

  // No contact in long time
  if (daysSinceContact !== null && daysSinceContact > 14) {
    reasons.push(`Sense contacte fa ${daysSinceContact} dies`);
  }

  const highCount = reasons.length;
  const level: LossRisk['level'] = highCount >= 3 ? 'HIGH' : highCount >= 1 ? 'MEDIUM' : 'LOW';

  return { level, reasons };
}

// ─── Main ───────────────────────────────────────────────────────────────

export function computeLeadInsights(input: {
  lead: LeadInput;
  tasks: TaskLite[];
  activities: ActivityLite[];
  booking: BookingLite;
  relatedLeads: RelatedLeadLite[];
  now?: Date;
}): LeadInsights {
  const now = input.now || new Date();

  const score = scoreLead({ ...input.lead, now });
  const estimatedDealValue = estimateLeadAmount({
    budget: input.lead.budget,
    eventType: input.lead.eventType,
  });

  const daysSinceCreation = Math.max(0, Math.floor((now.getTime() - input.lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const lastActivityDate = input.activities.length > 0 ? input.activities[0].createdAt : null;
  const daysSinceLastActivity = daysBetween(lastActivityDate, now);
  const daysSinceContact = daysBetween(input.lead.contactedAt, now);
  const daysUntilEvent = daysUntil(input.lead.eventDate, now);

  const previousCompletedLeads = input.relatedLeads.filter((r) => r.status === 'WON' || (r.booking && r.booking.total));
  const isRecurringClient = previousCompletedLeads.length > 0;
  const previousTotalSpent = previousCompletedLeads.reduce((sum, r) => sum + (r.booking?.total || 0), 0);

  const nextAction = deriveNextAction({
    lead: input.lead,
    tasks: input.tasks,
    booking: input.booking,
    daysSinceContact,
    daysSinceLastActivity,
    now,
  });

  const lossRisk = deriveLossRisk({
    lead: input.lead,
    scoreRiskFlags: score.riskFlags,
    daysSinceLastActivity,
    daysSinceContact,
    daysUntilEvent,
    now,
  });

  return {
    score: score.score,
    scoreBand: score.band,
    probability: score.probability,
    scoreReasons: score.reasons,
    nextAction,
    lossRisk,
    commercial: {
      isRecurringClient,
      previousEventsCount: previousCompletedLeads.length,
      previousTotalSpent,
      estimatedDealValue,
      daysSinceCreation,
      daysSinceLastActivity,
      daysSinceContact,
      daysUntilEvent,
    },
  };
}
