import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';
import { formatDate, formatDateSimple, formatNumber, getEventLabel, getLeadStatusDisplay } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { getLeadPriorityColorDisplay } from '@/app/admin/leads/colorTheme';
import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import { buildLeadContinuity } from '@/lib/customer-hub/leadContinuity';
import { getTopCustomerHubLead, sortCustomerHubLeads } from '@/lib/customer-hub/topLead';

const BLOCKER_TONE_CLASS: Record<'DANGER' | 'WARNING' | 'INFO', string> = {
  DANGER: 'ch__lead-blocker--danger',
  WARNING: 'ch__lead-blocker--warning',
  INFO: 'ch__lead-blocker--info',
};

function toneKey(value: string) {
  return value.toLowerCase().replace(/_/g, '-');
}

export default function LeadsPanel({ data }: { data: CustomerHubDTO }) {
  const leads = sortCustomerHubLeads(data.leads);
  const topLead = getTopCustomerHubLead(data.leads);
  const topLeadAction = topLead ? buildLeadActionLink(topLead) : null;
  const topLeadContinuity = topLead ? buildLeadContinuity(topLead, data.customer.id) : null;

  return (
    <section className="ch__leads-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.leads.root)}>
      <div className="ch__leads-head">
        <div>
          <h2 className="ch__leads-title">Entrades vinculades</h2>
          <p className="ch__leads-summary">Historial d&apos;oportunitats comercials d&apos;aquest client.</p>
        </div>
      </div>
      {topLead && (
        <div className="ch__lead-priority-card">
          <p className="ch__lead-label">Lead prioritària</p>
          <div className="ch__lead-badges">
            <span className="ch__lead-name">{topLead.name}</span>
            <span className="ch__lead-badge" data-status={toneKey(topLead.status)}>
              {getLeadStatusDisplay(topLead.status).label}
            </span>
            <span className="ch__lead-badge" data-priority={toneKey(topLead.priority)}>
              {getLeadPriorityColorDisplay(topLead.priority).label}
            </span>
          </div>
          {topLead.commercialBlocker && (
            <p className="ch__lead-note">
              {topLead.commercialBlocker.label}
              {topLead.commercialBlocker.context ? ` · ${topLead.commercialBlocker.context}` : ''}
            </p>
          )}
          {topLeadContinuity && (
            <p className="ch__lead-continuity">
              {topLeadContinuity.stageLabel} · {topLeadContinuity.narrative}
            </p>
          )}
          {topLeadAction && (
            <Link
              href={topLeadAction.href}
              target={topLeadAction.external ? '_blank' : undefined}
              rel={topLeadAction.external ? 'noreferrer' : undefined}
              className="ch__lead-action"
            >
              {topLeadAction.label}
            </Link>
          )}
        </div>
      )}
      <div className="ch__leads-list">
        {leads.length === 0 ? (
          <p className="ch__leads-empty">Cap entrada vinculada a aquest client.</p>
        ) : leads.map((lead) => {
          const statusConf = getLeadStatusDisplay(lead.status);
          const priorityConf = getLeadPriorityColorDisplay(lead.priority);
          const actionLink = buildLeadActionLink(lead);
          const continuity = buildLeadContinuity(lead, data.customer.id);
          return (
            <article key={lead.id} className="ch__lead-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.leads.card(lead.name))}>
              <Link href={continuity.hubHref} className="ch__lead-main">
                <div className="ch__lead-card-head">
                  <p className="ch__lead-name">{lead.name}</p>
                  <div className="ch__lead-badges">
                    <span className="ch__lead-badge" data-status={toneKey(lead.status)}>{statusConf.label}</span>
                    <span className="ch__lead-badge" data-priority={toneKey(lead.priority)}>{priorityConf.label}</span>
                  </div>
                </div>
                <div className="ch__lead-meta">
                  <span>{getEventLabel(lead.eventType)}</span>
                  <span>{lead.eventDate ? formatDate(lead.eventDate) : 'Sense data'}</span>
                </div>
                {lead.commercialBlocker && (
                  <div className={`ch__lead-blocker ${BLOCKER_TONE_CLASS[lead.commercialBlocker.tone]}`}>
                    <p>{lead.commercialBlocker.label}</p>
                    {lead.commercialBlocker.context && <p>{lead.commercialBlocker.context}</p>}
                  </div>
                )}
                {lead.booking && <p className="ch__lead-booking">Reserva {lead.booking.reference} · {formatNumber(lead.booking.total)}€</p>}
                <p className="ch__lead-continuity">
                  {continuity.stageLabel} · {continuity.narrative}
                </p>
                <p className="ch__lead-date">Creada {formatDateSimple(lead.createdAt)}</p>
              </Link>
              <div className="ch__lead-actions">
                {actionLink && (
                  <Link
                    href={actionLink.href}
                    target={actionLink.external ? '_blank' : undefined}
                    rel={actionLink.external ? 'noreferrer' : undefined}
                    className="ch__lead-action"
                  >
                    {actionLink.label}
                  </Link>
                )}
                <Link
                  href={continuity.technicalHref}
                  className="ch__lead-action ch__lead-action--muted"
                >
                  Fitxa tècnica del lead
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
