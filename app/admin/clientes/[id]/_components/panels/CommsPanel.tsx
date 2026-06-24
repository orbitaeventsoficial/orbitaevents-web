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
    <section className="ch__comms-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.root)}>
      <h2 className="ch__comms-heading">Comunicacions</h2>
      <p className="ch__comms-summary">Historial de correus, notes i seguiment.</p>

      <div className="ch__comms-card">
        <div className="ch__comms-card-head">
          <div className="ch__comms-card-copy">
            <p className="ch__comms-label">Fil canònic de conversa</p>
            <p className="ch__comms-card-value">{communicationSpine.stateLabel}</p>
            <p className="ch__comms-card-detail">{communicationSpine.detail}</p>
          </div>
          <span className="ch__comms-pill">{communicationSpine.ownerLabel}</span>
        </div>
        <div className="ch__comms-actions">
          <Link href={communicationSpine.hubHref} className="ch__comms-action">
            Obrir fil del client
          </Link>
          <Link href={communicationSpine.taskHref} className="ch__comms-action">
            Crear tasca des del fil
          </Link>
        </div>
      </div>

      <div className="ch__comms-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.quickActions)}>
        <p className="ch__comms-label">Accions ràpides</p>
        <div className="ch__comms-actions ch__comms-actions--quick">
          {nextActionLink && (
            nextActionLink.external ? (
              <a
                href={nextActionLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ch__comms-action ch__comms-action--strong"
              >
                {nextActionLink.label}
              </a>
            ) : (
              <Link href={nextActionLink.href} className="ch__comms-action ch__comms-action--strong">
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
                className="ch__comms-action"
              >
                {commercialRiskLink.label}
              </a>
            ) : (
              <Link href={commercialRiskLink.href} className="ch__comms-action">
                {commercialRiskLink.label}
              </Link>
            )
          )}
          <Link href={buildCustomerComposeHref(data.customer.id, 'primer-contacte')} className="ch__comms-action" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Plantilla 1r contacte'))}>
            Plantilla 1r contacte
          </Link>
          <Link href={buildCustomerComposeHref(data.customer.id, 'enviament-pressupost')} className="ch__comms-action" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Envia pressupost'))}>
            Envia pressupost
          </Link>
          <Link href={buildCustomerComposeHref(data.customer.id, 'recordatori')} className="ch__comms-action" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Recordatori'))}>
            Recordatori
          </Link>
          <Link href={customerTaskCreateHref} className="ch__comms-action" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.template('Crear tasca de seguiment'))}>
            Crear tasca de seguiment
          </Link>
        </div>
      </div>

      <div className="ch__comms-metrics">
        <article className="ch__comms-metric">
          <p className="ch__comms-metric-label">Últim contacte</p>
          <p className="ch__comms-metric-value">
            {commSummary.lastContactAt ? formatDateTime(commSummary.lastContactAt) : 'Sense contacte'}
          </p>
        </article>
        <article className="ch__comms-metric">
          <p className="ch__comms-metric-label">Dies sense contacte</p>
          <p className="ch__comms-metric-value">
            {commSummary.daysSinceLastContact ?? '—'}
          </p>
        </article>
        <article className="ch__comms-metric">
          <p className="ch__comms-metric-label">Gap resposta</p>
          <p className="ch__comms-metric-value">
            {commSummary.responseGap != null ? `${commSummary.responseGap} h` : '—'}
          </p>
        </article>
        <article className="ch__comms-metric">
          <p className="ch__comms-metric-label">Volum comunicació</p>
          <p className="ch__comms-metric-value">{commSummary.total}</p>
        </article>
      </div>

      <div className="ch__comms-card">
        <p className="ch__comms-label">Estat de conversa</p>
        <div className="ch__comms-pills">
          <span className="ch__comms-pill ch__comms-pill--strong">{responseState}</span>
          {lastTouchLabel && <span className="ch__comms-pill ch__comms-pill--muted">Últim toc · {lastTouchLabel}</span>}
        </div>
      </div>

      {followUpSummary && followUpSummary.total > 0 && followUpSummary.topItem && (
        <div className="ch__comms-card">
          <div className="ch__comms-card-head">
            <div className="ch__comms-card-copy">
              <p className="ch__comms-label">Seguiment canònic pendent</p>
              <p className="ch__comms-card-value">
                {followUpSummary.total} pendent{followUpSummary.total > 1 ? 's' : ''} · {followUpSummary.urgent} urgent{followUpSummary.urgent > 1 ? 's' : ''}
              </p>
            </div>
            <span className="ch__comms-pill">
              {followUpSummary.topItem.urgency} · {followUpSummary.topItem.daysSinceOutbound}d
            </span>
          </div>
          <p className="ch__comms-card-detail">{followUpSummary.topItem.suggestedAction}</p>
          <div className="ch__comms-actions">
            {commercialRiskLink ? (
              commercialRiskLink.external ? (
                <a
                  href={commercialRiskLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ch__comms-action"
                >
                  {commercialRiskLink.label}
                </a>
              ) : (
                <Link href={commercialRiskLink.href} className="ch__comms-action">
                  {commercialRiskLink.label}
                </Link>
              )
            ) : (
              <Link href={buildCustomerComposeHref(data.customer.id, 'seguiment')} className="ch__comms-action">
                ✉️ Preparar seguiment
              </Link>
            )}
            {followUpSummary.topItem.phone && (
              <a
                href={`https://wa.me/${followUpSummary.topItem.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ch__comms-action"
              >
                💬 WhatsApp
              </a>
            )}
            <Link
              href={buildCustomerWorkspaceTabHref(data.customer.id, 'comms')}
              className="ch__comms-action"
            >
              Obrir Customer Hub
            </Link>
          </div>
        </div>
      )}

      <div className="ch__comms-card">
        <p className="ch__comms-label">Repartiment per canal</p>
        <div className="ch__comms-pills">
          <span className="ch__comms-pill">📧 Email · {commSummary.channels.EMAIL}</span>
          <span className="ch__comms-pill">💬 WhatsApp · {commSummary.channels.WHATSAPP}</span>
          <span className="ch__comms-pill">📞 Trucades · {commSummary.channels.CALL}</span>
          <span className="ch__comms-pill">📝 Notes · {commSummary.channels.NOTE}</span>
        </div>
      </div>

      <div className="ch__comms-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.comms.note)}>
        <label className="ch__comms-label" htmlFor="customer-comms-note">Afegir nota interna</label>
        <textarea
          id="customer-comms-note"
          className="ch__comms-note-input"
          rows={3}
          placeholder="Escriu una nota de seguiment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="ch__comms-error">{error}</p>}
        <div className="ch__comms-note-actions">
          <button type="button" onClick={saveNote} disabled={saving || !note.trim()} className="ch__comms-save">
            {saving ? 'Desant...' : 'Desa nota'}
          </button>
        </div>
      </div>

      <div className="ch__comms-message-list">
        {data.messages.length === 0 ? (
          <p className="ch__comms-empty">No hi ha comunicacions encara.</p>
        ) : data.messages.slice(0, 40).map((message) => (
          <article key={message.id} className="ch__comm-card">
            <div className="ch__comm-head">
              <p className="ch__comm-title">{formatMessageTitle(message.subject, message.channel)}</p>
              <span className="ch__comms-pill ch__comms-pill--compact">{formatMessageChannel(message.channel)}</span>
            </div>
            {message.bodyPreview && <p className="ch__comm-preview">{message.bodyPreview}</p>}
            <p className="ch__comm-date">{formatDateTime(message.createdAt)}</p>
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
