/**
 * Tipus, constants i helpers purs per la gestió de clients.
 * Extret de clientes/page.tsx per reduir la mida del component.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  customerNumber?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  instagram?: string | null;
  source?: string;
  total_events: number;
  total_spent: number;
  is_vip: boolean;
  created_at: string;
  // CRM Potenciat
  tags?: string[];
  lifecycleStage?: string;
  healthScore?: number | null;
}

export interface CustomerStats {
  total: number;
  vip: number;
  withEvents: number;
  recentMonth: number;
  dormant?: number;
  atRisk?: number;
  highValue?: number;
}

export type ExecutionPriority = 'ALTA' | 'MITJANA' | 'BAIXA';

export interface CustomerHubOperatingSummary {
  totalVisible: number;
  totalKnown: number;
  withEventHistory: number;
  activeOpportunities: number;
  highPriority: number;
  atRisk: number;
  dormant: number;
  missingContactChannel: number;
  tone: 'info' | 'warning' | 'success';
  systemItems: string[];
  manualItems: string[];
  nextStep: {
    title: string;
    detail: string;
    href: string;
    ctaLabel: string;
  };
}

export interface CustomerSegmentFilterState {
  lifecycleStage: CustomerLifecycleValue | '';
  tag: string;
  healthScoreMax: number | null;
  minSpent: number | null;
}

export { PRIORITY_FILTER_STYLES } from '@/lib/constants';
import {
  CUSTOMER_NEXT_STEPS,
  CUSTOMER_SEGMENTS,
  EXECUTION_PRIORITY_HINTS,
  type CustomerLifecycleValue,
} from '@/lib/constants';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function resolveCustomerSegmentFilter(segmentId: string | null | undefined): CustomerSegmentFilterState | null {
  const segment = CUSTOMER_SEGMENTS.find((item) => item.id === segmentId);
  if (!segment) return null;

  const filter = segment.filter;
  return {
    lifecycleStage: 'lifecycleStage' in filter ? filter.lifecycleStage : '',
    tag: 'tag' in filter ? filter.tag : '',
    healthScoreMax: 'healthScoreMax' in filter ? filter.healthScoreMax : null,
    minSpent: 'minSpent' in filter ? filter.minSpent : null,
  };
}

export function getNextStep(customer: Customer): { label: string; href: string; hint: string } {
  if ((customer.total_events || 0) > 0) {
    return {
      label: CUSTOMER_NEXT_STEPS.POST_EVENT.label,
      href: CUSTOMER_NEXT_STEPS.POST_EVENT.href,
      hint: CUSTOMER_NEXT_STEPS.POST_EVENT.hint,
    };
  }

  return {
    label: CUSTOMER_NEXT_STEPS.CREATE_QUOTE.label,
    href: `${CUSTOMER_NEXT_STEPS.CREATE_QUOTE.hrefTemplate}${encodeURIComponent(customer.id)}`,
    hint: CUSTOMER_NEXT_STEPS.CREATE_QUOTE.hint,
  };
}

export function getExecutionPriority(customer: Customer): { level: ExecutionPriority; score: number; hint: string } {
  const createdAt = customer.created_at ? new Date(customer.created_at) : new Date();
  const daysSinceCreated = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const hasContactChannel = Boolean(customer.email || customer.phone);

  if (customer.is_vip) {
    return { level: 'ALTA', score: 100, hint: EXECUTION_PRIORITY_HINTS.VIP };
  }
  if ((customer.total_events || 0) === 0 && hasContactChannel && daysSinceCreated <= 3) {
    return { level: 'ALTA', score: 90, hint: EXECUTION_PRIORITY_HINTS.RECENT_LEAD };
  }
  if ((customer.total_events || 0) === 0 && daysSinceCreated <= 14) {
    return { level: 'MITJANA', score: 60, hint: EXECUTION_PRIORITY_HINTS.ACTIVE_OPPORTUNITY };
  }
  if ((customer.total_events || 0) > 0) {
    return { level: 'MITJANA', score: 50, hint: EXECUTION_PRIORITY_HINTS.RECURRING_POTENTIAL };
  }
  return { level: 'BAIXA', score: 20, hint: EXECUTION_PRIORITY_HINTS.LOW_URGENCY };
}

export function buildCustomerHubOperatingSummary(
  customers: Customer[],
  stats: CustomerStats | null,
): CustomerHubOperatingSummary {
  const prioritized = customers
    .map((customer) => ({ customer, priority: getExecutionPriority(customer) }))
    .sort((a, b) => b.priority.score - a.priority.score);
  const totalVisible = customers.length;
  const totalKnown = stats?.total ?? totalVisible;
  const withEventHistory = stats?.withEvents ?? customers.filter((customer) => (customer.total_events || 0) > 0).length;
  const activeOpportunities = customers.filter((customer) => (customer.total_events || 0) === 0 && Boolean(customer.email || customer.phone)).length;
  const highPriority = prioritized.filter((item) => item.priority.level === 'ALTA').length;
  const atRisk = stats?.atRisk ?? customers.filter((customer) => typeof customer.healthScore === 'number' && customer.healthScore <= 45).length;
  const dormant = stats?.dormant ?? customers.filter((customer) => customer.lifecycleStage === 'DORMANT').length;
  const missingContactChannel = customers.filter((customer) => !customer.email && !customer.phone).length;
  const focus = prioritized[0]?.customer ?? null;
  const focusPriority = prioritized[0]?.priority ?? null;
  const hasRisk = highPriority > 0 || atRisk > 0 || missingContactChannel > 0;
  const tone: CustomerHubOperatingSummary['tone'] = hasRisk ? 'warning' : totalVisible > 0 ? 'success' : 'info';

  return {
    totalVisible,
    totalKnown,
    withEventHistory,
    activeOpportunities,
    highPriority,
    atRisk,
    dormant,
    missingContactChannel,
    tone,
    systemItems: [
      `${totalVisible} clients visibles de ${totalKnown} totals al CRM.`,
      `${withEventHistory} clients amb historial d'esdeveniments i ${activeOpportunities} oportunitats sense esdeveniment encara.`,
      `${dormant} dormits i ${atRisk} en risc dins la lectura actual.`,
      `${missingContactChannel} clients no tenen canal directe complet per contactar.`,
    ],
    manualItems: [
      highPriority > 0
        ? `${highPriority} clients demanen prioritat alta abans de seguir filtrant.`
        : 'No hi ha cap client visible amb prioritat alta ara mateix.',
      focus
        ? `Primer focus: ${focus.name} (${focusPriority?.level.toLowerCase() ?? 'baixa'}).`
        : 'Encara no hi ha cap client visible per prioritzar.',
      activeOpportunities > 0
        ? 'Les oportunitats sense esdeveniment han de convertir-se en pressupost, reserva o descart.'
        : 'La llista visible no té oportunitats obertes sense esdeveniment.',
    ],
    nextStep: focus
      ? {
          title: `Obrir Fitxa 360 de ${focus.name}`,
          detail: focusPriority?.hint ?? 'Revisa la relació completa abans de decidir el següent moviment.',
          href: buildCustomerHubHref(focus.id),
          ctaLabel: 'Obrir Fitxa 360',
        }
      : {
          title: 'Crear o importar el primer client útil',
          detail: 'Sense clients visibles, el Customer Hub no pot actuar com a centre de relació.',
          href: '/admin/clientes?add=1',
          ctaLabel: 'Afegir client',
        },
  };
}
