'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDateTime } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerCommercialRiskLink, buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import {
  buildCustomerComposeHref,
  buildCustomerTaskCreateHref,
  buildCustomerWorkspaceTabHref,
} from '@/lib/admin/customerWorkspaceHref';
import { ADMIN_ACTIVITY_ACTION_META } from '@/lib/constants/admin';
import { buildCustomerCommunicationSpine } from '@/lib/customer-hub/communicationSpine';

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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'NOTE_ADDED', note: clean }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'No s’ha pogut desar la nota');
      setNote(''); router.refresh();
    } catch (err) { console.error('Error desant nota comunicació', err); setError(err instanceof Error ? err.message : 'Error desant la nota'); } finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.root)}>
      <h2 className="text-lg font-semibold">Comunicacions</h2>
      <p className="mt-1 text-sm">Historial de correus, notes i seguiment.</p>
      <div className="mt-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs">Fil canònic de conversa</p>
            <p className="mt-1 text-sm font-semibold">{communicationSpine.stateLabel}</p>
            <p className="mt-1 text-xs opacity-75">{communicationSpine.detail}</p>
          </div>
          <span className="rounded-full border px-2 py-1 text-xs">{communicationSpine.ownerLabel}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href={communicationSpine.hubHref} className="rounded border px-2 py-1">
            Obrir fil del client
          </Link>
          <Link href={communicationSpine.taskHref} className="rounded border px-2 py-1">
            Crear tasca des del fil
          </Link>
        </div>
      </div>
      <div className="mt-3 rounded-xl border p-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.quickActions)}>
        <p className="text-xs">Accions ràpides</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {nextActionLink && (
            nextActionLink.external ? (
              <a
                href={nextActionLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border px-2 py-1 text-xs font-semibold"
              >
                {nextActionLink.label}
              </a>
            ) : (
              <Link href={nextActionLink.href} className="rounded border px-2 py-1 text-xs font-semibold">
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
                className="rounded border px-2 py-1 text-xs"
              >
                {commercialRiskLink.label}
              </a>
            ) : (
              <Link href={commercialRiskLink.href} className="rounded border px-2 py-1 text-xs">
                {commercialRiskLink.label}
              </Link>
            )
          )}
          <Link href={buildCustomerComposeHref(data.customer.id, 'primer-contacte')} className="rounded border px-2 py-1 text-xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Plantilla 1r contacte'))}>Plantilla 1r contacte</Link>
          <Link href={buildCustomerComposeHref(data.customer.id, 'enviament-pressupost')} className="rounded border px-2 py-1 text-xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Envia pressupost'))}>Envia pressupost</Link>
          <Link href={buildCustomerComposeHref(data.customer.id, 'recordatori')} className="rounded border px-2 py-1 text-xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Recordatori'))}>Recordatori</Link>
          <Link href={customerTaskCreateHref} className="rounded border px-2 py-1 text-xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Crear tasca de seguiment'))}>Crear tasca de seguiment</Link>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wider opacity-60">Últim contacte</p>
          <p className="mt-1 text-sm font-semibold">
            {commSummary.lastContactAt ? formatDateTime(commSummary.lastContactAt) : 'Sense contacte'}
          </p>
        </article>
        <article className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wider opacity-60">Dies sense contacte</p>
          <p className="mt-1 text-sm font-semibold">
            {commSummary.daysSinceLastContact ?? '—'}
          </p>
        </article>
        <article className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wider opacity-60">Gap resposta</p>
          <p className="mt-1 text-sm font-semibold">
            {commSummary.responseGap != null ? `${commSummary.responseGap} h` : '—'}
          </p>
        </article>
        <article className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wider opacity-60">Volum comunicació</p>
          <p className="mt-1 text-sm font-semibold">{commSummary.total}</p>
        </article>
      </div>
      <div className="mt-3 rounded-xl border p-3">
        <p className="text-xs">Estat de conversa</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border px-2 py-1 font-semibold">{responseState}</span>
          {lastTouchLabel && <span className="rounded-full border px-2 py-1 opacity-75">Últim toc · {lastTouchLabel}</span>}
        </div>
      </div>
      {followUpSummary && followUpSummary.total > 0 && followUpSummary.topItem && (
        <div className="mt-3 rounded-xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs">Seguiment canònic pendent</p>
              <p className="mt-1 text-sm font-semibold">
                {followUpSummary.total} pendent{followUpSummary.total > 1 ? 's' : ''} · {followUpSummary.urgent} urgent{followUpSummary.urgent > 1 ? 's' : ''}
              </p>
            </div>
            <span className="rounded-full border px-2 py-1 text-xs">
              {followUpSummary.topItem.urgency} · {followUpSummary.topItem.daysSinceOutbound}d
            </span>
          </div>
          <p className="mt-2 text-xs opacity-75">{followUpSummary.topItem.suggestedAction}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {commercialRiskLink ? (
              commercialRiskLink.external ? (
                <a
                  href={commercialRiskLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border px-2 py-1"
                >
                  {commercialRiskLink.label}
                </a>
              ) : (
                <Link href={commercialRiskLink.href} className="rounded border px-2 py-1">
                  {commercialRiskLink.label}
                </Link>
              )
            ) : (
              <Link href={buildCustomerComposeHref(data.customer.id, 'seguiment')} className="rounded border px-2 py-1">
                ✉️ Preparar seguiment
              </Link>
            )}
            {followUpSummary.topItem.phone && (
              <a
                href={`https://wa.me/${followUpSummary.topItem.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border px-2 py-1"
              >
                💬 WhatsApp
              </a>
            )}
            <Link
              href={buildCustomerWorkspaceTabHref(data.customer.id, 'comms')}
              className="rounded border px-2 py-1"
            >
              Obrir Customer Hub
            </Link>
          </div>
        </div>
      )}
      <div className="mt-3 rounded-xl border p-3">
        <p className="text-xs">Repartiment per canal</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border px-2 py-1">📧 Email · {commSummary.channels.EMAIL}</span>
          <span className="rounded-full border px-2 py-1">💬 WhatsApp · {commSummary.channels.WHATSAPP}</span>
          <span className="rounded-full border px-2 py-1">📞 Trucades · {commSummary.channels.CALL}</span>
          <span className="rounded-full border px-2 py-1">📝 Notes · {commSummary.channels.NOTE}</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border p-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.note)}>
        <p className="text-xs">Afegir nota interna</p>
        <textarea className="mt-2 w-full rounded-xl border px-3 py-2 text-sm" rows={3} placeholder="Escriu una nota de seguiment..." value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="mt-2 rounded-md border px-2 py-1 text-xs">{error}</p>}
        <div className="mt-2"><button type="button" onClick={saveNote} disabled={saving || !note.trim()} className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? 'Desant...' : 'Desa nota'}</button></div>
      </div>
      <div className="mt-4 space-y-2">
        {data.messages.length === 0 ? (
          <p className="rounded-xl border p-3 text-sm">No hi ha comunicacions encara.</p>
        ) : data.messages.slice(0, 40).map((message) => (
          <article key={message.id} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold">{formatMessageTitle(message.subject, message.channel)}</p>
              <span className="rounded-full border px-2 py-0.5 text-xs opacity-70">{formatMessageChannel(message.channel)}</span>
            </div>
            {message.bodyPreview && <p className="mt-1 text-xs">{message.bodyPreview}</p>}
            <p className="mt-1 text-xs">{formatDateTime(message.createdAt)}</p>
          </article>
        ))}
      </div>
    </section>
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
