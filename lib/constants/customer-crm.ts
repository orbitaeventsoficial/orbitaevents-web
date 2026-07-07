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
  POST_EVENT_RECURRENCE_DECIDED: 'POST_EVENT_RECURRENCE_DECIDED',
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
  NEW: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  PROSPECT: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  FIRST_TIME: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  RETURNING: 'admin-tone-border-violet admin-tone-bg-violet admin-tone-text-violet',
  VIP: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  DORMANT: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  CHURNED: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
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
  VIP: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  Corporatiu: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  Recurrent: 'admin-tone-border-violet admin-tone-bg-violet admin-tone-text-violet',
  'Alt valor': 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  Dormant: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  Referit: 'admin-tone-border-violet admin-tone-bg-violet admin-tone-text-violet',
  'Pagament lent': 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  'Molt satisfet': 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
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
  if (score >= 80) return 'admin-tone-text-success';
  if (score >= 60) return 'admin-tone-text-cyan';
  if (score >= 40) return 'admin-tone-text-warning';
  return 'admin-tone-text-danger';
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
