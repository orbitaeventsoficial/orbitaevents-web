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

export { PRIORITY_FILTER_STYLES } from '@/lib/constants';
import { EXECUTION_PRIORITY_HINTS, CUSTOMER_NEXT_STEPS } from '@/lib/constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

