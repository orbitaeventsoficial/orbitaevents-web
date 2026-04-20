export const CUSTOMER_DORMANT_MONTHS = 6;
export const CUSTOMER_CHURNED_MONTHS = 12;

export const CUSTOMER_ANONYMIZED_NAME = 'Client anonimitzat';
export const CUSTOMER_ANONYMIZED_NAME_NORMALIZED = 'client anonimitzat';

export function buildAnonymizedEmail(id: string): string {
  return `anon+${id}@deleted.orbitaevents.local`;
}

export const CUSTOMER_ACTIVITY_ACTIONS = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_CONVERTED: 'LEAD_CONVERTED',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  INITIAL_NOTES: 'INITIAL_NOTES',
  DUPLICATE_WARNING: 'DUPLICATE_WARNING',
  CUSTOMERS_MERGED: 'CUSTOMERS_MERGED',
  QUOTE_SENT: 'QUOTE_SENT',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  EMAIL_SENT: 'EMAIL_SENT',
  BOOKING_CREATED: 'BOOKING_CREATED',
  PORTAL_AUTO_CREATED: 'PORTAL_AUTO_CREATED',
  PAYMENT_REMINDER_SENT: 'PAYMENT_REMINDER_SENT',
  POST_EVENT_EMAIL_SENT: 'POST_EVENT_EMAIL_SENT',
  SEND_POST_EVENT_EMAIL: 'SEND_POST_EVENT_EMAIL',
  TESTIMONIAL_SUBMITTED: 'TESTIMONIAL_SUBMITTED',
} as const;

export const CUSTOMER_LIFECYCLE_VALUES = ['NEW', 'PROSPECT', 'FIRST_TIME', 'RETURNING', 'VIP', 'DORMANT', 'CHURNED'] as const;
export type CustomerLifecycleValue = (typeof CUSTOMER_LIFECYCLE_VALUES)[number];

export const CUSTOMER_LIFECYCLE_LABELS: Record<CustomerLifecycleValue, string> = {
  NEW: 'Nou',
  PROSPECT: 'Prospecte',
  FIRST_TIME: 'Primer event',
  RETURNING: 'Recurrent',
  VIP: 'VIP',
  DORMANT: 'Dormant',
  CHURNED: 'Perdut',
};

export const CUSTOMER_LIFECYCLE_COLORS: Record<CustomerLifecycleValue, string> = {
  NEW: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  PROSPECT: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  FIRST_TIME: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  RETURNING: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  VIP: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  DORMANT: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  CHURNED: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
};

export const CUSTOMER_LIFECYCLE_ICONS: Record<CustomerLifecycleValue, string> = {
  NEW: '🆕',
  PROSPECT: '🎯',
  FIRST_TIME: '✨',
  RETURNING: '🔁',
  VIP: '👑',
  DORMANT: '💤',
  CHURNED: '📪',
};

export const CUSTOMER_TAG_PRESETS = [
  'VIP',
  'Corporatiu',
  'Recurrent',
  'Alt valor',
  'Dormant',
  'Referit',
  'Pagament lent',
  'Molt satisfet',
] as const;

export const CUSTOMER_TAG_DEFAULT_COLOR = 'border-white/10 bg-white/5 text-white/70';

export const CUSTOMER_TAG_COLORS: Record<string, string> = {
  VIP: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  Corporatiu: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  Recurrent: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  'Alt valor': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  Dormant: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  Referit: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200',
  'Pagament lent': 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  'Molt satisfet': 'border-teal-500/30 bg-teal-500/10 text-teal-200',
};

export function getHealthLabel(score: number | null | undefined): string {
  if (score == null) return 'Sense dada';
  if (score >= 80) return 'Excel.lent';
  if (score >= 60) return 'Bo';
  if (score >= 40) return 'Atencio';
  return 'Critic';
}

export function getHealthColor(score: number | null | undefined): string {
  if (score == null) return 'text-white/40';
  if (score >= 80) return 'text-emerald-300';
  if (score >= 60) return 'text-cyan-300';
  if (score >= 40) return 'text-amber-300';
  return 'text-rose-300';
}

export const EXECUTION_PRIORITY_HINTS = {
  VIP: 'Client VIP amb impacte comercial alt.',
  RECENT_LEAD: 'Contacte molt recent: no deixar-lo refredar.',
  ACTIVE_OPPORTUNITY: 'Encara està en finestra de conversio activa.',
  RECURRING_POTENTIAL: 'Pot repetir si proposes el seguent pas correcte.',
  LOW_URGENCY: 'Sense finestra clara ara mateix; manteniment suau.',
} as const;

export const CUSTOMER_NEXT_STEPS = {
  POST_EVENT: {
    label: 'Obrir post-esdeveniment',
    href: '/admin/post-event',
    hint: 'Tanca feedback, testimoni i seguiment de recurrencia.',
  },
  CREATE_QUOTE: {
    label: 'Crear pressupost',
    hrefTemplate: '/admin/presupuestos?customerId=',
    hint: 'Converteix el client en oportunitat comercial activa.',
  },
} as const;

export const CUSTOMER_SEGMENTS = [
  { id: 'vip', label: 'VIP', icon: '👑', filter: { lifecycleStage: 'VIP' as CustomerLifecycleValue } },
  { id: 'dormant', label: 'Dormants', icon: '💤', filter: { lifecycleStage: 'DORMANT' as CustomerLifecycleValue } },
  { id: 'at-risk', label: 'En risc', icon: '⚠️', filter: { healthScoreMax: 40 } },
  { id: 'high-value', label: 'Alt valor', icon: '💎', filter: { minSpent: 2000 } },
  { id: 'corporatiu', label: 'Corporatiu', icon: '💼', filter: { tag: 'Corporatiu' } },
] as const;
