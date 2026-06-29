'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CustomerContactDTO, CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate, formatDateFull, formatDateShort, formatDateSimple, formatCurrency, formatNumber, getEventLabel, getLeadStatusDisplay } from '@/lib/constants';
import {
  CUSTOMER_LIFECYCLE_LABELS,
  CUSTOMER_LIFECYCLE_COLORS,
  CUSTOMER_LIFECYCLE_ICONS,
  CUSTOMER_TAG_COLORS,
  CUSTOMER_TAG_DEFAULT_COLOR,
  CUSTOMER_TAG_PRESETS,
  getHealthLabel,
  getHealthColor,
  TASK_SOURCE,
  TASK_DEDUPE_KEY,
  type CustomerLifecycleValue,
} from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerCommercialRiskLink } from '@/lib/customer-hub/nextActionLink';
import { buildCustomerCommercialPriority } from '@/lib/customer-hub/commercialPriority';
import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import { getTopCustomerHubLead } from '@/lib/customer-hub/topLead';
import { dedupeCustomerHubQuickActions } from '@/lib/customer-hub/quickActions';
import {
  buildCustomerBookingCreateHref,
  buildCustomerComposeHref,
  buildCustomerHubHref,
  buildCustomerProposalHref,
  buildCustomerTaskCreateHref,
  buildCustomerWorkspaceTabHref,
} from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { getLeadPriorityColorDisplay } from '@/app/admin/leads/colorTheme';

type CustomerEditableFields = {
  name: string;
  email: string;
  phone: string;
  instagram?: string;
  preferredLocale: string;
};

export default function SummaryPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerEditableFields>({
    name: data.customer.name || '',
    email: data.customer.email || '',
    phone: data.customer.phone || '',
    preferredLocale: 'ca',
  });

  const openTasks = data.tasks.filter((t) => !t.done).length;
  const urgentTasks = data.tasks.filter((t) => !t.done && t.priority === 'HIGH').length;
  const draftProposals = data.proposals.filter((p) => p.status === 'DRAFT').length;
  const sentProposals = data.proposals.filter((p) => p.status === 'SENT').length;
  const acceptedProposals = data.proposals.filter((p) => p.status === 'ACCEPTED').length;
  const confirmedBookings = data.bookings.filter((b) => b.status === 'CONFIRMED').length;
  const upcomingBookings = data.bookings.filter(
    (b) => b.date && new Date(b.date) > new Date() && b.status !== 'CANCELLED'
  );

  const nextTask = data.tasks.find((t) => !t.done);
  const nextEvents = upcomingBookings.slice(0, 3);
  const nextEvent = nextEvents[0];
  const activeDiscounts = (data.discountCodes || []).filter(
    (dc) => dc.isActive && dc.currentUses < dc.maxUses && new Date(dc.validUntil) > new Date()
  );
  const commercialRiskLink = buildCustomerCommercialRiskLink({
    customerId: data.customer.id,
    customerName: data.customer.name,
    customerPhone: data.customer.phone,
    commercialRisk: data.insights.commercialRisk,
    followUpSummary: data.followUpSummary,
  });
  const commercialPriority = buildCustomerCommercialPriority({
    insights: data.insights,
    followUpSummary: data.followUpSummary,
  });
  const topLead = getTopCustomerHubLead(data.leads);
  const routeBooking = nextEvent
    || topLead?.booking
    || data.bookings.find((booking) => Boolean(booking.location || booking.venue));
  const topLeadAction = topLead
    ? topLead.booking
      ? { href: buildBookingHref(topLead.booking.id), label: 'Obrir reserva', external: false as const }
      : buildLeadActionLink(topLead)
    : null;
  const topLeadActionChannel = topLeadAction
    ? topLeadAction.external
      ? 'Canal suggerit: WhatsApp'
      : topLeadAction.href.includes('/admin/inbox/compose')
        ? 'Canal suggerit: Email'
        : topLeadAction.href.includes('/admin/bookings/')
          ? 'Canal suggerit: Fitxa reserva'
          : 'Canal suggerit: Fitxa lead'
    : null;
  const topLeadActionUrgency = topLead?.commercialBlocker?.tone === 'DANGER'
    ? 'Prioritat del pas: Alta'
    : topLead?.commercialBlocker?.tone === 'WARNING'
      ? 'Prioritat del pas: Mitjana'
      : topLeadAction
        ? 'Prioritat del pas: Informativa'
        : null;
  const topLeadBookingDaysUntil = topLead?.booking?.date ? getDaysUntil(topLead.booking.date) : null;
  const topLeadPaymentRisk = topLead?.booking
    && typeof topLead.booking.remainingAmount === 'number'
    && topLead.booking.remainingAmount > 0
    && topLead.booking.remainingPaid !== true
    && topLeadBookingDaysUntil !== null
    && topLeadBookingDaysUntil <= 14
      ? `Risc temporal: queden ${topLeadBookingDaysUntil} dies i ${formatCurrency(topLead.booking.remainingAmount)} pendents`
      : null;
  const topLeadPaymentSummary = topLead?.booking
    ? topLead.booking.remainingPaid === true || topLead.booking.remainingAmount === 0
      ? 'Estat econòmic: cobrament tancat'
      : topLead.booking.depositPaid
        ? 'Estat econòmic: cobrament parcial'
        : 'Estat econòmic: cobrament pendent'
    : null;
  const reactivationTaskHref = data.reactivation
    ? buildReactivationTaskHref(data.customer.id, data.customer.name, data.reactivation)
    : null;
  const customerTaskCreateHref = buildCustomerTaskCreateHref(data.customer.id);
  const customerBookingCreateHref = buildCustomerBookingCreateHref(data.customer.id);
  const customerProposalHref = buildCustomerProposalHref(data.customer.id);
  const customerComposeHref = buildCustomerComposeHref(data.customer.id);
  const quickActions = dedupeCustomerHubQuickActions([
    commercialRiskLink
      ? {
          href: commercialRiskLink.href,
          label: commercialRiskLink.label,
          color: data.insights.commercialRisk.level === 'HIGH' ? 'amber' : 'slate',
          external: commercialRiskLink.external,
        }
      : null,
    topLeadAction
      ? {
          href: topLeadAction.href,
          label: topLeadAction.label,
          color: topLead?.commercialBlocker?.tone === 'DANGER' ? 'amber' : 'cyan',
          external: topLeadAction.external,
        }
      : null,
    draftProposals > 0
      ? { href: customerProposalHref, label: 'Continuar pressupost', color: 'cyan' as const }
      : null,
    sentProposals > 0 && acceptedProposals === 0
      ? { href: buildCustomerComposeHref(data.customer.id, 'recordatori'), label: 'Enviar recordatori', color: 'amber' as const }
      : null,
    acceptedProposals > 0 && confirmedBookings === 0
      ? { href: customerBookingCreateHref, label: 'Crear reserva', color: 'emerald' as const }
      : null,
    confirmedBookings > 0
      ? { href: buildCustomerComposeHref(data.customer.id, 'confirmacio'), label: 'Enviar confirmació', color: 'indigo' as const }
      : null,
    data.reactivation
      ? {
          href: data.reactivation.whatsappUrl || data.reactivation.mailtoUrl,
          label: data.reactivation.whatsappUrl ? 'Preparar reactivació' : 'Preparar email de reactivació',
          color: data.reactivation.priority === 'ALTA' ? 'amber' as const : 'slate' as const,
          external: true,
        }
      : null,
    { href: customerComposeHref, label: 'Enviar missatge', color: 'slate' as const },
  ]);

  const alerts: Array<{ type: 'warning' | 'info' | 'success'; text: string }> = [];
  if (data.insights.commercialRisk.level === 'HIGH') {
    alerts.push({ type: 'warning', text: `${data.insights.commercialRisk.label}${data.insights.commercialRisk.context ? ` · ${data.insights.commercialRisk.context}` : ''}` });
  } else if (data.insights.commercialRisk.level === 'MEDIUM') {
    alerts.push({ type: 'info', text: `${data.insights.commercialRisk.label}${data.insights.commercialRisk.context ? ` · ${data.insights.commercialRisk.context}` : ''}` });
  }
  if (urgentTasks > 0) {
    alerts.push({ type: 'warning', text: `${urgentTasks} tasca${urgentTasks > 1 ? 'ques' : ''} urgent${urgentTasks > 1 ? 's' : ''}` });
  }
  if (draftProposals > 0) {
    alerts.push({ type: 'info', text: `${draftProposals} pressupost${draftProposals > 1 ? 's' : ''} en esborrany` });
  }
  if (sentProposals > 0 && acceptedProposals === 0) {
    alerts.push({ type: 'info', text: `${sentProposals} pressupost${sentProposals > 1 ? 's' : ''} pendent${sentProposals > 1 ? 's' : ''} de resposta` });
  }
  if (confirmedBookings > 0) {
    alerts.push({ type: 'success', text: `${confirmedBookings} reserva${confirmedBookings > 1 ? 'es' : ''} confirmada${confirmedBookings > 1 ? 'es' : ''}` });
  }
  if (activeDiscounts.length > 0) {
    alerts.push({ type: 'info', text: `${activeDiscounts.length} codi${activeDiscounts.length > 1 ? 's' : ''} de descompte actiu${activeDiscounts.length > 1 ? 's' : ''} (${activeDiscounts.map(d => d.code).join(', ')})` });
  }




  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/customers/${data.customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No s'ha pogut desar");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant canvis');
    } finally {
      setSaving(false);
    }
  }, [data.customer.id, formData, router]);

  const cancelEdit = useCallback(() => {
    setFormData({
      name: data.customer.name || '',
      email: data.customer.email || '',
      phone: data.customer.phone || '',
      preferredLocale: 'ca',
    });
    setEditing(false);
    setError(null);
  }, [data.customer]);

  return (
    <section className="admin-customer-summary space-y-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.root)}>
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-xl border px-3 py-2 text-sm ${
                alert.type === 'warning'
                  ? 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning'
                  : alert.type === 'success'
                    ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                    : 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan'
              }`}
            >
              {alert.type === 'warning' && '⚠️ '}
              {alert.type === 'success' && '✅ '}
              {alert.type === 'info' && 'ℹ️ '}
              {alert.text}
            </div>
          ))}
        </div>
      )}

      <CrmStatusBar customer={data.customer} onTagsChange={() => router.refresh()} />

      <div className="admin-customer-card admin-customer-card--contact rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.contact)}>
        <div className="flex items-center justify-between">
          <h2 className="ap-h2">Informació de contacte</h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border px-3 py-1.5 text-xs"
              {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.edit)}
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="ap-btn ap-btn--xs disabled:opacity-50"
                {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.cancelEdit)}
              >
                Cancel·la
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="ap-btn ap-btn--primary ap-btn--xs"
                {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.save)}
              >
                {saving ? 'Desant...' : 'Desa'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 rounded-xl border px-3 py-2 text-xs">
            {error}
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoField
            label="Nom"
            value={formData.name}
            editing={editing}
            onChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
          />
          <InfoField
            label="Email"
            value={formData.email}
            editing={editing}
            type="email"
            onChange={(v) => setFormData((prev) => ({ ...prev, email: v }))}
          />
          <InfoField
            label="Telèfon"
            value={formData.phone}
            editing={editing}
            type="tel"
            onChange={(v) => setFormData((prev) => ({ ...prev, phone: v }))}
          />
          <InfoField
            label="Idioma preferit"
            value={formData.preferredLocale}
            editing={editing}
            type="select"
            options={[
              { value: 'ca', label: 'Català' },
              { value: 'es', label: 'Castellà' },
              { value: 'en', label: 'Anglès' },
            ]}
            onChange={(v) => setFormData((prev) => ({ ...prev, preferredLocale: v }))}
          />
        </div>
      </div>

      <ContactsSection customerId={data.customer.id} contacts={data.contacts ?? []} />

      <div className="admin-customer-card admin-customer-card--ops rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.operations)}>
        <h2 className="ap-h2">Resum operatiu</h2>
        <p className="mt-1 text-sm">
          Client des de {formatDate(data.customer.createdAt)}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pressupostos" value={data.proposals.length} detail={acceptedProposals > 0 ? `${acceptedProposals} acceptat${acceptedProposals > 1 ? 's' : ''}` : undefined} color="cyan" />
          <StatCard label="Reserves" value={data.bookings.length} detail={upcomingBookings.length > 0 ? `${upcomingBookings.length} pròxim${upcomingBookings.length > 1 ? 's' : ''}` : undefined} color="indigo" />
          <StatCard label="Tasques" value={openTasks} detail={urgentTasks > 0 ? `${urgentTasks} urgent${urgentTasks > 1 ? 's' : ''}` : 'cap pendent'} color={urgentTasks > 0 ? 'amber' : 'emerald'} />
          <StatCard
            label="Comunicacions"
            value={data.commSummary.total}
            detail={data.commSummary.lastContactAt ? `Última: ${formatRelativeDate(data.commSummary.lastContactAt)}` : undefined}
            color="violet"
          />
        </div>
      </div>

      {((data.kpis.totalQuoted ?? 0) > 0 || (data.kpis.totalPaid ?? 0) > 0) && (() => {
        const quoted = data.kpis.totalQuoted ?? 0;
        const paid = data.kpis.totalPaid ?? 0;
        const pct = quoted > 0 ? Math.round((paid / quoted) * 100) : 0;
        return (
          <div className="rounded-2xl border p-5">
            <h2 className="ap-h2">Resum financer</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider">Pressupostat</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(quoted)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider">Cobrat</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(paid)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider">Marge estimat</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.kpis.marginEstimated)}</p>
              </div>
            </div>
            {quoted > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Cobrament</span>
                  <span>{pct}%</span>
                </div>
                <div className="ch__summary-progress">
                  <div className="ch__summary-progress-bar" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {nextEvent && nextEvent.date && (
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider">Pròxim esdeveniment</p>
              <p className="mt-1 text-lg font-semibold">{nextEvent.reference || 'Reserva'}</p>
              <p className="text-sm">{formatDateFull(nextEvent.date)}{nextEvent.startTime && ` · ${nextEvent.startTime}`}</p>
              {nextEvent.location && <p className="text-xs mt-1">{nextEvent.location}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{getDaysUntil(nextEvent.date)}</p>
              <p className="text-xs">dies</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.nextSteps)}>
        <ActionCard
          title="Ubicació i ruta"
          isEmpty={!routeBooking}
          emptyText="Sense ubicació d'esdeveniment registrada encara"
          content={
            routeBooking && (
              <RouteSnapshotCard
                bookingId={routeBooking.id}
                location={routeBooking.location}
                venue={routeBooking.venue}
                distanceKm={routeBooking.distanceKm}
              />
            )
          }
          action={
            routeBooking
              ? <a href={buildBookingHref(routeBooking.id)} className="text-xs">Obrir reserva</a>
              : undefined
          }
        />

        <ActionCard
          title="Oportunitat comercial"
          isEmpty={!topLead}
          emptyText="Sense leads actives visibles"
          content={
            topLead && (
              <>
                <p className="text-sm font-medium">{topLead.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getLeadStatusDisplay(topLead.status).bg} ${getLeadStatusDisplay(topLead.status).text}`}>
                    {getLeadStatusDisplay(topLead.status).label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getLeadPriorityColorDisplay(topLead.priority).badgeClass}`}>
                    {getLeadPriorityColorDisplay(topLead.priority).label}
                  </span>
                </div>
                <p className="mt-1 text-xs">
                  {topLead.commercialBlocker?.label || 'Sense bloqueig comercial actiu'}
                  {topLead.commercialBlocker?.context ? ` · ${topLead.commercialBlocker.context}` : ''}
                </p>
                <p className="mt-2 text-xs opacity-70">
                  {getEventLabel(topLead.eventType)}
                  {topLead.eventDate ? ` · ${formatDateSimple(topLead.eventDate)}` : ''}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  Lead oberta {formatDateSimple(topLead.createdAt)}
                  {topLead.booking ? ` · Reserva ${topLead.booking.reference}` : ''}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  {topLead.booking ? `Conversió: reserva vinculada (${topLead.booking.reference})` : 'Conversió: sense reserva vinculada'}
                </p>
                {topLead.booking && (
                  <p className="mt-1 text-xs opacity-60">
                    Estat de la reserva: {topLead.booking.status === 'CONFIRMED' ? 'Confirmada' : topLead.booking.status}
                  </p>
                )}
                {topLead.booking?.date && (
                  <p className="mt-1 text-xs opacity-60">
                    Data de la reserva: {formatDateSimple(topLead.booking.date)}
                  </p>
                )}
                {topLead.booking?.date && (
                  <p className="mt-1 text-xs opacity-60">
                    Dies fins a la reserva: {getDaysUntil(topLead.booking.date)}
                  </p>
                )}
                {topLead.booking?.location && (
                  <p className="mt-1 text-xs opacity-60">
                    Ubicació: {topLead.booking.location}
                  </p>
                )}
                {topLead.booking?.venue && (
                  <p className="mt-1 text-xs opacity-60">
                    Recinte: {topLead.booking.venue}
                  </p>
                )}
                {typeof topLead.booking?.depositAmount === 'number' && (
                  <p className="mt-1 text-xs opacity-60">
                    Bestreta prevista: {formatCurrency(topLead.booking.depositAmount)}
                  </p>
                )}
                {typeof topLead.booking?.remainingAmount === 'number' && (
                  <p className="mt-1 text-xs opacity-60">
                    Pendent de cobrament: {formatCurrency(topLead.booking.remainingAmount)}
                  </p>
                )}
                {topLeadPaymentSummary && (
                  <p className="mt-1 text-xs opacity-60">
                    {topLeadPaymentSummary}
                  </p>
                )}
                {topLeadPaymentRisk && (
                  <p className="mt-1 text-xs admin-tone-text-warning">
                    {topLeadPaymentRisk}
                  </p>
                )}
                {topLead.booking?.discountCode && (
                  <p className="mt-1 text-xs opacity-60">
                    Descompte aplicat: {topLead.booking.discountCode}
                  </p>
                )}
                {topLead.booking?.eventType && (
                  <p className="mt-1 text-xs opacity-60">
                    Tipus de reserva: {getEventLabel(topLead.booking.eventType)}
                  </p>
                )}
                {(topLead.booking?.startTime || topLead.booking?.endTime) && (
                  <p className="mt-1 text-xs opacity-60">
                    Horari: {topLead.booking?.startTime || '—'}{topLead.booking?.endTime ? ` - ${topLead.booking.endTime}` : ''}
                  </p>
                )}
                {typeof topLead.booking?.guestCount === 'number' && (
                  <p className="mt-1 text-xs opacity-60">
                    Aforament previst: {topLead.booking.guestCount} convidats
                  </p>
                )}
                {topLead.booking && (
                  <p className="mt-1 text-xs opacity-60">
                    Valor de la reserva: {formatCurrency(topLead.booking.total)}
                  </p>
                )}
                {topLead.booking && (
                  <p className="mt-1 text-xs opacity-60">
                    Cobrament: {topLead.booking.depositPaid && topLead.booking.remainingPaid
                      ? 'Pagada'
                      : topLead.booking.depositPaid
                        ? 'Bestreta cobrada'
                        : 'Pagament pendent'}
                  </p>
                )}
                {topLeadActionChannel && (
                  <p className="mt-1 text-xs opacity-60">{topLeadActionChannel}</p>
                )}
                {topLeadActionUrgency && (
                  <p className="mt-1 text-xs opacity-60">{topLeadActionUrgency}</p>
                )}
                <a
                  href={buildCustomerWorkspaceTabHref(data.customer.id, 'comms')}
                  className="mt-3 inline-flex text-xs opacity-70 underline-offset-2 hover:underline"
                >
                  Anar a Comunicacions
                </a>
                {topLead.booking && (
                  <a href={buildBookingHref(topLead.booking.id)} className="mt-2 inline-flex text-xs opacity-70 underline-offset-2 hover:underline">
                    Obrir reserva vinculada
                  </a>
                )}
              </>
            )
          }
          action={
            topLeadAction
              ? (
                <a
                  href={topLeadAction.href}
                  target={topLeadAction.external ? '_blank' : undefined}
                  rel={topLeadAction.external ? 'noopener noreferrer' : undefined}
                  className="text-xs"
                >
                  {topLeadAction.label}
                </a>
              )
              : undefined
          }
        />

        <ActionCard
          title="Prioritat comercial"
          isEmpty={!commercialPriority}
          emptyText="Sense bloqueig comercial actiu"
          content={
            commercialPriority && (
              <>
                <p className="text-sm font-medium">{commercialPriority.title}</p>
                <p className="mt-1 text-xs">{commercialPriority.detail}</p>
                {commercialPriority.footnote && (
                  <p className="mt-2 text-xs opacity-70">{commercialPriority.footnote}</p>
                )}
              </>
            )
          }
          action={
            commercialRiskLink
              ? (
                <a
                  href={commercialRiskLink.href}
                  target={commercialRiskLink.external ? '_blank' : undefined}
                  rel={commercialRiskLink.external ? 'noopener noreferrer' : undefined}
                  className="text-xs"
                >
                  {commercialRiskLink.label}
                </a>
              )
              : undefined
          }
        />

        <ActionCard
          title="Pròxima tasca"
          isEmpty={!nextTask}
          emptyText="Sense tasques pendents"
          content={
            nextTask && (
              <>
                <p className="text-sm font-medium">{nextTask.title}</p>
                {nextTask.dueDate && (
                  <p className="mt-1 text-xs">Venciment: {formatDateSimple(nextTask.dueDate)}</p>
                )}
                {nextTask.priority === 'HIGH' && (
                  <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold">URGENT</span>
                )}
              </>
            )
          }
          action={<a href={customerTaskCreateHref} className="text-xs">+ Nova tasca</a>}
        />

        <ActionCard
          title="Reactivació suggerida"
          isEmpty={!data.reactivation}
          emptyText="Sense reactivació assistida ara mateix"
          content={
            data.reactivation && (
              <>
                <p className="text-sm font-medium">
                  {data.reactivation.reasonLabel} · Prioritat {data.reactivation.priority.toLowerCase()}
                </p>
                <p className="mt-1 text-xs">
                  {data.reactivation.daysSinceLastEvent != null
                    ? `Últim event fa ${data.reactivation.daysSinceLastEvent} dies`
                    : 'Sense últim event registrat'}
                  {data.reactivation.daysSinceLastContact != null
                    ? ` · últim contacte fa ${data.reactivation.daysSinceLastContact} dies`
                    : ''}
                </p>
                <p className="mt-2 text-xs opacity-70">
                  Canal suggerit: {data.reactivation.suggestedChannels.join(' · ') || 'email'}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  La reactivació queda en mode assistit: obrim esborrany, no enviament automàtic.
                </p>
                {reactivationTaskHref && (
                  <a href={reactivationTaskHref} className="mt-3 inline-flex text-xs opacity-70 underline-offset-2 hover:underline">
                    Crear tasca de reactivació
                  </a>
                )}
              </>
            )
          }
          action={
            data.reactivation
              ? (
                <div className="flex items-center gap-2">
                  <a
                    href={data.reactivation.whatsappUrl || data.reactivation.mailtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs"
                  >
                    {data.reactivation.whatsappUrl ? 'Obrir esborrany' : 'Preparar email'}
                  </a>
                  {reactivationTaskHref && (
                    <a href={reactivationTaskHref} className="text-xs">
                      Crear tasca
                    </a>
                  )}
                </div>
              )
              : undefined
          }
        />

        <ActionCard
          title={`Pròxims esdeveniments (${nextEvents.length})`}
          isEmpty={nextEvents.length === 0}
          emptyText="Sense esdeveniments programats"
          content={
            nextEvents.length > 0 && (
              <div className="space-y-3">
                {nextEvents.map((ev) => (
                  <div key={ev.id} className="rounded-xl border p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{ev.reference || 'Reserva'}</p>
                      <a href={buildBookingHref(ev.id)} className="text-xs">Obrir →</a>
                    </div>
                    <p className="mt-0.5 text-xs">{ev.date && formatDateFull(ev.date)}{ev.startTime && ` · ${ev.startTime}`}</p>
                    {ev.location && <p className="text-xs">📍 {ev.location}</p>}
                  </div>
                ))}
              </div>
            )
          }
          action={<a href={customerBookingCreateHref} className="text-xs">+ Nova reserva</a>}
        />
      </div>

      <div
        className="admin-customer-card admin-customer-card--quick rounded-2xl border p-5"
        data-testid="customer-summary-quick-actions"
        {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.quickActions)}
      >
        <h3 className="text-sm font-semibold">Accions ràpides</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <QuickAction
              key={`${action.href}-${action.label}`}
              href={action.href}
              label={action.label}
              color={action.color}
              external={action.external}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoField({ label, value, editing, type = 'text', options, onChange }: { label: string; value: string; editing: boolean; type?: 'text' | 'email' | 'tel' | 'select'; options?: Array<{ value: string; label: string }>; onChange: (value: string) => void; }) {
  const help = ADMIN_CUSTOMER_PANEL_HELP.summary.field(label);
  if (!editing) {
    return (
      <div {...helpAttrs(help)}>
        <p className="text-xs">{label}</p>
        <p className="mt-1 text-sm">{value || '—'}</p>
      </div>
    );
  }

  const fieldId = `sp-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (type === 'select' && options) {
    return (
      <div {...helpAttrs(help)}>
        <label htmlFor={fieldId} className="text-xs">{label}</label>
        <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div {...helpAttrs(help)}>
      <label htmlFor={fieldId} className="text-xs">{label}</label>
      <input id={fieldId} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
    </div>
  );
}

function StatCard({ label, value, detail, color }: { label: string; value: number; detail?: string; color: 'cyan' | 'indigo' | 'amber' | 'emerald' | 'violet'; }) {
  const colorStyles = {
    cyan: 'admin-tone-border-cyan admin-tone-bg-cyan',
    indigo: 'admin-tone-border-violet admin-tone-bg-violet',
    amber: 'admin-tone-border-warning admin-tone-bg-warning',
    emerald: 'admin-tone-border-success admin-tone-bg-success',
    violet: 'admin-tone-border-violet admin-tone-bg-violet',
  };

  return (
    <div className={`admin-customer-stat rounded-xl border p-3 ${colorStyles[color]}`} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.stat(label))}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-0.5 text-xs">{detail}</p>}
    </div>
  );
}

function ActionCard({ title, isEmpty, emptyText, content, action }: { title: string; isEmpty: boolean; emptyText: string; content: React.ReactNode; action?: React.ReactNode; }) {
  return (
    <div className="admin-customer-action-card rounded-2xl border p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.actionCard(title))}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider">{title}</p>
        {action}
      </div>
      <div className="mt-3">{isEmpty ? <p className="text-sm">{emptyText}</p> : content}</div>
    </div>
  );
}

function QuickAction({ href, label, color, external }: { href: string; label: string; color: 'cyan' | 'amber' | 'emerald' | 'indigo' | 'slate'; external?: boolean; }) {
  const colorStyles = {
    cyan: 'ch__summary-quick--info',
    amber: 'ch__summary-quick--warning',
    emerald: 'ch__summary-quick--success',
    indigo: 'ch__summary-quick--vip',
    slate: 'ch__summary-quick--muted',
  };

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`ch__summary-quick ${colorStyles[color]}`}
      {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.quickAction(label))}
    >
      {label}
    </a>
  );
}

function RouteSnapshotCard({
  bookingId,
  location,
  venue,
  distanceKm,
}: {
  bookingId: string;
  location?: string;
  venue?: string;
  distanceKm?: number;
}) {
  const destination = [venue, location].filter(Boolean).join(', ').trim();
  const [liveRoute, setLiveRoute] = useState<{
    oneWayKm: number;
    roundTripKm: number;
    durationText: string | null;
    originResolved?: string;
    destinationResolved?: string;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination || distanceKm != null) return;

    let cancelled = false;

    async function resolveRoute() {
      setLoading(true);
      setRouteError(null);

      try {
        const res = await fetchWithCsrf('/api/admin/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.error || 'No s\'ha pogut calcular la ruta');
        }
        if (cancelled) return;

        setLiveRoute({
          oneWayKm: Number(payload.oneWayKm || 0),
          roundTripKm: Number(payload.roundTripKm || 0),
          durationText: typeof payload.durationText === 'string' ? payload.durationText : null,
          originResolved: typeof payload.originResolved === 'string' ? payload.originResolved : undefined,
          destinationResolved: typeof payload.destinationResolved === 'string' ? payload.destinationResolved : undefined,
        });
      } catch (error) {
        if (!cancelled) {
          setRouteError(error instanceof Error ? error.message : 'Ruta no disponible ara mateix');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void resolveRoute();

    return () => {
      cancelled = true;
    };
  }, [destination, distanceKm]);

  if (!destination) {
    return <p className="text-sm">La reserva encara no té recinte ni població.</p>;
  }

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  const distanceLabel = distanceKm != null
    ? `${formatNumber(distanceKm, { maximumFractionDigits: 1 })} km A/T`
    : liveRoute
      ? `${formatNumber(liveRoute.roundTripKm, { maximumFractionDigits: 1 })} km A/T`
      : null;
  const oneWayLabel = liveRoute
    ? `${formatNumber(liveRoute.oneWayKm, { maximumFractionDigits: 1 })} km anada`
    : null;
  const sourceLabel = distanceKm != null ? 'Distància guardada a la reserva' : liveRoute ? 'Distància viva via Google Maps' : null;

  return (
    <>
      <p className="text-sm font-medium">{venue || location}</p>
      {venue && location && <p className="mt-1 text-xs">{location}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {distanceLabel && <span className="rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-2 py-0.5 admin-tone-text-cyan">🚗 {distanceLabel}</span>}
        {oneWayLabel && <span className="ch__summary-route-pill">{oneWayLabel}</span>}
        {liveRoute?.durationText && <span className="ch__summary-route-pill">⏱️ {liveRoute.durationText}</span>}
      </div>
      {sourceLabel && <p className="mt-2 text-xs opacity-70">{sourceLabel}</p>}
      {liveRoute?.originResolved && <p className="mt-1 text-xs opacity-60">Base Òrbita: {liveRoute.originResolved}</p>}
      {liveRoute?.destinationResolved && liveRoute.destinationResolved !== destination && (
        <p className="mt-1 text-xs opacity-60">Destí resolt: {liveRoute.destinationResolved}</p>
      )}
      {loading && <p className="mt-2 text-xs opacity-70">Calculant ruta real...</p>}
      {!loading && routeError && <p className="mt-2 text-xs admin-tone-text-warning">{routeError}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          Obrir a Google Maps
        </a>
        <a href={buildBookingHref(bookingId)} className="underline-offset-2 hover:underline">
          Veure fitxa completa
        </a>
      </div>
    </>
  );
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'avui';
  if (diffDays === 1) return 'ahir';
  if (diffDays < 7) return `fa ${diffDays} dies`;
  if (diffDays < 30) return `fa ${Math.floor(diffDays / 7)} setmanes`;
  return formatDateShort(date);
}

function buildReactivationTaskHref(
  customerId: string,
  customerName: string,
  reactivation: NonNullable<CustomerHubDTO['reactivation']>
): string {
  const params = new URLSearchParams({
    customerId,
    title: `Reactivar client: ${customerName}`,
    description: [
      `Motiu: ${reactivation.reasonLabel}`,
      reactivation.daysSinceLastEvent != null ? `Últim event fa ${reactivation.daysSinceLastEvent} dies.` : null,
      reactivation.daysSinceLastContact != null ? `Últim contacte fa ${reactivation.daysSinceLastContact} dies.` : null,
      `Canals suggerits: ${reactivation.suggestedChannels.join(', ') || 'email'}.`,
      'Acció assistida: revisar el missatge suggerit i decidir si s’envia.',
    ].filter(Boolean).join(' '),
    priority: reactivation.priority === 'ALTA' ? 'HIGH' : reactivation.priority === 'MITJANA' ? 'MEDIUM' : 'LOW',
    source: 'reactivation',
    taskSource: TASK_SOURCE.REACTIVATION,
    dedupeKey: TASK_DEDUPE_KEY.reactivation(customerId),
  });

  return `/admin/tasks/new?${params.toString()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CRM STATUS BAR — Lifecycle badge, health score, tags
// ═══════════════════════════════════════════════════════════════════════════

function CrmStatusBar({
  customer,
  onTagsChange,
}: {
  customer: CustomerHubDTO['customer'];
  onTagsChange: () => void;
}) {
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const lifecycle = (customer.lifecycleStage || 'NEW') as CustomerLifecycleValue;
  const healthScore = customer.healthScore;
  const tags = customer.tags || [];

  const handleAddTag = useCallback(async (tag: string) => {
    if (!tag.trim()) return;
    setSaving(true);
    try {
      await fetchWithCsrf(`/api/admin/customers/${customer.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', tags: [tag.trim()] }),
      });
      setNewTag('');
      setAddingTag(false);
      onTagsChange();
    } catch {
      console.error('Error afegint tag');
    } finally {
      setSaving(false);
    }
  }, [customer.id, onTagsChange]);

  const handleRemoveTag = useCallback(async (tag: string) => {
    try {
      await fetchWithCsrf(`/api/admin/customers/${customer.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', tags: [tag] }),
      });
      onTagsChange();
    } catch {
      console.error('Error eliminant tag');
    }
  }, [customer.id, onTagsChange]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Lifecycle badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${CUSTOMER_LIFECYCLE_COLORS[lifecycle]}`}>
          <span>{CUSTOMER_LIFECYCLE_ICONS[lifecycle]}</span>
          {CUSTOMER_LIFECYCLE_LABELS[lifecycle]}
        </span>

        {/* Health score */}
        {healthScore != null && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${getHealthColor(healthScore)}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {healthScore}/100 — {getHealthLabel(healthScore)}
          </span>
        )}

        {/* Referit per */}
        {customer.referredBy && (
          <a
            href={buildCustomerHubHref(customer.referredBy.id)}
            className="ch__summary-referral-link"
          >
            Referit per: <span>{customer.referredBy.name}</span>
          </a>
        )}

        {/* Referrals count */}
        {customer.referrals && customer.referrals.length > 0 && (
          <span className="ch__summary-referral-count">
            Ha referit {customer.referrals.length} client{customer.referrals.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CUSTOMER_TAG_COLORS[tag] || CUSTOMER_TAG_DEFAULT_COLOR}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
              aria-label={`Eliminar tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        {!addingTag ? (
          <button
            type="button"
            onClick={() => setAddingTag(true)}
            className="ch__summary-add-tag"
          >
            + tag
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag(newTag);
                if (e.key === 'Escape') { setAddingTag(false); setNewTag(''); }
              }}
              placeholder="Nou tag..."
              className="ch__summary-tag-input"
              autoFocus
              disabled={saving}
              list="tag-presets"
            />
            <datalist id="tag-presets">
              {CUSTOMER_TAG_PRESETS.filter((p) => !tags.includes(p)).map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => handleAddTag(newTag)}
              disabled={saving || !newTag.trim()}
              className="text-xs admin-tone-text-cyan hover:opacity-80 disabled:opacity-30"
            >
              {saving ? '...' : '✓'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTag(false); setNewTag(''); }}
              className="ch__summary-tag-cancel"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Contactes addicionals ───────────────────────────────────────────── */
type ContactForm = {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  isPrimary: boolean;
};

const EMPTY_FORM: ContactForm = { name: '', role: '', email: '', phone: '', notes: '', isPrimary: false };

function ContactsSection({ customerId, contacts: initialContacts }: { customerId: string; contacts: CustomerContactDTO[] }) {
  const [contacts, setContacts] = useState<CustomerContactDTO[]>(initialContacts);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const startEdit = (c: CustomerContactDTO) => {
    setEditId(c.id);
    setForm({ name: c.name, role: c.role || '', email: c.email || '', phone: c.phone || '', notes: c.notes || '', isPrimary: c.isPrimary });
    setAdding(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    try {
      const url = editId
        ? `/api/admin/customers/${customerId}/contacts/${editId}`
        : `/api/admin/customers/${customerId}/contacts`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email || null }),
      });
      const data = await res.json() as { ok: boolean; contact?: CustomerContactDTO; error?: string };
      if (!data.ok) { setError(data.error || 'Error'); return; }
      if (data.contact) {
        if (editId) {
          setContacts(prev => prev.map(c => c.id === editId ? data.contact! : c));
        } else {
          setContacts(prev => [...prev, data.contact!]);
        }
      }
      setAdding(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('[ContactsSection] error:', err);
      setError('Error de connexió');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetchWithCsrf(`/api/admin/customers/${customerId}/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
      if (editId === id) { setEditId(null); setForm(EMPTY_FORM); }
    } catch (err) {
      console.error('[ContactsSection] delete error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = adding || editId !== null;

  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="ap-h2">Persones de contacte</h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditId(null); setForm(EMPTY_FORM); }}
            className="rounded-xl border px-3 py-1.5 text-xs"
          >
            + Afegir contacte
          </button>
        )}
      </div>

      {contacts.length === 0 && !adding && (
        <p className="text-sm opacity-50">Cap contacte addicional registrat.</p>
      )}

      <div className="flex flex-col gap-3">
        {contacts.map(c => (
          <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{c.name}</span>
                {c.isPrimary && <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--ax-hair-gold)] text-[var(--ax-gold-bright)] bg-[color-mix(in_oklab,var(--ax-gold)_10%,var(--ax-panel))]">Principal</span>}
              </div>
              {c.role && <span className="text-xs opacity-60">{c.role}</span>}
              {c.email && <a href={`/admin/inbox/compose?to=${encodeURIComponent(c.email)}&customerId=${customerId}`} className="text-xs text-[var(--ax-gold-bright)]">{c.email}</a>}
              {c.phone && <a href={`tel:${c.phone}`} className="text-xs opacity-70">{c.phone}</a>}
              {c.notes && <p className="text-xs opacity-50 mt-1">{c.notes}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button type="button" onClick={() => startEdit(c)} className="rounded-lg border px-2 py-1 text-xs opacity-60 hover:opacity-100">✏</button>
              <button type="button" onClick={() => handleDelete(c.id)} disabled={saving} className="rounded-lg border px-2 py-1 text-xs opacity-60 hover:opacity-100">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="mt-4 rounded-xl border p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Nom *</label>
              <input id="contact-name" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="contact-role" className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Càrrec / rol</label>
              <input id="contact-role" type="text" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder="Director, Responsable..." />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Email</label>
              <input id="contact-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Telèfon</label>
              <input id="contact-phone" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="contact-notes" className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Notes</label>
            <textarea id="contact-notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(p => ({ ...p, isPrimary: e.target.checked }))} className="accent-amber-400" />
            Contacte principal
          </label>
          {error && <p className="text-xs admin-tone-text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()}
              className="ap-btn disabled:opacity-50">
              {saving ? 'Desant...' : editId ? 'Desar canvis' : 'Afegir'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setEditId(null); setForm(EMPTY_FORM); setError(''); }}
              className="rounded-xl px-4 py-2 text-sm border opacity-60 hover:opacity-100">
              Cancel·lar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
