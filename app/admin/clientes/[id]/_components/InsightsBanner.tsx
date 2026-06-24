'use client';

import Link from 'next/link';
import type { CustomerCommSummaryDTO, CustomerInsightsDTO } from '@/lib/customer-hub/dto';
import { buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import { formatCurrency } from '@/lib/constants';

const HEALTH_CONFIG: Record<CustomerInsightsDTO['relationalHealth'], { label: string; toneClass: string }> = {
  EXCELLENT: { label: 'Excel·lent', toneClass: 'ch__insight-card--success' },
  GOOD: { label: 'Bona', toneClass: 'ch__insight-card--info' },
  AT_RISK: { label: 'En risc', toneClass: 'ch__insight-card--warning' },
  COLD: { label: 'Fred', toneClass: 'ch__insight-card--cold' },
  LOST: { label: 'Perdut', toneClass: 'ch__insight-card--danger' },
};

const URGENCY_COLOR: Record<string, string> = {
  HIGH: 'ch__insight-card--danger',
  MEDIUM: 'ch__insight-card--warning',
  LOW: 'ch__insight-card--neutral',
};

const COMMERCIAL_RISK_COLOR: Record<string, string> = {
  HIGH: 'ch__insight-text--danger',
  MEDIUM: 'ch__insight-text--warning',
  LOW: 'ch__insight-text--muted',
  NONE: 'ch__insight-text--success',
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
    <div className="ch__insights-grid">
      {/* Next Action — from insights engine */}
      <div className={`ch__insight-card ${urgencyBorder}`}>
        <p className="ch__insight-label">Acció recomanada</p>
        <p className="ch__insight-title ch__insight-title--sm">{insights.nextAction.label}</p>
        {insights.nextAction.context && (
          <p className="ch__insight-context">{insights.nextAction.context}</p>
        )}
        {nextActionLink && (
          <Link
            href={nextActionLink.href}
            target={nextActionLink.external ? '_blank' : undefined}
            rel={nextActionLink.external ? 'noopener noreferrer' : undefined}
            className="ch__insight-link"
          >
            {nextActionLink.label}
          </Link>
        )}
      </div>

      {/* Relational Health */}
      <div className={`ch__insight-card ${health.toneClass}`}>
        <p className="ch__insight-label">Salut relacional</p>
        <p className="ch__insight-title">{health.label}</p>
        <div className="ch__insight-meta">
          {insights.completedEvents > 0 && <span>{insights.completedEvents} events</span>}
          {insights.recurrence > 1 && <span>Recurrent ({insights.recurrence}x)</span>}
          {insights.daysSinceLastContact != null && <span>Últim contacte fa {insights.daysSinceLastContact}d</span>}
        </div>
        {insights.commercialRisk.level !== 'NONE' && (
          <p className={`ch__insight-risk ${commercialRiskColor}`}>
            {insights.commercialRisk.label}
            {insights.commercialRisk.context ? ` · ${insights.commercialRisk.context}` : ''}
          </p>
        )}
      </div>

      {/* Value summary */}
      <div className="ch__insight-card ch__insight-card--neutral">
        <p className="ch__insight-label">Valor del client</p>
        <p className="ch__insight-title">{formatCurrency(insights.ltv)}</p>
        <div className="ch__insight-meta">
          {insights.pendingPaymentTotal > 0 && (
            <span className="ch__insight-text--warning">Pendent: {formatCurrency(insights.pendingPaymentTotal)}</span>
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
