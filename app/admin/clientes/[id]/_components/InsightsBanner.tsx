'use client';

import Link from 'next/link';
import type { CustomerCommSummaryDTO, CustomerInsightsDTO } from '@/lib/customer-hub/dto';
import { buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';

const HEALTH_CONFIG: Record<CustomerInsightsDTO['relationalHealth'], { label: string; color: string; bg: string }> = {
  EXCELLENT: { label: 'Excel·lent', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  GOOD: { label: 'Bona', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  AT_RISK: { label: 'En risc', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' },
  COLD: { label: 'Fred', color: 'text-slate-300', bg: 'bg-slate-500/15 border-slate-500/30' },
  LOST: { label: 'Perdut', color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-500/30' },
};

const URGENCY_COLOR: Record<string, string> = {
  HIGH: 'border-rose-500/40 bg-rose-500/10',
  MEDIUM: 'border-amber-500/40 bg-amber-500/10',
  LOW: 'border-white/10 bg-white/[0.03]',
};

const COMMERCIAL_RISK_COLOR: Record<string, string> = {
  HIGH: 'text-rose-300',
  MEDIUM: 'text-amber-300',
  LOW: 'text-slate-300',
  NONE: 'text-emerald-300',
};

function formatCurrency(val: number): string {
  return val.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function InsightsBanner({
  insights,
  customerId,
  customerName,
  customerPhone,
  commSummary,
}: {
  insights: CustomerInsightsDTO;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  commSummary: CustomerCommSummaryDTO;
}) {
  const health = HEALTH_CONFIG[insights.relationalHealth];
  const urgencyBorder = URGENCY_COLOR[insights.nextAction.urgency] || URGENCY_COLOR.LOW;
  const commercialRiskColor = COMMERCIAL_RISK_COLOR[insights.commercialRisk.level] || COMMERCIAL_RISK_COLOR.NONE;
  const nextActionLink = buildCustomerNextActionLink({
    customerId,
    customerName,
    customerPhone,
    nextAction: insights.nextAction,
    commSummary,
  });

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {/* Next Action — from insights engine */}
      <div className={`rounded-xl border p-3 ${urgencyBorder}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Acció recomanada</p>
        <p className="mt-1 text-sm font-semibold">{insights.nextAction.label}</p>
        {insights.nextAction.context && (
          <p className="mt-0.5 text-xs opacity-70">{insights.nextAction.context}</p>
        )}
        {nextActionLink && (
          <Link
            href={nextActionLink.href}
            target={nextActionLink.external ? '_blank' : undefined}
            rel={nextActionLink.external ? 'noopener noreferrer' : undefined}
            className="mt-2 inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:bg-white/10 transition-colors"
          >
            {nextActionLink.label}
          </Link>
        )}
      </div>

      {/* Relational Health */}
      <div className={`rounded-xl border p-3 ${health.bg}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Salut relacional</p>
        <p className={`mt-1 text-lg font-bold ${health.color}`}>{health.label}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-70">
          {insights.completedEvents > 0 && <span>{insights.completedEvents} events</span>}
          {insights.recurrence > 1 && <span>Recurrent ({insights.recurrence}x)</span>}
          {insights.daysSinceLastContact != null && <span>Últim contacte fa {insights.daysSinceLastContact}d</span>}
        </div>
        {insights.commercialRisk.level !== 'NONE' && (
          <p className={`mt-2 text-[11px] ${commercialRiskColor}`}>
            {insights.commercialRisk.label}
            {insights.commercialRisk.context ? ` · ${insights.commercialRisk.context}` : ''}
          </p>
        )}
      </div>

      {/* Value summary */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Valor del client</p>
        <p className="mt-1 text-lg font-bold">{formatCurrency(insights.ltv)}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-70">
          {insights.pendingPaymentTotal > 0 && (
            <span className="text-amber-300">Pendent: {formatCurrency(insights.pendingPaymentTotal)}</span>
          )}
          {insights.openTasksCount > 0 && <span>{insights.openTasksCount} tasques obertes</span>}
          {insights.daysUntilNextEvent != null && insights.daysUntilNextEvent >= 0 && (
            <span>Pròxim event en {insights.daysUntilNextEvent}d</span>
          )}
        </div>
      </div>
    </div>
  );
}
