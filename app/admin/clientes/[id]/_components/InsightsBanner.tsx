'use client';

import Link from 'next/link';
import type { CustomerCommSummaryDTO, CustomerInsightsDTO } from '@/lib/customer-hub/dto';
import { buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import { formatCurrency } from '@/lib/constants';

const HEALTH_CONFIG: Record<CustomerInsightsDTO['relationalHealth'], { label: string; toneClass: string }> = {
  EXCELLENT: { label: 'Excel·lent', toneClass: 'ap-card--success' },
  GOOD: { label: 'Bona', toneClass: 'ap-card--info' },
  AT_RISK: { label: 'En risc', toneClass: 'ap-card--warning' },
  COLD: { label: 'Fred', toneClass: '' },
  LOST: { label: 'Perdut', toneClass: 'ap-card--danger' },
};

const URGENCY_TONE: Record<string, string> = {
  HIGH: 'ap-card--danger',
  MEDIUM: 'ap-card--warning',
  LOW: '',
};

const COMMERCIAL_RISK_COLOR: Record<string, string> = {
  HIGH: 'text-[var(--o-danger)]',
  MEDIUM: 'text-[var(--o-warning)]',
  LOW: 'text-[var(--t2)]',
  NONE: 'text-[var(--o-success)]',
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
  const urgencyTone = URGENCY_TONE[insights.nextAction.urgency] || '';
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
      <div className={`ap-card ${urgencyTone}`}>
        <div className="ap-card-body">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t2)]">Acció recomanada</p>
          <p className="mt-1 text-sm font-semibold leading-tight text-[var(--t)]">{insights.nextAction.label}</p>
          {insights.nextAction.context && (
            <p className="mt-0.5 text-xs leading-snug text-[var(--t2)]">{insights.nextAction.context}</p>
          )}
          {nextActionLink && (
            <Link
              href={nextActionLink.href}
              target={nextActionLink.external ? '_blank' : undefined}
              rel={nextActionLink.external ? 'noopener noreferrer' : undefined}
              className="ap-btn ap-btn--xs mt-2"
            >
              {nextActionLink.label}
            </Link>
          )}
        </div>
      </div>

      {/* Relational Health */}
      <div className={`ap-card ${health.toneClass}`}>
        <div className="ap-card-body">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t2)]">Salut relacional</p>
          <p className="mt-1 text-lg font-bold leading-tight text-[var(--t)]">{health.label}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs leading-snug text-[var(--t2)]">
            {insights.completedEvents > 0 && <span>{insights.completedEvents} events</span>}
            {insights.recurrence > 1 && <span>Recurrent ({insights.recurrence}x)</span>}
            {insights.daysSinceLastContact != null && <span>Últim contacte fa {insights.daysSinceLastContact}d</span>}
          </div>
          {insights.commercialRisk.level !== 'NONE' && (
            <p className={`mt-2 text-xs leading-snug ${commercialRiskColor}`}>
              {insights.commercialRisk.label}
              {insights.commercialRisk.context ? ` · ${insights.commercialRisk.context}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Value summary */}
      <div className="ap-card">
        <div className="ap-card-body">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t2)]">Valor del client</p>
          <p className="mt-1 text-lg font-bold leading-tight text-[var(--t)]">{formatCurrency(insights.ltv)}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs leading-snug text-[var(--t2)]">
            {insights.pendingPaymentTotal > 0 && (
              <span className="text-[var(--o-warning)]">Pendent: {formatCurrency(insights.pendingPaymentTotal)}</span>
            )}
            {insights.openTasksCount > 0 && <span>{insights.openTasksCount} tasques obertes</span>}
            {insights.daysUntilNextEvent != null && insights.daysUntilNextEvent >= 0 && (
              <span>Pròxim event en {insights.daysUntilNextEvent}d</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
