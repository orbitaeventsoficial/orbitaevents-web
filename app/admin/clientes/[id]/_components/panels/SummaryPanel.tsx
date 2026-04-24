'use client';

import { useState, useCallback } from 'react';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDate, formatDateFull, formatDateShort, formatDateSimple, formatCurrency, getEventLabel, getLeadStatusDisplay } from '@/lib/constants';
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
  buildCustomerProposalHref,
  buildCustomerTaskCreateHref,
} from '@/lib/admin/customerWorkspaceHref';
import { getLeadPriorityColorDisplay } from '@/app/admin/leads/colorTheme';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { OwnerControlStrip } from '@/app/admin/components/OwnerControlStrip';

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
  const topLeadAction = topLead
    ? topLead.booking
      ? { href: `/admin/bookings/${topLead.booking.id}`, label: 'Obrir reserva', external: false as const }
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

  const ownerAutomaticSignals = [
    data.insights.commercialRisk.level !== 'NONE'
      ? `${data.insights.commercialRisk.label}${data.insights.commercialRisk.context ? ` · ${data.insights.commercialRisk.context}` : ''}`
      : null,
    data.reactivation
      ? `Reactivació detectada: ${data.reactivation.reasonLabel}`
      : null,
    nextEvent?.date
      ? `Pròxim esdeveniment en ${getDaysUntil(nextEvent.date)} dies`
      : null,
    activeDiscounts.length > 0
      ? `${activeDiscounts.length} codi${activeDiscounts.length > 1 ? 's' : ''} actiu${activeDiscounts.length > 1 ? 's' : ''}`
      : null,
  ].filter(Boolean) as string[];

  const ownerManualSignals = [
    urgentTasks > 0
      ? `${urgentTasks} tasca${urgentTasks > 1 ? 'ques' : ''} urgent${urgentTasks > 1 ? 's' : ''}`
      : null,
    draftProposals > 0
      ? `${draftProposals} pressupost${draftProposals > 1 ? 's' : ''} en esborrany`
      : null,
    sentProposals > 0 && acceptedProposals === 0
      ? `${sentProposals} pressupost${sentProposals > 1 ? 's' : ''} pendent${sentProposals > 1 ? 's' : ''} de resposta`
      : null,
    topLeadAction && topLead
      ? `Hi ha una oportunitat viva: ${topLead.name || 'lead activa'}`
      : null,
  ].filter(Boolean) as string[];

  const ownerNextStep = topLeadAction
    ? {
        title: topLeadAction.label,
        detail: topLead?.commercialBlocker?.label || topLeadActionChannel || 'Acció comercial assistida',
        href: topLeadAction.href,
        external: topLeadAction.external,
      }
    : reactivationTaskHref
      ? {
          title: 'Crear tasca de reactivació',
          detail: data.reactivation
            ? `${data.reactivation.reasonLabel} · prioritat ${data.reactivation.priority.toLowerCase()}`
            : 'Seguiment suggerit per al client',
          href: reactivationTaskHref,
          external: false,
        }
      : nextTask
        ? {
            title: nextTask.title,
            detail: nextTask.dueDate
              ? `Tasques pendents · venciment ${formatDateSimple(nextTask.dueDate)}`
              : 'Tasques pendents per revisar',
            href: customerTaskCreateHref,
            external: false,
          }
        : nextEvent
          ? {
              title: nextEvent.reference || 'Obrir reserva',
              detail: nextEvent.date
                ? `Pròxim esdeveniment · ${formatDateFull(nextEvent.date)}`
                : 'Reserva vinculada al client',
              href: `/admin/bookings/${nextEvent.id}`,
              external: false,
            }
          : {
              title: 'Enviar missatge',
              detail: 'No hi ha bloqueig crític, però convé mantenir el client actiu',
              href: customerComposeHref,
              external: false,
            };

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
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : alert.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-sky-500/40 bg-sky-500/10 text-sky-200'
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

      <OwnerControlStrip
        className="xl:grid-cols-[1.1fr_1.1fr_1.3fr]"
        system={{
          eyebrow: 'Automàtic',
          title: 'Què està vigilant el sistema',
          tone: 'info',
          items: ownerAutomaticSignals,
          emptyText: 'Sense senyals automàtiques destacades ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'Què et reclama decisió',
          tone: ownerManualSignals.length > 0 ? 'warning' : 'success',
          items: ownerManualSignals,
          emptyText: 'No hi ha cap front manual calent ara mateix.',
        }}
        nextStep={{
          title: ownerNextStep.title,
          detail: ownerNextStep.detail,
          href: ownerNextStep.href,
          external: ownerNextStep.external,
          secondaryAction: {
            href: customerTaskCreateHref,
            label: 'Preparar tasca',
          },
        }}
      />

      <CrmStatusBar customer={data.customer} onTagsChange={() => router.refresh()} />

      <div className="admin-customer-card admin-customer-card--contact rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.contact)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Informació de contacte</h2>
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
                className="rounded-xl border px-3 py-1.5 text-xs disabled:opacity-50"
                {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.cancelEdit)}
              >
                Cancel·la
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
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

      <div className="admin-customer-card admin-customer-card--ops rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.operations)}>
        <h2 className="text-lg font-semibold">Resum operatiu</h2>
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
            <h2 className="text-lg font-semibold">Resum financer</h2>
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
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
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
          title="Oportunitat comercial"
          isEmpty={!topLead}
          emptyText="Sense leads actives visibles"
          content={
            topLead && (
              <>
                <p className="text-sm font-medium">{topLead.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getLeadStatusDisplay(topLead.status).bg} ${getLeadStatusDisplay(topLead.status).text}`}>
                    {getLeadStatusDisplay(topLead.status).label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getLeadPriorityColorDisplay(topLead.priority).badgeClass}`}>
                    {getLeadPriorityColorDisplay(topLead.priority).label}
                  </span>
                </div>
                <p className="mt-1 text-xs">
                  {topLead.commercialBlocker?.label || 'Sense bloqueig comercial actiu'}
                  {topLead.commercialBlocker?.context ? ` · ${topLead.commercialBlocker.context}` : ''}
                </p>
                <p className="mt-2 text-[11px] opacity-70">
                  {getEventLabel(topLead.eventType)}
                  {topLead.eventDate ? ` · ${formatDateSimple(topLead.eventDate)}` : ''}
                </p>
                <p className="mt-1 text-[11px] opacity-60">
                  Lead oberta {formatDateSimple(topLead.createdAt)}
                  {topLead.booking ? ` · Reserva ${topLead.booking.reference}` : ''}
                </p>
                <p className="mt-1 text-[11px] opacity-60">
                  {topLead.booking ? `Conversió: reserva vinculada (${topLead.booking.reference})` : 'Conversió: sense reserva vinculada'}
                </p>
                {topLead.booking && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Estat de la reserva: {topLead.booking.status === 'CONFIRMED' ? 'Confirmada' : topLead.booking.status}
                  </p>
                )}
                {topLead.booking?.date && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Data de la reserva: {formatDateSimple(topLead.booking.date)}
                  </p>
                )}
                {topLead.booking?.date && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Dies fins a la reserva: {getDaysUntil(topLead.booking.date)}
                  </p>
                )}
                {topLead.booking?.location && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Ubicació: {topLead.booking.location}
                  </p>
                )}
                {topLead.booking?.venue && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Recinte: {topLead.booking.venue}
                  </p>
                )}
                {typeof topLead.booking?.depositAmount === 'number' && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Bestreta prevista: {formatCurrency(topLead.booking.depositAmount)}
                  </p>
                )}
                {typeof topLead.booking?.remainingAmount === 'number' && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Pendent de cobrament: {formatCurrency(topLead.booking.remainingAmount)}
                  </p>
                )}
                {topLeadPaymentSummary && (
                  <p className="mt-1 text-[11px] opacity-60">
                    {topLeadPaymentSummary}
                  </p>
                )}
                {topLeadPaymentRisk && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    {topLeadPaymentRisk}
                  </p>
                )}
                {topLead.booking?.discountCode && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Descompte aplicat: {topLead.booking.discountCode}
                  </p>
                )}
                {topLead.booking?.eventType && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Tipus de reserva: {getEventLabel(topLead.booking.eventType)}
                  </p>
                )}
                {(topLead.booking?.startTime || topLead.booking?.endTime) && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Horari: {topLead.booking?.startTime || '—'}{topLead.booking?.endTime ? ` - ${topLead.booking.endTime}` : ''}
                  </p>
                )}
                {typeof topLead.booking?.guestCount === 'number' && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Aforament previst: {topLead.booking.guestCount} convidats
                  </p>
                )}
                {topLead.booking && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Valor de la reserva: {formatCurrency(topLead.booking.total)}
                  </p>
                )}
                {topLead.booking && (
                  <p className="mt-1 text-[11px] opacity-60">
                    Cobrament: {topLead.booking.depositPaid && topLead.booking.remainingPaid
                      ? 'Pagada'
                      : topLead.booking.depositPaid
                        ? 'Bestreta cobrada'
                        : 'Pagament pendent'}
                  </p>
                )}
                {topLeadActionChannel && (
                  <p className="mt-1 text-[11px] opacity-60">{topLeadActionChannel}</p>
                )}
                {topLeadActionUrgency && (
                  <p className="mt-1 text-[11px] opacity-60">{topLeadActionUrgency}</p>
                )}
                <a href={buildLeadWorkspaceHref(topLead.id)} className="mt-3 inline-flex text-[11px] opacity-70 underline-offset-2 hover:underline">
                  Obrir fitxa de la lead
                </a>
                {topLead.booking && (
                  <a href={`/admin/bookings/${topLead.booking.id}`} className="mt-2 inline-flex text-[11px] opacity-70 underline-offset-2 hover:underline">
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
                  <p className="mt-2 text-[11px] opacity-70">{commercialPriority.footnote}</p>
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
                  <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold">URGENT</span>
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
                <p className="mt-2 text-[11px] opacity-70">
                  Canal suggerit: {data.reactivation.suggestedChannels.join(' · ') || 'email'}
                </p>
                <p className="mt-1 text-[11px] opacity-60">
                  La reactivació queda en mode assistit: obrim esborrany, no enviament automàtic.
                </p>
                {reactivationTaskHref && (
                  <a href={reactivationTaskHref} className="mt-3 inline-flex text-[11px] opacity-70 underline-offset-2 hover:underline">
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
                      <a href={`/admin/bookings/${ev.id}`} className="text-[11px]">Obrir →</a>
                    </div>
                    <p className="mt-0.5 text-xs">{ev.date && formatDateFull(ev.date)}{ev.startTime && ` · ${ev.startTime}`}</p>
                    {ev.location && <p className="text-[11px]">📍 {ev.location}</p>}
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
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    violet: 'border-violet-500/30 bg-violet-500/5',
  };

  return (
    <div className={`admin-customer-stat rounded-xl border p-3 ${colorStyles[color]}`} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.stat(label))}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-0.5 text-[11px]">{detail}</p>}
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
    cyan: 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10',
    amber: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
    emerald: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10',
    indigo: 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10',
    slate: 'border-white/15 text-white/60 hover:bg-white/10',
  };

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${colorStyles[color]}`}
      {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP.summary.quickAction(label))}
    >
      {label}
    </a>
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
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'currentColor' }} />
            {healthScore}/100 — {getHealthLabel(healthScore)}
          </span>
        )}

        {/* Referit per */}
        {customer.referredBy && (
          <a
            href={`/admin/clientes/${customer.referredBy.id}`}
            className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
          >
            Referit per: <span className="font-medium text-white/70">{customer.referredBy.name}</span>
          </a>
        )}

        {/* Referrals count */}
        {customer.referrals && customer.referrals.length > 0 && (
          <span className="text-xs text-white/50">
            Ha referit {customer.referrals.length} client{customer.referrals.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CUSTOMER_TAG_COLORS[tag] || CUSTOMER_TAG_DEFAULT_COLOR}`}
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
            className="rounded-full border border-dashed border-white/20 px-2.5 py-0.5 text-[11px] text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
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
              className="w-24 rounded-lg border border-white/20 bg-transparent px-2 py-0.5 text-[11px] text-white/80 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
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
              className="text-[11px] text-cyan-400 hover:text-cyan-300 disabled:opacity-30"
            >
              {saving ? '...' : '✓'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTag(false); setNewTag(''); }}
              className="text-[11px] text-white/40 hover:text-white/60"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
