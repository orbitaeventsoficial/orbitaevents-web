import type { BookingDTO, CustomerHubDTO, LeadDTO, TaskDTO, MessageDTO } from '@/lib/customer-hub/dto';

// ─── Types ──────────────────────────────────────────────────────────────

export type NextAction = {
  type: 'FOLLOW_UP' | 'SEND_PROPOSAL' | 'CONFIRM_BOOKING' | 'COLLECT_PAYMENT' | 'COMPLETE_TASK' | 'REACTIVATE' | 'REVIEW_PENDING' | 'NONE';
  label: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  context?: string;
};

export type RelationalHealth = 'EXCELLENT' | 'GOOD' | 'AT_RISK' | 'COLD' | 'LOST';

export type CustomerInsights = {
  nextAction: NextAction;
  commercialRisk: {
    level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    label: string;
    context?: string;
  };
  relationalHealth: RelationalHealth;
  ltv: number;
  recurrence: number;
  completedEvents: number;
  daysSinceLastContact: number | null;
  daysSinceLastEvent: number | null;
  daysUntilNextEvent: number | null;
  openTasksCount: number;
  pendingPaymentTotal: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────

function daysBetween(dateStr: string | undefined | null, now: Date): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string | undefined | null, now: Date): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function computeLTV(bookings: BookingDTO[]): number {
  return bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
}

function computeRecurrence(bookings: BookingDTO[]): number {
  return bookings.filter((b) => b.status === 'COMPLETED').length;
}

function computePendingPayment(bookings: BookingDTO[]): number {
  return bookings
    .filter((b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED')
    .reduce((sum, b) => {
      const total = b.totalAmount || 0;
      const deposit = b.depositAmount || 0;
      let paid = 0;
      if (b.depositPaid) paid += deposit;
      if (b.remainingPaid) paid += total - deposit;
      return sum + Math.max(0, total - paid);
    }, 0);
}

function deriveCommercialRisk(data: {
  followUpSummary?: CustomerHubDTO['followUpSummary'];
  daysSinceLastContact: number | null;
  hasActiveRelationship: boolean;
}): CustomerInsights['commercialRisk'] {
  const followUpSummary = data.followUpSummary;
  if (followUpSummary?.urgent) {
    return {
      level: 'HIGH',
      label: 'Risc comercial alt',
      context: `${followUpSummary.urgent} seguiment${followUpSummary.urgent > 1 ? 's' : ''} urgent${followUpSummary.urgent > 1 ? 's' : ''} sense resposta`,
    };
  }

  if (followUpSummary?.normal) {
    return {
      level: 'MEDIUM',
      label: 'Risc comercial actiu',
      context: `${followUpSummary.normal} seguiment${followUpSummary.normal > 1 ? 's' : ''} pendent${followUpSummary.normal > 1 ? 's' : ''}`,
    };
  }

  if (data.hasActiveRelationship && data.daysSinceLastContact !== null && data.daysSinceLastContact > 30) {
    return {
      level: data.daysSinceLastContact > 60 ? 'HIGH' : 'MEDIUM',
      label: data.daysSinceLastContact > 60 ? 'Risc de refredament' : 'Relació en refredament',
      context: `Sense contacte fa ${data.daysSinceLastContact} dies`,
    };
  }

  if (followUpSummary?.low) {
    return {
      level: 'LOW',
      label: 'Seguiment a vigilar',
      context: `${followUpSummary.low} seguiment${followUpSummary.low > 1 ? 's' : ''} recent${followUpSummary.low > 1 ? 's' : ''} pendent${followUpSummary.low > 1 ? 's' : ''}`,
    };
  }

  return {
    level: 'NONE',
    label: 'Sense risc comercial actiu',
  };
}

// ─── Next Action Logic ──────────────────────────────────────────────────

function deriveNextAction(data: {
  leads: LeadDTO[];
  bookings: BookingDTO[];
  tasks: TaskDTO[];
  messages: MessageDTO[];
  commSummary: CustomerHubDTO['commSummary'];
  daysSinceLastContact: number | null;
  pendingPaymentTotal: number;
  now: Date;
}): NextAction {
  const { leads, bookings, tasks, commSummary, daysSinceLastContact, pendingPaymentTotal } = data;

  // 1. Overdue tasks → highest priority
  const overdueTasks = tasks.filter((t) => !t.done && t.dueDate && new Date(t.dueDate) < data.now);
  if (overdueTasks.length > 0) {
    return {
      type: 'COMPLETE_TASK',
      label: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'tasca vençuda' : 'tasques vençudes'}`,
      urgency: 'HIGH',
      context: overdueTasks[0].title,
    };
  }

  // 2. Pending payment on active bookings
  if (pendingPaymentTotal > 0) {
    const unpaidBooking = bookings.find((b) =>
      b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && !b.remainingPaid,
    );
    if (unpaidBooking) {
      return {
        type: 'COLLECT_PAYMENT',
        label: `Cobrament pendent: ${pendingPaymentTotal.toLocaleString('ca-ES')}€`,
        urgency: 'HIGH',
        context: unpaidBooking.reference,
      };
    }
  }

  // 3. Client has replied and is waiting on us
  if (commSummary.pendingResponseFrom === 'TEAM') {
    const channelLabel = commSummary.lastContactChannel === 'WHATSAPP'
      ? 'WhatsApp'
      : commSummary.lastContactChannel === 'CALL'
        ? 'trucada'
        : 'email';
    return {
      type: 'FOLLOW_UP',
      label: 'Respondre al client',
      urgency: 'HIGH',
      context: `Últim toc entrant per ${channelLabel}`,
    };
  }

  // 4. Lead in negotiation without proposal
  const negotiatingLeads = leads.filter((l) =>
    l.status === 'NEGOTIATING' || l.status === 'CONTACTED',
  );
  if (negotiatingLeads.length > 0) {
    const hasProposalForLead = negotiatingLeads.some((l) => l.booking);
    if (!hasProposalForLead) {
      return {
        type: 'SEND_PROPOSAL',
        label: 'Enviar pressupost',
        urgency: 'MEDIUM',
        context: negotiatingLeads[0].name,
      };
    }
  }

  // 5. Quote sent but not confirmed
  const quoteSentLeads = leads.filter((l) => l.status === 'QUOTE_SENT');
  if (quoteSentLeads.length > 0) {
    return {
      type: 'FOLLOW_UP',
      label: 'Seguiment de pressupost',
      urgency: 'MEDIUM',
      context: quoteSentLeads[0].name,
    };
  }

  // 6. Post-event booking without review
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  if (completedBookings.length > 0) {
    return {
      type: 'REVIEW_PENDING',
      label: 'Sol·licitar ressenya',
      urgency: 'LOW',
    };
  }

  // 7. No contact in 30+ days with active relationship
  if (daysSinceLastContact !== null && daysSinceLastContact > 30) {
    const hasActiveRelationship = leads.some((l) =>
      !['LOST', 'DISQUALIFIED'].includes(l.status),
    ) || bookings.some((b) => !['CANCELLED', 'COMPLETED'].includes(b.status));

    if (hasActiveRelationship) {
      return {
        type: 'REACTIVATE',
        label: `Sense contacte fa ${daysSinceLastContact} dies`,
        urgency: daysSinceLastContact > 60 ? 'HIGH' : 'MEDIUM',
      };
    }
  }

  // 8. Pending open tasks
  const openTasks = tasks.filter((t) => !t.done);
  if (openTasks.length > 0) {
    return {
      type: 'COMPLETE_TASK',
      label: `${openTasks.length} ${openTasks.length === 1 ? 'tasca pendent' : 'tasques pendents'}`,
      urgency: 'LOW',
      context: openTasks[0].title,
    };
  }

  return { type: 'NONE', label: 'Cap acció pendent', urgency: 'LOW' };
}

// ─── Relational Health ──────────────────────────────────────────────────

function deriveRelationalHealth(data: {
  status: string;
  recurrence: number;
  daysSinceLastContact: number | null;
  healthScore: number | null | undefined;
  openTasksCount: number;
}): RelationalHealth {
  if (data.status === 'LOST') return 'LOST';

  // Explicit healthScore overrides
  if (typeof data.healthScore === 'number') {
    if (data.healthScore >= 80) return 'EXCELLENT';
    if (data.healthScore >= 50) return 'GOOD';
    if (data.healthScore >= 25) return 'AT_RISK';
    return 'COLD';
  }

  // Heuristic
  if (data.recurrence >= 2 && (data.daysSinceLastContact === null || data.daysSinceLastContact < 60)) {
    return 'EXCELLENT';
  }
  if (data.daysSinceLastContact !== null && data.daysSinceLastContact > 90) return 'COLD';
  if (data.daysSinceLastContact !== null && data.daysSinceLastContact > 45) return 'AT_RISK';
  return 'GOOD';
}

// ─── Main ───────────────────────────────────────────────────────────────

export function computeCustomerInsights(hub: CustomerHubDTO, now = new Date()): CustomerInsights {
  const ltv = computeLTV(hub.bookings);
  const recurrence = computeRecurrence(hub.bookings);
  const completedEvents = recurrence;
  const openTasksCount = hub.tasks.filter((t) => !t.done).length;
  const pendingPaymentTotal = computePendingPayment(hub.bookings);

  const daysSinceLastContact = daysBetween(
    hub.kpis.lastContactAt || hub.customer.lastContactedAt,
    now,
  );

  const completedBookingDates = hub.bookings
    .filter((b) => b.status === 'COMPLETED' && b.date)
    .map((b) => b.date!)
    .sort((a, b) => (a > b ? -1 : 1));
  const daysSinceLastEvent = daysBetween(completedBookingDates[0], now);

  const daysUntilNextEvent = daysUntil(hub.kpis.nextEventDate, now);
  const hasActiveRelationship = hub.leads.some((l) =>
    !['LOST', 'DISQUALIFIED'].includes(l.status),
  ) || hub.bookings.some((b) => !['CANCELLED', 'COMPLETED'].includes(b.status));

  const nextAction = deriveNextAction({
    leads: hub.leads,
    bookings: hub.bookings,
    tasks: hub.tasks,
    messages: hub.messages,
    commSummary: hub.commSummary,
    daysSinceLastContact,
    pendingPaymentTotal,
    now,
  });
  const commercialRisk = deriveCommercialRisk({
    followUpSummary: hub.followUpSummary,
    daysSinceLastContact,
    hasActiveRelationship,
  });

  const relationalHealth = deriveRelationalHealth({
    status: hub.customer.status,
    recurrence,
    daysSinceLastContact,
    healthScore: hub.customer.healthScore,
    openTasksCount,
  });

  return {
    nextAction,
    commercialRisk,
    relationalHealth,
    ltv,
    recurrence,
    completedEvents,
    daysSinceLastContact,
    daysSinceLastEvent,
    daysUntilNextEvent,
    openTasksCount,
    pendingPaymentTotal,
  };
}
