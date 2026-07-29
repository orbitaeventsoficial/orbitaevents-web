'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_BOOKING_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

type FlowKey = 'PAYMENT' | 'POST_EVENT' | 'GENERAL';

type FlowState = {
  state: 'FALTA_ENVIAR' | 'ENVIADO' | 'RESPONDIDO';
  sentAt: string | null;
  respondedAt: string | null;
  lastChannel: string | null;
};

export default function CommunicationPanel({
  bookingId,
  clientName,
  clientPhone,
  initialStatuses,
}: {
  bookingId: string;
  clientName: string;
  clientPhone: string;
  initialStatuses: Record<FlowKey, FlowState>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<FlowKey | null>(null);
  const [error, setError] = useState<{ flow: FlowKey; message: string } | null>(null);

  function formatStatus(state: FlowState['state']): string {
    if (state === 'RESPONDIDO') return 'Respost';
    if (state === 'ENVIADO') return 'Enviat';
    return 'Falta enviar';
  }

  async function run(action: 'send_email' | 'send_whatsapp' | 'log_sent' | 'mark_responded', flow: FlowKey, channel?: 'email' | 'whatsapp') {
    setLoading(flow);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, flow, channel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Error de comunicació');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de comunicació';
      console.error('[CommunicationPanel] Error executant comunicació de reserva', {
        bookingId,
        flow,
        action,
        channel,
        error: err,
      });
      setError({
        flow,
        message,
      });
    } finally {
      setLoading(null);
    }
  }

  function waLink(flow: FlowKey) {
    const messageByFlow: Record<FlowKey, string> = {
      PAYMENT: `Hola ${clientName}, et contactem pel pagament pendent del teu esdeveniment.`,
      POST_EVENT: `Hola ${clientName}, et reenviem la valoració post-esdeveniment.`,
      GENERAL: `Hola ${clientName}, t'escrivim des d'Òrbita Events sobre el teu esdeveniment.`,
    };
    return `https://wa.me/${clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(messageByFlow[flow])}`;
  }

  const flows: Array<{ key: FlowKey; label: string }> = [
    { key: 'PAYMENT', label: 'Cobrament' },
    { key: 'POST_EVENT', label: 'Post-esdeveniment' },
    { key: 'GENERAL', label: 'General' },
  ];

  return (
    <section className="ap-card p-6" {...helpAttrs(ADMIN_BOOKING_HELP_3.communication.root)}>
      <h2 className="ap-h2">Comunicacions multicanal</h2>
      <div className="mt-3 space-y-3">
        {flows.map((flow) => {
          const status = initialStatuses[flow.key];
          const flowHasError = error?.flow === flow.key;
          return (
            <div key={flow.key} className="ap-card admin-tone-border-neutral p-3" {...helpAttrs(ADMIN_BOOKING_HELP_3.communication.flow)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{flow.label}</p>
                <p className="text-xs">
                  Estat: <strong>{formatStatus(status.state)}</strong>{' '}
                  {status.lastChannel ? `· últim canal ${status.lastChannel}` : ''}
                </p>
              </div>
              <div className="mt-1 text-xs">
                <span>Últim enviament: {formatDateTime(status.sentAt)}</span>
                <span className="mx-2">·</span>
                <span>Última resposta: {formatDateTime(status.respondedAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => run('send_email', flow.key)}
                  disabled={loading === flow.key}
                  aria-invalid={flowHasError ? true : undefined}
                  className="ap-btn ap-btn--primary px-2 py-1 text-xs disabled:opacity-60"
                >
                  Correu
                </button>
                <a
                  href={waLink(flow.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ap-btn ap-btn--secondary px-2 py-1 text-xs"
                >
                  Obrir WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => run('send_whatsapp', flow.key)}
                  disabled={loading === flow.key}
                  aria-invalid={flowHasError ? true : undefined}
                  className="ap-btn ap-btn--primary px-2 py-1 text-xs disabled:opacity-60"
                >
                  Envia per API de WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => run('log_sent', flow.key, 'whatsapp')}
                  disabled={loading === flow.key}
                  aria-invalid={flowHasError ? true : undefined}
                  className="ap-btn ap-btn--secondary px-2 py-1 text-xs disabled:opacity-60"
                >
                  Marcar enviat
                </button>
                <button
                  type="button"
                  onClick={() => run('mark_responded', flow.key)}
                  disabled={loading === flow.key}
                  aria-invalid={flowHasError ? true : undefined}
                  className="ap-btn admin-tone-border-success admin-tone-bg-success admin-tone-text-success px-2 py-1 text-xs disabled:opacity-60"
                >
                  Marcar respost
                </button>
              </div>
              {flowHasError && (
                <p className="mt-2 text-xs font-semibold admin-tone-text-danger" role="alert">
                  {error.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
