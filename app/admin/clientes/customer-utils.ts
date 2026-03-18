/**
 * Tipus, constants i helpers purs per la gestió de clients.
 * Extret de clientes/page.tsx per reduir la mida del component.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
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
}

export interface CustomerStats {
  total: number;
  vip: number;
  withEvents: number;
  recentMonth: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  configurator: 'Configurador',
  phone: 'Telèfon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  wallapop: 'Wallapop',
  referral: 'Boca-orella',
  google: 'Google',
  other: 'Altre',
  manual: 'Manual',
  testimonial_form: 'Ressenya',
};

export type ExecutionPriority = 'ALTA' | 'MITJANA' | 'BAIXA';

export const PRIORITY_FILTER_STYLES: Record<'ALL' | ExecutionPriority, string> = {
  ALL: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  ALTA: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
  MITJANA: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  BAIXA: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getNextStep(customer: Customer): { label: string; href: string; hint: string } {
  if ((customer.total_events || 0) > 0) {
    return {
      label: 'Post-esdeveniment',
      href: '/admin/post-event',
      hint: 'Tancar cicle i demanar feedback',
    };
  }

  return {
    label: 'Crear pressupost',
    href: `/admin/presupuestos?customerId=${encodeURIComponent(customer.id)}`,
    hint: 'Primer pas per avançar venda',
  };
}

export function getExecutionPriority(customer: Customer): { level: ExecutionPriority; score: number; hint: string } {
  const createdAt = customer.created_at ? new Date(customer.created_at) : new Date();
  const daysSinceCreated = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const hasContactChannel = Boolean(customer.email || customer.phone);

  if (customer.is_vip) {
    return { level: 'ALTA', score: 100, hint: 'Client VIP: seguiment prioritari' };
  }
  if ((customer.total_events || 0) === 0 && hasContactChannel && daysSinceCreated <= 3) {
    return { level: 'ALTA', score: 90, hint: 'Lead recent sense esdeveniment' };
  }
  if ((customer.total_events || 0) === 0 && daysSinceCreated <= 14) {
    return { level: 'MITJANA', score: 60, hint: 'Oportunitat activa' };
  }
  if ((customer.total_events || 0) > 0) {
    return { level: 'MITJANA', score: 50, hint: 'Client amb potencial recurrència' };
  }
  return { level: 'BAIXA', score: 20, hint: 'Seguiment no urgent' };
}
