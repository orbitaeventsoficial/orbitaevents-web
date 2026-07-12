'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDateTime } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';
import { buildCustomerCommercialRiskLink, buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import {
  buildCustomerComposeHref,
  buildCustomerProposalHref,
  buildCustomerTaskCreateHref,
  buildCustomerWorkspaceTabHref,
} from '@/lib/admin/customerWorkspaceHref';
import { ADMIN_ACTIVITY_ACTION_META } from '@/lib/constants/admin';
import { buildCustomerCommunicationSpine } from '@/lib/customer-hub/communicationSpine';

const CARD = 'rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3';
const LABEL = 'm-0 text-xs leading-tight text-[var(--t3)]';
const PILL = 'inline-flex max-w-full items-center justify-center rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] px-2.5 py-1.5 text-xs leading-tight text-[var(--t2)]';

export default function CommsPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commSummary = data.commSummary;
  const followUpSummary = data.followUpSummary;
  const communicationSpine = buildCustomerCommunicationSpine({
    customerId: data.customer.id,
    commSummary,
    followUpSummary,
  });
  const lastTouchLabel = [
    commSummary.lastContactChannel === 'EMAIL' ? 'Email'
      : commSummary.lastContactChannel === 'WHATSAPP' ? 'WhatsApp'
      : commSummary.lastContactChannel === 'CALL' ? 'Trucada'
      : commSummary.lastContactChannel === 'NOTE' ? 'Nota'
      : null,
    commSummary.lastContactDirection === 'INBOUND' ? 'entrant'
      : commSummary.lastContactDirection === 'OUTBOUND' ? 'sortint'
      : commSummary.lastContactDirection === 'INTERNAL' ? 'intern'
      : null,
  ].filter(Boolean).join(' · ');
  const responseState = commSummary.pendingResponseFrom === 'TEAM'
    ? 'Client esperant resposta'
    : commSummary.pendingResponseFrom === 'CLIENT'
      ? 'Pendents del client'
      : 'Sense cua de resposta';
  const nextActionLink = buildCustomerNextActionLink({
    customerId: data.customer.id,
    customerName: data.customer.name,
    customerPhone: data.customer.phone,
    nextAction: data.insights.nextAction,
    commSummary,
  });
  const commercialRiskLink = buildCustomerCommercialRiskLink({
    customerId: data.customer.id,
    customerName: data.customer.name,
    customerPhone: data.customer.phone,
    commercialRisk: data.insights.commercialRisk,
    followUpSummary,
  });
  const customerTaskCreateHref = buildCustomerTaskCreateHref(data.customer.id);

  const saveNote = async () => {
    const clean = note.trim();
    if (!clean || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/customers/${data.customer.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'NOTE_ADDED', note: clean }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'No s’ha pogut desar la nota');
      setNote('');
      router.refresh();
    } catch (err) {
      console.error('Error desant nota comunicació', err);
      setError(err instanceof Error ? err.message : 'Error desant la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSection title="Comunicacions" description="Historial de correus, notes i seguiment." help={ADMIN_CUSTOMER_PANEL_HELP_2.comms.root}>
      <div className="flex flex-col gap-3">
        <div className={CARD}>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 flex-[1_1_14rem]">
              <p className={LABEL}>Fil canònic de conversa</p>
              <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">{communicationSpine.stateLabel}</p>
              <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">{communicationSpine.detail}</p>
            </div>
            <span className={PILL}>{communicationSpine.ownerLabel}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={communicationSpine.hubHref} className="ap-btn ap-btn--xs">
              Obrir fil del client
            </Link>
            <Link href={communicationSpine.taskHref} className="ap-btn ap-btn--xs">
              Crear tasca des del fil
            </Link>
          </div>
        </div>

        <div className={CARD} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.quickActions)}>
          <p className={LABEL}>Accions ràpides</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextActionLink && (
              nextActionLink.external ? (
                <a
                  href={nextActionLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ap-btn ap-btn--primary ap-btn--xs"
                >
                  {nextActionLink.label}
                </a>
              ) : (
                <Link href={nextActionLink.href} className="ap-btn ap-btn--primary ap-btn--xs">
                  {nextActionLink.label}
                </Link>
              )
            )}
            {commercialRiskLink && (!nextActionLink || commercialRiskLink.href !== nextActionLink.href || commercialRiskLink.label !== nextActionLink.label) && (
              commercialRiskLink.external ? (
                <a
                  href={commercialRiskLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ap-btn ap-btn--xs"
                >
                  {commercialRiskLink.label}
                </a>
              ) : (
                <Link href={commercialRiskLink.href} className="ap-btn ap-btn--xs">
                  {commercialRiskLink.label}
                </Link>
              )
            )}
            <Link href={buildCustomerComposeHref(data.customer.id, 'primer-contacte')} className="ap-btn ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Plantilla 1r contacte'))}>
              Plantilla 1r contacte
            </Link>
            <Link href={buildCustomerProposalHref(data.customer.id)} className="ap-btn ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Envia pressupost'))}>
              Envia pressupost
            </Link>
            <Link href={buildCustomerComposeHref(data.customer.id, 'recordatori')} className="ap-btn ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Recordatori'))}>
              Recordatori
            </Link>
            <Link href={customerTaskCreateHref} className="ap-btn ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Crear tasca de seguiment'))}>
              Crear tasca de seguiment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 min-[961px]:grid-cols-4">
          <article className={CARD}>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Últim contacte</p>
            <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">
              {commSummary.lastContactAt ? formatDateTime(commSummary.lastContactAt) : 'Sense contacte'}
            </p>
          </article>
          <article className={CARD}>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Dies sense contacte</p>
            <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">
              {commSummary.daysSinceLastContact ?? '—'}
            </p>
          </article>
          <article className={CARD}>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Gap resposta</p>
            <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">
              {commSummary.responseGap != null ? `${commSummary.responseGap} h` : '—'}
            </p>
          </article>
          <article className={CARD}>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] leading-tight text-[var(--t3)]">Volum comunicació</p>
            <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">{commSummary.total}</p>
          </article>
        </div>

        <div className={CARD}>
          <p className={LABEL}>Estat de conversa</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`${PILL} font-semibold text-[var(--t)]`}>{responseState}</span>
            {lastTouchLabel && <span className={`${PILL} text-[var(--t3)]`}>Últim toc · {lastTouchLabel}</span>}
          </div>
        </div>

        {followUpSummary && followUpSummary.total > 0 && followUpSummary.topItem && (
          <div className={CARD}>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-[1_1_14rem]">
                <p className={LABEL}>Seguiment canònic pendent</p>
                <p className="m-0 mt-1 text-sm font-semibold leading-snug text-[var(--t)]">
                  {followUpSummary.total} pendent{followUpSummary.total > 1 ? 's' : ''} · {followUpSummary.urgent} urgent{followUpSummary.urgent > 1 ? 's' : ''}
                </p>
              </div>
              <span className={PILL}>
                {followUpSummary.topItem.urgency} · {followUpSummary.topItem.daysSinceOutbound}d
              </span>
            </div>
            <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">{followUpSummary.topItem.suggestedAction}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {commercialRiskLink ? (
                commercialRiskLink.external ? (
                  <a
                    href={commercialRiskLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-btn ap-btn--xs"
                  >
                    {commercialRiskLink.label}
                  </a>
                ) : (
                  <Link href={commercialRiskLink.href} className="ap-btn ap-btn--xs">
                    {commercialRiskLink.label}
                  </Link>
                )
              ) : (
                <Link href={buildCustomerComposeHref(data.customer.id, 'seguiment')} className="ap-btn ap-btn--xs">
                  ✉️ Preparar seguiment
                </Link>
              )}
              {followUpSummary.topItem.phone && (
                <a
                  href={`https://wa.me/${followUpSummary.topItem.phone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ap-btn ap-btn--xs"
                >
                  💬 WhatsApp
                </a>
              )}
              <Link
                href={buildCustomerWorkspaceTabHref(data.customer.id, 'comms')}
                className="ap-btn ap-btn--xs"
              >
                Obrir Customer Hub
              </Link>
            </div>
          </div>
        )}

        <div className={CARD}>
          <p className={LABEL}>Repartiment per canal</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={PILL}>📧 Email · {commSummary.channels.EMAIL}</span>
            <span className={PILL}>💬 WhatsApp · {commSummary.channels.WHATSAPP}</span>
            <span className={PILL}>📞 Trucades · {commSummary.channels.CALL}</span>
            <span className={PILL}>📝 Notes · {commSummary.channels.NOTE}</span>
          </div>
        </div>

        <div className={CARD} {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.note)}>
          <label className={LABEL} htmlFor="customer-comms-note">Afegir nota interna</label>
          <textarea
            id="customer-comms-note"
            className="adm-input adm-input--textarea mt-2"
            rows={3}
            placeholder="Escriu una nota de seguiment..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="m-0 mt-2 rounded-[var(--o-r-lg)] border border-[var(--o-admin-line)] px-2.5 py-2 text-xs leading-snug text-[var(--o-danger)]">{error}</p>}
          <div className="mt-2 flex justify-start">
            <button type="button" onClick={saveNote} disabled={saving || !note.trim()} className="ap-btn ap-btn--primary ap-btn--xs">
              {saving ? 'Desant...' : 'Desa nota'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {data.messages.length === 0 ? (
            <p className={`${CARD} m-0 text-sm leading-snug text-[var(--t2)]`}>No hi ha comunicacions encara.</p>
          ) : data.messages.slice(0, 40).map((message) => (
            <article key={message.id} className={CARD}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-sm font-semibold leading-snug text-[var(--t)]">{formatMessageTitle(message.subject, message.channel)}</p>
                <span className={`${PILL} px-2 py-1`}>{formatMessageChannel(message.channel)}</span>
              </div>
              {message.bodyPreview && <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">{message.bodyPreview}</p>}
              <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">{formatDateTime(message.createdAt)}</p>
            </article>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}

function formatMessageTitle(subject: string | undefined, channel: CustomerHubDTO['messages'][number]['channel']): string {
  const raw = subject?.trim();
  if (raw) {
    const direct = ADMIN_ACTIVITY_ACTION_META[raw as keyof typeof ADMIN_ACTIVITY_ACTION_META];
    if (direct?.label) return direct.label;
    if (raw === 'NOTE_ADDED') return 'Nota afegida';
    return raw;
  }

  return formatMessageChannel(channel);
}

function formatMessageChannel(channel: CustomerHubDTO['messages'][number]['channel']): string {
  if (channel === 'EMAIL') return 'Email';
  if (channel === 'WHATSAPP') return 'WhatsApp';
  if (channel === 'CALL') return 'Trucada';
  return 'Nota';
}
