'use client';

import Link from 'next/link';
import type { LeadInsights } from '@/lib/services/leadInsightsService';
import { buildCustomerTaskListHref } from '@/lib/admin/customerWorkspaceHref';

const URGENCY_COLOR: Record<string, string> = {
  HIGH: 'border-rose-500/40 bg-rose-500/10',
  MEDIUM: 'border-amber-500/40 bg-amber-500/10',
  LOW: 'border-white/10 bg-white/[0.03]',
};

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'Alt', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30' },
  MEDIUM: { label: 'Mitjà', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
  LOW: { label: 'Baix', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  NONE: { label: 'Cap', color: 'text-slate-300', bg: 'bg-slate-500/15 border-slate-500/30' },
};

const ACTION_CTA: Record<string, { href: (input: { leadId: string; customerId?: string | null; bookingId?: string | null }) => string; label: string }> = {
  CONTACT_NOW: { href: ({ leadId }) => `/admin/leads/${leadId}#contact`, label: 'Contactar' },
  FOLLOW_UP: { href: ({ leadId }) => `/admin/inbox/compose?leadId=${leadId}`, label: 'Enviar seguiment' },
  SEND_QUOTE: { href: ({ leadId }) => `/admin/presupuestos?leadId=${leadId}`, label: 'Crear pressupost' },
  CLOSE_DEAL: { href: ({ leadId }) => `/admin/leads/${leadId}#actions`, label: 'Tancar acord' },
  COLLECT_PAYMENT: {
    href: ({ bookingId, customerId, leadId }) =>
      bookingId ? `/admin/bookings/${bookingId}` : customerId ? `/admin/bookings?customerId=${customerId}` : `/admin/leads/${leadId}`,
    label: 'Revisar cobraments',
  },
  COMPLETE_TASK: {
    href: ({ leadId, customerId }) =>
      customerId ? buildCustomerTaskListHref(customerId) : `/admin/leads/${leadId}`,
    label: 'Veure tasques',
  },
  RE_ENGAGE: { href: ({ leadId }) => `/admin/inbox/compose?leadId=${leadId}`, label: 'Reactivar' },
};

function formatCurrency(val: number): string {
  return val.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function LeadInsightsBanner({
  insights,
  leadId,
  customerId,
  bookingId,
}: {
  insights: LeadInsights;
  leadId: string;
  customerId?: string | null;
  bookingId?: string | null;
}) {
  const urgencyBorder = URGENCY_COLOR[insights.nextAction.urgency] || URGENCY_COLOR.LOW;
  const risk = RISK_CONFIG[insights.lossRisk.level] || RISK_CONFIG.NONE;
  const cta = ACTION_CTA[insights.nextAction.type];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {/* Next Action */}
      <div className={`rounded-xl border p-3 ${urgencyBorder}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Acció recomanada</p>
        <p className="mt-1 text-sm font-semibold">{insights.nextAction.label}</p>
        {insights.nextAction.context && (
          <p className="mt-0.5 text-xs opacity-70">{insights.nextAction.context}</p>
        )}
        {cta && insights.nextAction.type !== 'NONE' && (
          <Link
            href={cta.href({ leadId, customerId, bookingId })}
            className="mt-2 inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:bg-white/10 transition-colors"
          >
            {cta.label}
          </Link>
        )}
      </div>

      {/* Loss Risk */}
      <div className={`rounded-xl border p-3 ${risk.bg}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Risc de pèrdua</p>
        <p className={`mt-1 text-lg font-bold ${risk.color}`}>{risk.label}</p>
        {insights.lossRisk.reasons.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-[11px] opacity-70">
            {insights.lossRisk.reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-1">
                <span className="mt-0.5 shrink-0">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Commercial Context */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Context comercial</p>
        <p className="mt-1 text-lg font-bold">{formatCurrency(insights.commercial.estimatedDealValue)}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-70">
          {insights.commercial.isRecurringClient && (
            <span className="text-cyan-300">Client recurrent ({insights.commercial.previousEventsCount}x)</span>
          )}
          {insights.commercial.previousTotalSpent > 0 && (
            <span>Històric: {formatCurrency(insights.commercial.previousTotalSpent)}</span>
          )}
          {insights.commercial.daysUntilEvent != null && insights.commercial.daysUntilEvent >= 0 && (
            <span>Event en {insights.commercial.daysUntilEvent}d</span>
          )}
          {insights.commercial.daysSinceLastActivity != null && (
            <span>Última activitat fa {insights.commercial.daysSinceLastActivity}d</span>
          )}
        </div>
      </div>
    </div>
  );
}
