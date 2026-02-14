'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentReminderActions({
  bookingId,
  phone,
  message,
}: {
  bookingId: string;
  phone: string;
  message: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function sendEmailReminder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email', flow: 'PAYMENT' }),
      });
      if (!res.ok) throw new Error('No se pudo enviar email');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markWhatsAppSent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_sent', flow: 'PAYMENT', channel: 'whatsapp' }),
      });
      if (!res.ok) throw new Error('No se pudo guardar estado');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendWhatsAppApi() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_whatsapp', flow: 'PAYMENT' }),
      });
      if (!res.ok) throw new Error('No se pudo enviar WhatsApp API');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const waLink = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={sendEmailReminder}
        disabled={loading}
        className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? '...' : 'Email'}
      </button>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="rounded-md bg-green-500 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600"
      >
        Abrir WA
      </a>
      <button
        type="button"
        onClick={sendWhatsAppApi}
        disabled={loading}
        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        WA API
      </button>
      <button
        type="button"
        onClick={markWhatsAppSent}
        disabled={loading}
        className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        Marcar WA enviado
      </button>
    </div>
  );
}
