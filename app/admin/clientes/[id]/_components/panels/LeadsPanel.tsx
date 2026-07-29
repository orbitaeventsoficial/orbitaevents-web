import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';
import { formatDate, formatDateSimple, formatNumber, getEventLabel, getLeadStatusDisplay } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';
import { getLeadPriorityColorDisplay } from '@/app/admin/leads/colorTheme';
import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import { buildLeadContinuity } from '@/lib/customer-hub/leadContinuity';
import { getTopCustomerHubLead, sortCustomerHubLeads } from '@/lib/customer-hub/topLead';

const BADGE_BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight';
const BADGE_NEUTRAL = 'border-[var(--line2)] bg-[var(--ax-fill-3)] text-[var(--t2)]';
const BADGE_WARNING = 'border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] text-[var(--o-warning)]';

const BLOCKER_TONE_CLASS: Record<'DANGER' | 'WARNING' | 'INFO', string> = {
  DANGER: 'border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] text-[var(--o-danger)]',
  WARNING: 'border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] text-[var(--o-warning)]',
  INFO: 'border-[var(--line2)] bg-[var(--ax-fill-3)] text-[var(--t2)]',
};

function toneKey(value: string) {
  return value.toLowerCase().replace(/_/g, '-');
}

function statusBadgeTone(status: string) {
  const key = toneKey(status);
  if (key === 'new' || key === 'quote-sent' || key === 'negotiating') return BADGE_WARNING;
  if (key === 'won') return 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)] text-[var(--o-success)]';
  if (key === 'lost') return 'border-[var(--line2)] bg-[var(--ax-fill-2)] text-[var(--t3)]';
  return BADGE_NEUTRAL;
}

function priorityBadgeTone(priority: string) {
  const key = toneKey(priority);
  if (key === 'medium' || key === 'high') return BADGE_WARNING;
  if (key === 'urgent') return 'border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] text-[var(--o-danger)]';
  return BADGE_NEUTRAL;
}

export default function LeadsPanel({ data }: { data: CustomerHubDTO }) {
  const leads = sortCustomerHubLeads(data.leads);
  const topLead = getTopCustomerHubLead(data.leads);
  const topLeadAction = topLead ? buildLeadActionLink(topLead) : null;
  const topLeadContinuity = topLead ? buildLeadContinuity(topLead, data.customer.id) : null;

  return (
    <AdminSection
      title="Entrades vinculades"
      description="Historial d'oportunitats comercials d'aquest client."
      help={ADMIN_CUSTOMER_PANEL_HELP_2.leads.root}
    >
      {topLead && (
        <div className="mb-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-3">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Lead prioritària</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--t)]">{topLead.name}</span>
            <span className={`${BADGE_BASE} ${statusBadgeTone(topLead.status)}`}>
              {getLeadStatusDisplay(topLead.status).label}
            </span>
            <span className={`${BADGE_BASE} ${priorityBadgeTone(topLead.priority)}`}>
              {getLeadPriorityColorDisplay(topLead.priority).label}
            </span>
          </div>
          {topLead.commercialBlocker && (
            <p className="m-0 mt-2 text-xs leading-snug text-[var(--t2)]">
              {topLead.commercialBlocker.label}
              {topLead.commercialBlocker.context ? ` · ${topLead.commercialBlocker.context}` : ''}
            </p>
          )}
          {topLeadContinuity && (
            <p className="m-0 mt-2 text-xs leading-snug text-[var(--t3)]">
              {topLeadContinuity.stageLabel} · {topLeadContinuity.narrative}
            </p>
          )}
          {topLeadAction && (
            <Link
              href={topLeadAction.href}
              target={topLeadAction.external ? '_blank' : undefined}
              rel={topLeadAction.external ? 'noreferrer' : undefined}
              className="ap-btn ap-btn--xs mt-3"
            >
              {topLeadAction.label}
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {leads.length === 0 ? (
          <p className="m-0 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-3 text-sm text-[var(--t2)]">Cap entrada vinculada a aquest client.</p>
        ) : leads.map((lead) => {
          const statusConf = getLeadStatusDisplay(lead.status);
          const priorityConf = getLeadPriorityColorDisplay(lead.priority);
          const actionLink = buildLeadActionLink(lead);
          const continuity = buildLeadContinuity(lead, data.customer.id);
          return (
            <article key={lead.id} className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-4 transition-colors hover:border-[var(--o-admin-line-2)] hover:bg-[var(--ax-fill-2)]" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.leads.card(lead.name))}>
              <Link href={continuity.hubHref} className="block text-inherit no-underline">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-sm font-semibold text-[var(--t)]">{lead.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${BADGE_BASE} ${statusBadgeTone(lead.status)}`}>{statusConf.label}</span>
                    <span className={`${BADGE_BASE} ${priorityBadgeTone(lead.priority)}`}>{priorityConf.label}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--t2)]">
                  <span>{getEventLabel(lead.eventType)}</span>
                  <span>{lead.eventDate ? formatDate(lead.eventDate) : 'Sense data'}</span>
                </div>
                {lead.commercialBlocker && (
                  <div className={`mt-3 rounded-[var(--o-r-lg)] border px-3 py-2 text-xs leading-snug ${BLOCKER_TONE_CLASS[lead.commercialBlocker.tone]}`}>
                    <p className="m-0 font-semibold">{lead.commercialBlocker.label}</p>
                    {lead.commercialBlocker.context && <p className="m-0 mt-1">{lead.commercialBlocker.context}</p>}
                  </div>
                )}
                {lead.booking && <p className="m-0 mt-2 text-xs leading-snug text-[var(--t2)]">Reserva {lead.booking.reference} · {formatNumber(lead.booking.total)}€</p>}
                <p className="m-0 mt-2 text-xs leading-snug text-[var(--t3)]">
                  {continuity.stageLabel} · {continuity.narrative}
                </p>
                <p className="m-0 mt-1 text-xs leading-snug text-[var(--t3)]">Creada {formatDateSimple(lead.createdAt)}</p>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                {actionLink && (
                  <Link
                    href={actionLink.href}
                    target={actionLink.external ? '_blank' : undefined}
                    rel={actionLink.external ? 'noreferrer' : undefined}
                    className="ap-btn ap-btn--xs"
                  >
                    {actionLink.label}
                  </Link>
                )}
                <Link href={continuity.technicalHref} className="ap-btn ap-btn--xs">
                  Fitxa tècnica del lead
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AdminSection>
  );
}
