import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';
import { formatDate, formatDateSimple, formatNumber, getEventLabel, getLeadStatusDisplay } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { getLeadPriorityColorDisplay } from '@/app/admin/leads/colorTheme';
import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import { getTopCustomerHubLead, sortCustomerHubLeads } from '@/lib/customer-hub/topLead';

const BLOCKER_TONE_CLASS: Record<'DANGER' | 'WARNING' | 'INFO', string> = {
  DANGER: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
  WARNING: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
  INFO: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100',
};

export default function LeadsPanel({ data }: { data: CustomerHubDTO }) {
  const leads = sortCustomerHubLeads(data.leads);
  const topLead = getTopCustomerHubLead(data.leads);
  const topLeadAction = topLead ? buildLeadActionLink(topLead) : null;

  return (
    <section className="rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.leads.root)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Entrades vinculades</h2>
          <p className="text-sm">Historial d&apos;oportunitats comercials d&apos;aquest client.</p>
        </div>
      </div>
      {topLead && (
        <div className="mt-4 rounded-xl border p-3">
          <p className="text-[10px] uppercase tracking-wider opacity-60">Lead prioritària</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{topLead.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getLeadStatusDisplay(topLead.status).bg} ${getLeadStatusDisplay(topLead.status).text}`}>
              {getLeadStatusDisplay(topLead.status).label}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getLeadPriorityColorDisplay(topLead.priority).badgeClass}`}>
              {getLeadPriorityColorDisplay(topLead.priority).label}
            </span>
          </div>
          {topLead.commercialBlocker && (
            <p className="mt-2 text-xs opacity-80">
              {topLead.commercialBlocker.label}
              {topLead.commercialBlocker.context ? ` · ${topLead.commercialBlocker.context}` : ''}
            </p>
          )}
          {topLeadAction && (
            <Link
              href={topLeadAction.href}
              target={topLeadAction.external ? '_blank' : undefined}
              rel={topLeadAction.external ? 'noreferrer' : undefined}
              className="mt-3 inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              {topLeadAction.label}
            </Link>
          )}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {leads.length === 0 ? (
          <p className="rounded-xl border p-3 text-sm">Cap entrada vinculada a aquest client.</p>
        ) : leads.map((lead) => {
          const statusConf = getLeadStatusDisplay(lead.status);
          const priorityConf = getLeadPriorityColorDisplay(lead.priority);
          const actionLink = buildLeadActionLink(lead);
          return (
            <article key={lead.id} className="rounded-xl border p-4 transition-colors" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.leads.card(lead.name))}>
              <Link href={`/admin/leads/${lead.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{lead.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusConf.bg} ${statusConf.text}`}>{statusConf.label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${priorityConf.badgeClass}`}>{priorityConf.label}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>{getEventLabel(lead.eventType)}</span>
                  <span>{lead.eventDate ? formatDate(lead.eventDate) : 'Sense data'}</span>
                </div>
                {lead.commercialBlocker && (
                  <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${BLOCKER_TONE_CLASS[lead.commercialBlocker.tone]}`}>
                    <p className="font-medium">{lead.commercialBlocker.label}</p>
                    {lead.commercialBlocker.context && <p className="mt-1 opacity-80">{lead.commercialBlocker.context}</p>}
                  </div>
                )}
                {lead.booking && <p className="mt-2 text-xs">Reserva {lead.booking.reference} · {formatNumber(lead.booking.total)}€</p>}
                <p className="mt-1 text-[11px]">Creada {formatDateSimple(lead.createdAt)}</p>
              </Link>
              {actionLink && (
                <Link
                  href={actionLink.href}
                  target={actionLink.external ? '_blank' : undefined}
                  rel={actionLink.external ? 'noreferrer' : undefined}
                  className="mt-3 inline-flex rounded-lg border px-3 py-1 text-xs font-medium"
                >
                  {actionLink.label}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
