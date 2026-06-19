'use client';

import Link from 'next/link';
import type { CustomerCommSummaryDTO, CustomerInsightsDTO } from '@/lib/customer-hub/dto';
import { buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import { formatCurrency } from '@/lib/constants';

const HEALTH_CONFIG: Record<CustomerInsightsDTO['relationalHealth'], { label: string; color: string; bg: string }> = {
  EXCELLENT: { label: 'Excel·lent', color: 'admin-tone-text-success', bg: 'admin-tone-bg-success admin-tone-border-success' },
  GOOD: { label: 'Bona', color: 'admin-tone-text-cyan', bg: 'admin-tone-bg-cyan admin-tone-border-cyan' },
  AT_RISK: { label: 'En risc', color: 'admin-tone-text-warning', bg: 'admin-tone-bg-warning admin-tone-border-warning' },
  COLD: { label: 'Fred', color: 'text-white/60', bg: 'bg-[var(--o-admin-fill-4)] border-white/15' },
  LOST: { label: 'Perdut', color: 'admin-tone-text-danger', bg: 'admin-tone-bg-danger admin-tone-border-danger' },
};

const URGENCY_COLOR: Record<string, string> = {
  HIGH: 'admin-tone-border-danger admin-tone-bg-danger',
  MEDIUM: 'admin-tone-border-warning admin-tone-bg-warning',
  LOW: 'border-[var(--line)] bg-[var(--panel)]',
};

const COMMERCIAL_RISK_COLOR: Record<string, string> = {
  HIGH: 'admin-tone-text-danger',
  MEDIUM: 'admin-tone-text-warning',
  LOW: 'text-white/60',
  NONE: 'admin-tone-text-success',
};

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
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Acció recomanada</p>
        <p className="mt-1 text-sm font-semibold">{insights.nextAction.label}</p>
        {insights.nextAction.context && (
          <p className="mt-0.5 text-xs opacity-70">{insights.nextAction.context}</p>
        )}
        {nextActionLink && (
          <Link
            href={nextActionLink.href}
            target={nextActionLink.external ? '_blank' : undefined}
            rel={nextActionLink.external ? 'noopener noreferrer' : undefined}
            className="mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            {nextActionLink.label}
          </Link>
        )}
      </div>

      {/* Relational Health */}
      <div className={`rounded-xl border p-3 ${health.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Salut relacional</p>
        <p className={`mt-1 text-lg font-bold ${health.color}`}>{health.label}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs opacity-70">
          {insights.completedEvents > 0 && <span>{insights.completedEvents} events</span>}
          {insights.recurrence > 1 && <span>Recurrent ({insights.recurrence}x)</span>}
          {insights.daysSinceLastContact != null && <span>Últim contacte fa {insights.daysSinceLastContact}d</span>}
        </div>
        {insights.commercialRisk.level !== 'NONE' && (
          <p className={`mt-2 text-xs ${commercialRiskColor}`}>
            {insights.commercialRisk.label}
            {insights.commercialRisk.context ? ` · ${insights.commercialRisk.context}` : ''}
          </p>
        )}
      </div>

      {/* Value summary */}
      <div className="ap-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Valor del client</p>
        <p className="mt-1 text-lg font-bold">{formatCurrency(insights.ltv)}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs opacity-70">
          {insights.pendingPaymentTotal > 0 && (
            <span className="admin-tone-text-warning">Pendent: {formatCurrency(insights.pendingPaymentTotal)}</span>
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
