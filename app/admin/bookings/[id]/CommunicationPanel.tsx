'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  function formatStatus(state: FlowState['state']): string {
    if (state === 'RESPONDIDO') return 'Respondido';
    if (state === 'ENVIADO') return 'Enviado';
    return 'Falta enviar';
  }

  function formatDateTime(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('ca-ES');
  }

  async function run(action: 'send_email' | 'send_whatsapp' | 'log_sent' | 'mark_responded', flow: FlowKey, channel?: 'email' | 'whatsapp') {
    setLoading(flow);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, flow, channel }),
      });
      if (!res.ok) throw new Error('Error comunicación');
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function waLink(flow: FlowKey) {
    const messageByFlow: Record<FlowKey, string> = {
      PAYMENT: `Hola ${clientName}, te contactamos por el pago pendiente de tu evento.`,
      POST_EVENT: `Hola ${clientName}, te reenviamos la valoración post-evento.`,
      GENERAL: `Hola ${clientName}, te escribimos desde Òrbita Events sobre tu evento.`,
    };
    return `https://wa.me/${clientPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(messageByFlow[flow])}`;
  }

  const flows: Array<{ key: FlowKey; label: string }> = [
    { key: 'PAYMENT', label: 'Cobro' },
    { key: 'POST_EVENT', label: 'Post-evento' },
    { key: 'GENERAL', label: 'General' },
  ];

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Comunicaciones multicanal</h2>
      <div className="mt-3 space-y-3">
        {flows.map((flow) => {
          const status = initialStatuses[flow.key];
          return (
            <div key={flow.key} className="rounded-lg border border-stone-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{flow.label}</p>
                <p className="text-xs text-slate-500">
                  Estado: <strong>{formatStatus(status.state)}</strong>{' '}
                  {status.lastChannel ? `· último canal ${status.lastChannel}` : ''}
                </p>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                <span>Último envío: {formatDateTime(status.sentAt)}</span>
                <span className="mx-2">·</span>
                <span>Última respuesta: {formatDateTime(status.respondedAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => run('send_email', flow.key)}
                  disabled={loading === flow.key}
                  className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  Email
                </button>
                <a
                  href={waLink(flow.key)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-green-500 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600"
                >
                  Abrir WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => run('send_whatsapp', flow.key)}
                  disabled={loading === flow.key}
                  className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  Enviar WhatsApp API
                </button>
                <button
                  type="button"
                  onClick={() => run('log_sent', flow.key, 'whatsapp')}
                  disabled={loading === flow.key}
                  className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Marcar enviado
                </button>
                <button
                  type="button"
                  onClick={() => run('mark_responded', flow.key)}
                  disabled={loading === flow.key}
                  className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  Marcar respondido
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
